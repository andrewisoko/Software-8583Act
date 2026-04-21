import { Injectable, NotFoundException, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { Conversion } from '../iso_val_conversions/conversions';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { AccountDocument } from 'src/services/account_service/document/account.doc';
import { TRANSACTION_STATUS } from 'src/services/orchestrator/entity/transaction.entity';
import { AccountService} from 'src/services/account_service/account.service';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/services/web_terminal/entity/wt.entity';
import { conditions } from './isuuer_rules/issuer.rules.service';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';
import { error } from 'console';



@Injectable()
export class IssuerService implements OnModuleInit {

    private server: any;

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectModel('Account') private readonly accountModel: Model<AccountDocument>,
        private readonly accountService: AccountService,
        private readonly convertToVal: Conversion,
        private readonly httpService: HttpService,
        private readonly jwtService:JwtService,
        private readonly encrypt:EncryptSecurity
    ){}


    /*----------------------------*/
    /*----------------------------*/
    /*------SET UPFUNCTIONS-------*/
    /*----------------------------*/
    /*----------------------------*/


    parseIsoMessage(buffer) {

        const Iso8583 = require('iso_8583');

        const message = buffer.slice(2); // remove 2-byte length header

        const iso = new Iso8583();
        const parsed = iso.getIsoJSON(message);

        return parsed;

        };


    async findTransaction(stan:number){

        const transaction =  await this.transactionRepository.findOne({ where:{ stan:stan } }) 
        if (!transaction) throw new NotFoundException( "transaction not found" );

        return transaction
    };

    async placeHold(accountId: string, amount: number){

            console.log('account id placeHold', accountId )
            await this.accountModel.updateOne(
                { _id: accountId },
                { 
                  $inc: { available_balance: -amount, hold: amount }
                }
            );
        };

    async releaseHold(accountId: string, amount: number){

            await this.accountModel.updateOne(
                { _id: accountId },
                { 
                  $inc: { available_balance: amount, hold: -amount }
                }
            );
            console.log("Hold released",amount)
        };


    /*--------------------------------------------*/
    /*--------------------------------------------*/
    /*------CALL ACCOUNT SERVICE FUNCTION---------*/
    /*--------------------------------------------*/
    /*--------------------------------------------*/    
    
    async callAccountService(
        amount,
        transaction,
        expiryDate,
        rawPan,
        issuerToken,
        account
    ){

        const accountChecks = await firstValueFrom(
                this.httpService.post(
                'http://localhost:3002/api.gateway/account/account-checks',
                {
                    amount:amount,
                    transaction:transaction,
                    expiryDate:expiryDate,
                    pan: rawPan
                },
                {
                    headers: {
                        Authorization: `Bearer ${issuerToken}`
                    }
                }
                )) 

            const isApproved = accountChecks.data?.action === 'approved';
            
            if (!isApproved) {
                console.log("transaction at issuer not approved")
                return false;
            }
            const eventTimeStamp = new Date(Date.now())

            /*Place HOLD (local transaction) */
            await this.placeHold(account.id, amount);
            console.log('account id issuer service', account.id )

        
            try {

                /* Record transaction */

                transaction.status = TRANSACTION_STATUS.APPROVED;
                await this.transactionRepository.save(transaction);

                console.log({
                    responseCode: "00",
                    authCode: "9384FDC",
                    message: 'All data vaildated.'
                });

                } catch (error) {

                    /* COMPENSATION STEP */

                    await this.releaseHold(account.id, amount);
                    throw error;
                }

            return true;
    }


    async createTransactionContract (
        accountId:string,
        amount:number,
        terminalID:string,
        rawPan:string,
        expiryDate:string

    ){


     const accountsData = await this.accountModel.findOne({ _id:accountId }).exec()
     if (! accountsData) throw new NotFoundException("Account for contract agreement not found. ") 

                const newTransaction = await this.transactionRepository.create({
                    currency:"GBP",
                    amount:amount,
                    merchant:"TEST MERCHANT LONDON GB",
                    customer: { id: accountsData.customer },
                    account:accountId,
                    terminal: { id: terminalID },
                    panEncrypt: JSON.stringify(this.encrypt.encrypt(rawPan.toString())),
                    expiryEncrypt: JSON.stringify(this.encrypt.encrypt(expiryDate.toString())),
                })

                await this.transactionRepository.save(newTransaction);

                   await this.accountModel.updateOne(
                    { _id: accountsData._id },
                    { $push: { transactions: newTransaction.id } }
                );
        
        return newTransaction
    }

    
    
    /*-------------------------------------------*/
    /*-------------------------------------------*/
    /*------CALL LEDGER SERVICE FUNCTION---------*/
    /*-------------------------------------------*/
    /*-------------------------------------------*/
    

    async callLedgerService(
        pan,
        account,
        transaction,
        amount,
        eventTimeStamp,
        issuerToken
    ){
                 
            const maskPan:string = pan.toString().slice(-4).padStart(12,'*')
            
            const ledgerDoubleEntry = await firstValueFrom(
               this.httpService.post(
               'http://localhost:3002/api.gateway/ledger/double-entry',
               {
                   account_id: account.id,
                   transaction_id:transaction.id,
                   amount:amount,
                   currency:"GBP",
                   eventTimestamp:eventTimeStamp,
                   maskedPan:maskPan,
               },
               {
                 headers:{
                    Authorization: `Bearer ${issuerToken}`
                 }
               }
               )) 
           console.log("Ledger service response", ledgerDoubleEntry.data)
    }


    /*------------------------------*/
    /*------------------------------*/
    /*--------MAIN FUNCTION---------*/
    /*------------------------------*/
    /*------------------------------*/


    IssuerBankService(  ){


        this.server.once('connection', (socket) => {

            socket.on('data', async (data) => {

                let amount = 0;
                let account;

                console.log("Received ISO message:", data.toString('hex'));

                let responseCode = "51";
                const isoMsg = this.parseIsoMessage(data);
                
                
                amount = this.convertToVal.reverseIsoAmount(isoMsg[4]);
                const pan = isoMsg[2];
                const fullName = isoMsg[45];
                const stan = Number( isoMsg[11] );
                const expiryDate = this.convertToVal.reverseExpiry(isoMsg[14]);
                const rawPan = pan;
                const terminalID = isoMsg[41]
                
                
                account =  await this.accountService.findAccount(pan);
                const transaction = await this.findTransaction(stan);
                const eventTimeStamp = new Date(Date.now());
                
                const issuerToken = this.jwtService.sign({
                    account:account.id,
                    stan:stan,
                    role:Role.ISSUER
                })
                
            
                
                /* Assuming the issuer bank check came all correct: Customer account exists and is active, sufficient funds / available credit, PIN validation (if online PIN) */
    
                /* contract here */

               

                if ( conditions.length > 0 ){


                    console.log('set of agreements', conditions[0] );
                    const setAgreements = conditions[0];

                        for( const contractAccount of setAgreements.accounts ){
                            
                            console.log('accounts list', setAgreements.accounts );
                            let count = 0;
                            let contractTransaction

                            const prevAssignedAmount = this.convertToVal.reverseIsoAmount(isoMsg[4]);
                            const prevTransaction = await this.findTransaction(stan)


                            if( setAgreements.percentages.length > 1 ){
                           
                                amount = (( setAgreements.percentages[count] / 100) * prevAssignedAmount );

                                contractTransaction = count < 1 ? prevTransaction 
                                : await this.createTransactionContract(
                                    contractAccount,
                                    amount,
                                    terminalID,
                                    rawPan,
                                    expiryDate
                                )

                                if(! contractTransaction ) throw new Error ("contract transaction failed at creation")
                                contractTransaction.amount = amount;

                        
                                const approved = await this.callAccountService(
                                    amount,
                                    contractTransaction,
                                    expiryDate,
                                    rawPan,
                                    issuerToken,
                                    contractAccount
                                );
                                if (!approved) return;
        
                                await this.callLedgerService(
                                pan,
                                contractAccount,
                                transaction,
                                amount,
                                eventTimeStamp,
                                issuerToken
                                );

                                count =+ 1;
            

                            }else if( conditions[0].amounts.length > 1 ){
                                
                                const sumAmounts = conditions[0].amounts.reduce( ( acc, curr ) => acc + curr, 0 );
                                console.log( 'sum amount', sumAmounts );
                                
                                if( sumAmounts !==  prevAssignedAmount ) throw new Error( 'Invalid amount split [issuer service] ');
                                amount = conditions[0].amounts[count];

                                console.log( 'contract amount', amount );

                                contractTransaction = count < 1 ? prevTransaction 
                                : await this.createTransactionContract(
                                    contractAccount,
                                    amount,
                                    terminalID,
                                    rawPan,
                                    expiryDate
                                )

                                if(! contractTransaction ) throw new Error ("contract transaction failed at creation")
                                contractTransaction.amount = amount;
                               
                               const approved = await this.callAccountService(
                                    amount,
                                    contractTransaction,
                                    expiryDate,
                                    rawPan,
                                    issuerToken,
                                    contractAccount
                                );

                                if (!approved) return;
        
                                await this.callLedgerService(
                                pan,
                                contractAccount,
                                transaction,
                                amount,
                                eventTimeStamp,
                                issuerToken
                                );
        
                                count =+ 1
        
                            }
                        }

                }else{
                    
                    /* Authorisation process  */
            
                    const approved = await this.callAccountService(
                        amount,
                        transaction,
                        expiryDate,
                        rawPan,
                        issuerToken,
                        account
                    );

                    if (!approved) return;
            
                    
                    /*call on ledger service once transaction is authorised */
            
                    await this.callLedgerService(
                        pan,
                        account,
                        transaction,
                        amount,
                        eventTimeStamp,
                        issuerToken
                    );

                }
            
            });

        });
    }

    onModuleInit() {
        const net = require('net');
        this.server = net.createServer();
        this.server.listen(5000, () => {
            console.log("ISO8583 server running on port 5000");
        });
    }

}


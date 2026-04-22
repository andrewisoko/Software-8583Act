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
import { SettlementService } from 'src/services/settlement/settlement_engine/settlement.service';



@Injectable()
export class IssuerService implements OnModuleInit {

    private server: any;

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectModel('Account') private readonly accountModel: Model<AccountDocument>,
        private readonly accountService: AccountService,
        private readonly httpService: HttpService,
        private readonly jwtService:JwtService,
        private readonly settlementService: SettlementService,
        private readonly encrypt:EncryptSecurity,
        private readonly convertToVal: Conversion,
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
    
    async settlementSupport (transactionId){
        return await this.settlementService.updates( transactionId )
    }

    async findTargetAccount( accountId:string ){
        
        const accountsData = await this.accountModel.findOne({ _id:accountId }).exec();
        if (! accountsData) throw new NotFoundException("Account for contract agreement not found. ");
        
        return accountsData;

        };


    async createTransactionContract (
        accountId:string,
        amount:number,
        terminalId:string,
        rawPan:string,
        expiryDate:string

    ){

        const accountData = await this.findTargetAccount(accountId)

        const newTransaction = await this.transactionRepository.create({
            currency:"GBP",
            amount:amount,
            merchant:"TEST MERCHANT LONDON GB",
            customer: { id: accountData.customer },
            account:accountId,
            terminal: { id: terminalId },
            panEncrypt: JSON.stringify(this.encrypt.encrypt(rawPan.toString())),
            expiryEncrypt: JSON.stringify(this.encrypt.encrypt(expiryDate.toString())),
        })

        await this.transactionRepository.save(newTransaction);

            await this.accountModel.updateOne(
            { _id: accountData._id },
            { $push: { transactions: newTransaction.id } }
        );

        return newTransaction
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
        pan,
        issuerToken,
        accountId
    ){

        const accountChecks = await firstValueFrom(
                this.httpService.post(
                'http://localhost:3002/api.gateway/account/account-checks',
                {
                    amount:amount,
                    transaction:transaction,
                    expiryDate:expiryDate,
                    pan: pan
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
            await this.placeHold(accountId, amount);
        
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

                    await this.releaseHold(accountId, amount);
                    throw error;
                }

            return true;
    };


    
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

              

                console.log("Received ISO message:", data.toString('hex'));

                let responseCode = "51";
                const isoMsg = this.parseIsoMessage(data);
                
                
                const wholeAmount = this.convertToVal.reverseIsoAmount(isoMsg[4]);
                const pan = isoMsg[2];
                const fullName = isoMsg[45];
                const stan = Number( isoMsg[11] );
                const expiryDate = this.convertToVal.reverseExpiry(isoMsg[14]);
                // const rawPan = pan;
                const terminalId = isoMsg[41]
                
                
                const account =  await this.accountService.findAccount(pan);
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

                    let count = 0;
                    let splitAmount = 0;
                    let contractTransaction;

                    // console.log('set of agreements', conditions[0] );
                    const setAgreements = conditions[0];
                    
                    console.log(setAgreements)

                        for( const contractAccountId of setAgreements.accounts ){
                            
                            const prevTransaction = await this.findTransaction(stan);
                            const targetAccount = await this.findTargetAccount(contractAccountId);

                            if( setAgreements.percentages.length > 1 ){
                           
                                const splitAmount = (( setAgreements.percentages[count] / 100) * wholeAmount );
                                prevTransaction.amount = splitAmount;

                                contractTransaction = count < 1 ? prevTransaction 
                                : await this.createTransactionContract(
                                    contractAccountId,
                                    splitAmount,
                                    terminalId,
                                    targetAccount.pan,
                                    expiryDate
                                );

                                // console.log('contract transaction', contractTransaction );

                        
                                const approved = await this.callAccountService(
                                    splitAmount,
                                    contractTransaction,
                                    expiryDate,
                                    targetAccount.pan,
                                    issuerToken,
                                    contractAccountId
                                );
                                if (!approved) return;
        
                                await this.callLedgerService(

                                targetAccount.pan,
                                contractAccountId,
                                transaction,
                                splitAmount,
                                eventTimeStamp,
                                issuerToken
                                );

                                if(count > 0){
                                    this.settlementSupport(contractTransaction.id) //releasing receiver account hold and updating ledger balance. 
                                };
                                
                                count =+ 1;


                            }else if( setAgreements.amounts.length > 1 ){
                                
                                const sumAmounts = setAgreements.amounts.reduce( ( acc, curr ) => acc + curr, 0 );
                                console.log( 'sum amount', sumAmounts );
                                
                                if( sumAmounts !==  wholeAmount ) throw new Error( 'Invalid amount split [issuer service] ');
                                splitAmount = setAgreements.amounts[count];

                                console.log( 'contract amount', splitAmount );

                                contractTransaction = count < 1 ? prevTransaction 
                                : await this.createTransactionContract(
                                    contractAccountId,
                                    splitAmount,
                                    terminalId,
                                    targetAccount.pan,
                                    expiryDate
                                )

                                if(! contractTransaction ) throw new Error ("contract transaction failed at creation")
                                contractTransaction.amount = splitAmount;
                               
                               const approved = await this.callAccountService(
                                    splitAmount,
                                    contractTransaction,
                                    expiryDate,
                                    targetAccount.pan,
                                    issuerToken,
                                    contractAccountId
                                );

                                if (!approved) return;
        
                                await this.callLedgerService(

                                targetAccount.pan,
                                contractAccountId,
                                transaction,
                                splitAmount,
                                eventTimeStamp,
                                issuerToken
                                );
                                
                    
                                if(count > 0){
                                    this.settlementSupport(contractTransaction.id);
                                }

                                count =+ 1
        
                            }
                        }

                }else{
                    
                    /* Authorisation process  */
            
                    const approved = await this.callAccountService(
                        wholeAmount,
                        transaction,
                        expiryDate,
                        pan,
                        issuerToken,
                        account
                    );

                    if (!approved) return;
            
                    
                    /*call on ledger service once transaction is authorised */
            
                    await this.callLedgerService(
                        pan,
                        account,
                        transaction,
                        wholeAmount,
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


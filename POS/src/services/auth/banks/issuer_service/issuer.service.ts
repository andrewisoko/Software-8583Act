import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';
import { SetAgreements } from './isuuer_rules/issuer.rules.service';


@Injectable()
export class IssuerService {

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectModel('Account') private readonly accountModel: Model<AccountDocument>,
        private readonly accountService: AccountService,
        private readonly convertToVal: Conversion,
        private readonly httpService: HttpService,
        private readonly jwtService:JwtService,
        private readonly encryption: EncryptSecurity
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

    contractConditions( setAgreements:SetAgreements ){
        
        const conditions: SetAgreements[] = [];
        conditions.push(setAgreements);

        if ( conditions[0].split_agreement === 'percentage' || conditions[0].split_agreement === 'amount' ){

            return conditions;
        }else{
            throw new Error (' contract improperly filled ')
        }


    }

    async findTransaction(stan:number){

        const transaction =  await this.transactionRepository.findOne({ where:{ stan:stan } }) 
        if (!transaction) throw new NotFoundException( "transaction not found" );

        return transaction
    };

    async placeHold(accountId: string, amount: number){

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
                return;
            }
            const eventTimeStamp = new Date(Date.now())

            /*Place HOLD (local transaction) */

            await this.placeHold(account.id, amount);

        
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


    IssuerBankService( setAgreements?:SetAgreements ){

        let amount;
        let account;

        const net = require('net');

        const server = net.createServer((socket) => {

        socket.on('data',async (data) => {

            console.log("Received ISO message:", data.toString('hex'));

            let responseCode = "51";
            const isoMsg = this.parseIsoMessage(data);
            
            
            amount = this.convertToVal.reverseIsoAmount(isoMsg[4]);
            const pan = isoMsg[2];
            const fullName = isoMsg[45];
            const stan = Number( isoMsg[11] );
            const expiryDate = this.convertToVal.reverseExpiry(isoMsg[14]);
            const panJson = JSON.parse(pan) 
            const rawPan = this.encryption.decrypt(panJson)
            
            
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
            
            if ( setAgreements ){

                console.log('set of agreements received', setAgreements);
                const setAgreementProps = this.contractConditions(setAgreements);

                    for( const contractAccount of setAgreementProps[0].accounts ){
                        
                        let count;
                        const prevAssignedAmount = this.convertToVal.reverseIsoAmount(isoMsg[4]);

                        if( setAgreementProps[0].percentages.length > 1 ){

                            amount = ((setAgreementProps[0].percentages[count] / 100) * prevAssignedAmount);
    
                            console.log( 'contract amount', amount )
                            console.log( 'current count', count )
                            console.log( 'id account', contractAccount )
    
                           await this.callAccountService(
                            amount,
                            transaction,
                            expiryDate,
                            rawPan,
                            issuerToken,
                            contractAccount
                            );
    
                            await this.callLedgerService(
                            pan,
                            contractAccount,
                            transaction,
                            amount,
                            eventTimeStamp,
                            issuerToken
                            );
    
                            count =+ 1
                        }else if( setAgreementProps[0].amounts.length > 1 ){
                            
                            const sumAmounts = setAgreementProps[0].amounts.reduce( ( acc, curr ) => acc + curr, 0 );
                            console.log( 'sum amount', sumAmounts );
                            
                            if( sumAmounts !==  prevAssignedAmount ) throw new Error( 'Invalid amount split [issuer service] ');
                            amount = setAgreementProps[0].amounts[count];

                            console.log( 'contract amount', amount )
                            console.log( 'current count', count )
                            console.log( 'id account', contractAccount )
    
                           await this.callAccountService(
                            amount,
                            transaction,
                            expiryDate,
                            rawPan,
                            issuerToken,
                            contractAccount
                            );
    
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
        
                await this.callAccountService(
                    amount,
                    transaction,
                    expiryDate,
                    rawPan,
                    issuerToken,
                    account
                );
        
                
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
        server.listen(5000, () => {
            console.log("ISO8583 server running on port 5000");
        });

    });
    
  };

}


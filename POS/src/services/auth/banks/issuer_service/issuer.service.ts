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




@Injectable()
export class IssuerService {

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectModel('Account') private readonly accountModel: Model<AccountDocument>,
        private readonly accountService: AccountService,
        private readonly convertToVal: Conversion,
        private readonly httpService: HttpService,
        private readonly jwtService:JwtService,
    ){}

    
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
    

    IssuerBankService(){

    
        const net = require('net');
        const fs = require('fs');

        const server = net.createServer((socket) => {

        socket.on('data',async (data) => {

            console.log("Received ISO message:", data.toString('hex'));

            let responseCode = "51";
            const isoMsg = this.parseIsoMessage(data);
            
            
            const pan = isoMsg[2];
            const fullName = isoMsg[45];
            const stan = Number( isoMsg[11] );
            const amount = this.convertToVal.reverseIsoAmount(isoMsg[4]);
            const expiryDate = this.convertToVal.reverseExpiry(isoMsg[14]);
            
            const account =  await this.accountService.findAccount(pan);
            const transaction = await this.findTransaction(stan);
            
            const issuerToken = this.jwtService.sign({
                account:account.id,
                stan:stan,
                role:Role.ISSUER
            })
        
            
            /*Authorisation process */

         
            const accountChecks = await firstValueFrom(
                 this.httpService.post(
                    'http://localhost:3002/api.gateway/account/account-checks',
                    {
                        amount:amount,
                        transaction:transaction,
                        expiryDate:expiryDate,
                        pan:pan
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
        
        /*call on ledger service once transaction is authorised */

            
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
    });
        
        
    });
    server.listen(5000, () => {
        console.log("ISO8583 server running on port 5000");
    });
    
  };

}


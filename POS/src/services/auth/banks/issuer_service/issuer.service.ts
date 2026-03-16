import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Conversion } from '../iso_val_conversions/conversions';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';
import { Account } from 'src/services/account_service/entity/account.entity';
import { TRANSACTION_STATUS } from 'src/services/orchestrator/entity/transaction.entity';





@Injectable()
export class IssuerService {

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
        private readonly convertToVal: Conversion,
        private readonly encryption: EncryptSecurity,
    ){}

    
    parseIsoMessage(buffer) {

        const Iso8583 = require('iso_8583');

        const message = buffer.slice(2); // remove 2-byte length header

        const iso = new Iso8583();
        const parsed = iso.getIsoJSON(message);

        return parsed;

        };

  
    /* function that sends the metadata payload to legdger service  */
    /* adjust the issuer logic and move the account related function to account service */
    /* internal calls to ledger and account service. */

    async decryptPanByFullName(fullNameAcc: string) {

        const account = await this.accountRepository.findOne({ where: { fullName: fullNameAcc } });
        if (!account) throw new NotFoundException("account not found");

            const encryptedObj = JSON.parse(account.panEncrypt);
             const rawPan = this.encryption.decrypt(encryptedObj);
             
            account.panEncrypt = rawPan;
            await this.accountRepository.save(account);

        return account

        }
    
    async findAccount(pan:string,fullName:string){

        await this.decryptPanByFullName(fullName);

            const account = await this.accountRepository.findOne({ where: {panEncrypt: pan }});
            if (!account) throw new NotFoundException("account not found");

            const panEncrypt = JSON.stringify(this.encryption.encrypt(pan));
            account.panEncrypt = panEncrypt;
            await this.accountRepository.save(account);

        return account
    };

    async findTransaction(stan:number){

        const transaction =  await this.transactionRepository.findOne({ where:{ stan:stan } }) 
        if (!transaction) throw new NotFoundException( "transaction not found" );

        return transaction
    };

    async placeHold(accountId: string, amount: number){

            await this.accountRepository.decrement(
                { id: accountId },
                "available_balance",
                amount
            );
            await this.accountRepository.increment(
                { id: accountId },
                "hold",
                amount
            );
        };

    async releaseHold(accountId: string, amount: number){

            await this.accountRepository.increment(
                { id: accountId },
                "available_balance",
                amount
            );

            await this.accountRepository.decrement(
                { id: accountId },
                "hold",
                amount
            );
            console.log("Hold released",amount)
        };
    
    async failTransaction(transaction: Transaction, responseCode: string) {

        transaction.status = TRANSACTION_STATUS.DECLINED;
    
        await this.transactionRepository.save(transaction);

        console.log(
             {
            responseCode: responseCode,
            authCode: null,
            message: "Transaction declined"
        }
    );
}

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
            
            const account =  await this.findAccount(pan,fullName);
            const transaction = await this.findTransaction(stan);
            
            const expObj = JSON.parse(account.expiryEncrypt);
            const panObj = JSON.parse(account.panEncrypt);
            
            const accountExpDateDecrypted = this.encryption.decrypt(expObj);
            const accPanDecrypted = this.encryption.decrypt(panObj);
            const availableBalance = account.ledger_balance - amount
            
            
            /*Authorisation process */

            /* -------------------------
                 SAGA PATTERN STEPS
            --------------------------*/
                
        if(amount > account.available_balance){
            return this.failTransaction(transaction, "51");
        }
            
        if(account.status !== "ACTIVE"){
            return this.failTransaction(transaction, "05");
        }

        if (expiryDate !== accountExpDateDecrypted){
            return this.failTransaction(transaction,"54")
        }
        if (pan !== accPanDecrypted){
            return this.failTransaction(transaction,"14")
        }

        /*Place HOLD (local transaction) */

        // await this.placeHold(account.id, amount);

        
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

            
    });
        
        
    });
    server.listen(5000, () => {
        console.log("ISO8583 server running on port 5000");
    });
    
};

}


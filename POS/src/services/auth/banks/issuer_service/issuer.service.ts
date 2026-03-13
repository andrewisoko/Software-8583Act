import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Conversion } from '../iso_val_conversions/conversions';
import { ConfigService } from '@nestjs/config';
import { PartyBankAccount } from '../partyBankAccount';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';
import { Account } from 'src/services/account_service/entity/account.entity';
import { TRANSACTION_STATUS } from 'src/services/orchestrator/entity/transaction.entity';
import { threadCpuUsage } from 'process';




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

  

    async decryptPanByFullName(fullNameAcc: string) {

        const account = await this.accountRepository.findOne({ where: { fullName: fullNameAcc } });
        if (!account) throw new NotFoundException("account not found");

            console.log("acc pan", typeof(account.panEncrypt))
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

    IssuerBankService(){

    
        const net = require('net');
        const fs = require('fs');

        const server = net.createServer((socket) => {

        socket.on('data',async (data) => {

            console.log("Received ISO message:", data.toString('hex'));

            let responseCode = "51";
            const isoMsg = this.parseIsoMessage(data);
            
            /*Authorisation process */
            
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
            
            await this.accountRepository.decrement({ id: account.id },'ledger_balance', amount);
            await this.accountRepository.increment({ id: account.id },'available_balance', availableBalance);
            await this.accountRepository.increment({ id: account.id },'hold', amount);

                
            if(
                amount < account.ledger_balance 
                || expiryDate == accountExpDateDecrypted 
                || pan == accPanDecrypted
                || account.status !== "ACTIVE"
            ){
                responseCode = "00"
                
                transaction.status = TRANSACTION_STATUS.APPROVED

                account.hold = 0
                await this.accountRepository.decrement({ id: account.id },'ledger_balance', amount);
                await this.accountRepository.increment({ id: account.id },'available_balance', availableBalance);
                
                await this.accountRepository.save(account)
                await this.transactionRepository.save(transaction)
                
                console.log({
                    "Authorisation_code": "9384FDC",
                    "Response_code": responseCode,
                    "Reason": "All data vaildated."
                })
                
                console.log(`response: ${responseCode}`);

            }
            else{
                transaction.status = TRANSACTION_STATUS.DECLINED;

                await this.accountRepository.save(account);
                await this.transactionRepository.save(transaction);
                console.log(`response: ${responseCode}`);
            }
            
        });
        
        
    });
    server.listen(5000, () => {
        console.log("ISO8583 server running on port 5000");
    });
    
};

}


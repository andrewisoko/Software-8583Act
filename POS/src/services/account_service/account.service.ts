import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';
import { Repository } from 'typeorm';
import { Transaction } from '../orchestrator/entity/transaction.entity';
import { TRANSACTION_STATUS } from '../orchestrator/entity/transaction.entity';
import { NotFoundException } from '@nestjs/common';
import { EncryptSecurity } from '../orchestrator/encryption/encrypt.security';


@Injectable()
export class AccountService {


    constructor(
        @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        private readonly encryption: EncryptSecurity
    ){}

    async decryptPanByFullName(fullNameAcc: string) {

        const account = await this.accountRepository.findOne({ where: { fullName: fullNameAcc } });
        if (!account) throw new NotFoundException("account not found");

            const encryptedObj = JSON.parse(account.panEncrypt);
            const rawPan = this.encryption.decrypt(encryptedObj);
            
            account.panEncrypt = rawPan;
            await this.accountRepository.save(account);

        return account

    };

    async findAccount(pan:string,fullName:string){

        await this.decryptPanByFullName(fullName);

            const account = await this.accountRepository.findOne({ where: {panEncrypt: pan }});
            if (!account) throw new NotFoundException("account not found");

            const panEncrypt = JSON.stringify(this.encryption.encrypt(pan));
            account.panEncrypt = panEncrypt;
            await this.accountRepository.save(account);

        return account
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

    async accountChecks(
        fullName,
        amount,
        transaction,
        expiryDate,
        pan,
    ){

        const account = await this.findAccount(pan,fullName)
        if (!account) throw new NotFoundException("account not found");

            const expObj = JSON.parse(account.expiryEncrypt);
            const panObj = JSON.parse(account.panEncrypt);
                
            const accountExpDateDecrypted = this.encryption.decrypt(expObj);
            const accPanDecrypted = this.encryption.decrypt(panObj);

                
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
        
        return "Approved"

        }     
    };

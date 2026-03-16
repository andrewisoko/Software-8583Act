import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';
import { Repository } from 'typeorm';
import { Transaction } from '../orchestrator/entity/transaction.entity';
import { TRANSACTION_STATUS } from '../orchestrator/entity/transaction.entity';
import { NotFoundException } from '@nestjs/common';


@Injectable()
export class AccountService {
    constructor(
        @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
          @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
    ){}

    async findAccount(pan:string,fullName:string){

        await this.decryptPanByFullName(fullName);

            const account = await this.accountRepository.findOne({ where: {panEncrypt: pan }});
            if (!account) throw new NotFoundException("account not found");

            const panEncrypt = JSON.stringify(this.encryption.encrypt(pan));
            account.panEncrypt = panEncrypt;
            await this.accountRepository.save(account);

        return account
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

 async accountChecks(){

               
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
        
};

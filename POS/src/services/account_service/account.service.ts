import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../orchestrator/entity/transaction.entity';
import { TRANSACTION_STATUS } from '../orchestrator/entity/transaction.entity';
import { NotFoundException } from '@nestjs/common';
import { EncryptSecurity } from '../orchestrator/encryption/encrypt.security';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ACCOUNT_STATUS, AccountDocument } from './document/account.doc';





@Injectable()
export class AccountService {


    constructor(
        // @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
        @InjectModel('Account') private accountModel: Model<AccountDocument>,
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        private readonly encryption: EncryptSecurity
    ){}



    async findAccount( pan:string ){

            const account = await this.accountModel.findOne( {pan: pan } );
            if (!account) throw new NotFoundException("account not found");

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
        amount,
        transaction,
        expiryDate,
        pan,
        ) {

        const account = await this.findAccount( pan );
        if (!account) throw new NotFoundException("account not found");

        const accountExpDate = account.expiry;
        const accountPan = account.pan;

        /* -------------------------
            
             SAGA PATTERN STEPS
    
         --------------------------*/

        if (amount > account.available_balance) {
            await this.failTransaction(transaction, "51");
            return { action: 'declined', code: '51' };
        }

        if (account.status !== ACCOUNT_STATUS.ACTIVE ) {
            await this.failTransaction(transaction, "05");
            return { action: 'declined', code: '05' };
        }

        if (expiryDate !== accountExpDate) {
            await this.failTransaction(transaction, "54");
            return { action: 'declined', code: '54' };
        }

        if (pan !== accountPan) {
            await this.failTransaction(transaction, "14");
            return { action: 'declined', code: '14' };
        }

        return { action: 'approved', code: '00' };
        }
 
    };

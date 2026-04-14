import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../orchestrator/entity/transaction.entity';
import { TRANSACTION_STATUS } from '../orchestrator/entity/transaction.entity';
import { NotFoundException } from '@nestjs/common';
import { EncryptSecurity } from '../orchestrator/encryption/encrypt.security';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AccountDocument } from './document/account.doc';




@Injectable()
export class AccountService {


    constructor(
        // @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
        @InjectModel('Account') private accountModel: Model<AccountDocument>,
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        private readonly encryption: EncryptSecurity
    ){}

    // async decryptPanByFullName(fullNameAcc: string) {

    //     const account = await this.accountModel.findOne({ fullName:fullNameAcc }).exec();
    //     if (!account) throw new NotFoundException("account not found");

    //         const encryptedObj = JSON.parse(account.panEncrypt);
    //         const rawPan = this.encryption.decrypt(encryptedObj);
            
    //         account.panEncrypt = rawPan;
    //         await account.save();

    //     return account

    // };

    async findAccount( pan:string ){

        // await this.decryptPanByFullName(fullName);

            const account = await this.accountModel.findOne( {panEncrypt: pan } );
            if (!account) throw new NotFoundException("account not found");

            const panEncrypt = JSON.stringify(this.encryption.encrypt(pan));
            account.panEncrypt = panEncrypt;

            await account.save();

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

        const expObj = JSON.parse(account.expiryEncrypt);
        const panObj = JSON.parse(account.panEncrypt);

        const accountExpDateDecrypted = this.encryption.decrypt(expObj);
        const accPanDecrypted = this.encryption.decrypt(panObj);

        /* -------------------------
            
             SAGA PATTERN STEPS
    
         --------------------------*/

        if (amount > account.available_balance) {
            await this.failTransaction(transaction, "51");
            return { action: 'declined', code: '51' };
        }

        if (account.status !== "ACTIVE") {
            await this.failTransaction(transaction, "05");
            return { action: 'declined', code: '05' };
        }

        if (expiryDate !== accountExpDateDecrypted) {
            await this.failTransaction(transaction, "54");
            return { action: 'declined', code: '54' };
        }

        if (pan !== accPanDecrypted) {
            await this.failTransaction(transaction, "14");
            return { action: 'declined', code: '14' };
        }

        return { action: 'approved', code: '00' };
        }
 
    };

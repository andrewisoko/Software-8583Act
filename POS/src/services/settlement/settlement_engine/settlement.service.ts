import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from 'src/services/account_service/entity/account.entity';
import { Ledger } from 'src/services/ledger.service/entity/ledger.entity';
import { Transaction, TRANSACTION_STATUS } from 'src/services/orchestrator/entity/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SettlementService {

    constructor(
      @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
      @InjectRepository(Ledger) private readonly ledgerRepository:Repository<Ledger>,
      @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
    ){}

    async findTransactStatus(id:string){

      const transaction = await this.transactionRepository.findOne({where:{id:id}});
      if (!transaction) throw new Error ("Transaction not found");

      return transaction.status

    }

    async updates(id:string){

      const transactionStatus = await this.findTransactStatus(id);
      if (transactionStatus !== TRANSACTION_STATUS.APPROVED) throw new Error("Transaction not approved.");

      const account = await this.accountRepository.findOne({
        where:{
          transactions:{
            id:id
          }}});
      if (!account) throw new Error ("Transaction not found");

      const newLedgerBalance = account.ledger_balance = account.available_balance;
      const resettledHold = account.hold = 0;

      await this.accountRepository.manager.transaction( async manager =>{
      manager.save([newLedgerBalance,resettledHold]);

      console.log("ledger balance", account.ledger_balance);
      console.log("hold", account.hold);

        return "Account updated";
      })
        
      const findTransactionRecord = await this.ledgerRepository.findOne({where:{transaction_id:id}});

      /**update record. */

    }


}

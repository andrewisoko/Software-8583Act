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

      const transaction = await this.transactionRepository.findOne({where:{id:id}});
      if (!transaction) throw new Error ("Transaction not found");

      const transactionStatus = await this.findTransactStatus(id);
      if (transactionStatus !== TRANSACTION_STATUS.APPROVED) throw new Error("Transaction at settlement level not approved.");

      const account = await this.accountRepository.findOne({
        where:{
          transactions:{
            id:id
            }
          },
          relations:["transactions"]
        });
      if (!account) throw new Error ("Account at settlement level not found");


     

      await this.accountRepository.decrement({id:account.id},'ledger_balance',account.hold);
      await this.accountRepository.decrement({id:account.id},'hold',account.hold);

      transaction.status = TRANSACTION_STATUS.SETTLED
      await this.transactionRepository.save(transaction)

         console.log ({
            message: "Account updated",
            transaction_status: transaction.status
        } );
      }
   
    }


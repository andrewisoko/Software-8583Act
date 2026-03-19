import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Ledger, LedgerDirection, LedgerEntryType } from './entity/ledger.entity';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';




export interface LedgerRecord {
    account_id:string,
    transaction_id:string,
    amount:number,
    currency:string,
    eventTimestamp:Date,
    maskedPan:string,
    idempotencyKey: string;
    

}

@Injectable()
export class LedgerService {

    /* saving metadata to ledger table, return a status (SUCCESS or FAILED). */
    constructor(
        @InjectRepository(Ledger) private readonly ledgerRepository: Repository<Ledger>
    ){}

    async saveDoubleEntry(
        ledgerRecord:LedgerRecord
    ){
        const key = randomUUID();

        const debitledgerRecord = await this.ledgerRepository.create({

            account_id:ledgerRecord.account_id,
            transaction_id:ledgerRecord.transaction_id,
            amount:ledgerRecord.amount,
            currency:ledgerRecord.currency,
            direction: LedgerDirection.DEBIT,
            entry_type:LedgerEntryType.AUTHORIZATION_HOLD,
            event_timestamp:ledgerRecord.eventTimestamp,
            masked_pan:ledgerRecord.maskedPan,
            idempotency_key:key

        })

    }
}

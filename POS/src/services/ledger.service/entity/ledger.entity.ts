import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';

export enum LedgerDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

export enum LedgerEntryType {
  AUTHORIZATION_HOLD = 'AUTHORIZATION_HOLD',
  CLEARING = 'CLEARING',
  REVERSAL = 'REVERSAL',
  REFUND = 'REFUND'
}

@Entity('ledger_entries')
export class Ledger {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transaction_id: string;
  
  @Column({nullable:true})
  account_id: string;
  
  @Column('decimal', { precision: 15, scale: 2 })
  amount: number;
  
  @Column('varchar', { length: 3, default: "GBP" })
  currency: string;
  
  @Column({
    type: 'enum',
    enum: LedgerDirection
  })
  direction: LedgerDirection;

  @Column({
    type: 'enum',
    enum: LedgerEntryType
  })
    entry_type: LedgerEntryType;
  
  @Column({ type: 'timestamptz' })
    event_timestamp: Date;
  
  @Column({nullable:true})
    masked_pan: string;
  
  @Index({ unique: true })
  @Column()
    idempotency_key: string;
  
  @CreateDateColumn()
    created_at: Date;
  
  @Column('varchar',{length:50, default:"550e8400-e29b-31d4-a715-446655440000"})
    account:string;

  @ManyToOne(() => Transaction, transaction => transaction.ledgerEntries, { nullable: false })
  @JoinColumn({ name: 'transaction_id' })
    transaction: Transaction;

}
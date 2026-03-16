import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn
} from 'typeorm';

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
export class LedgerEntry {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  entry_id: string;

 
  @Column()
  transaction_id: string;

  @Column()
  account_id: string;

  @Column('decimal', { precision: 6, scale: 2, default: 100 })
  amount: number;

  @Column({ length: 3 })
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

  @Column({ length: 19 })
  masked_pan: string;

  @Index({ unique: true })
  @Column()
  idempotency_key: string;

  @CreateDateColumn()
  created_at: Date;
}
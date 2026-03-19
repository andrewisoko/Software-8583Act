import { Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Party } from "src/services/party_service/entity/party.entity";
import { Transaction } from "src/services/orchestrator/entity/transaction.entity";
import { Ledger } from "src/services/ledger.service/entity/ledger.entity";



@Entity("Account")
export class Account{

    @PrimaryGeneratedColumn('uuid')
        id: string;
 
    @Column( 'text',{default: 'fekwjdekdoSISISIS'})
        panEncrypt:string;
    
    @Column('varchar', { length: 20, default: 'Johnson Handsome' })
        fullName:string;

    @Column({ name: 'customer_id' })
        customerId: string;     

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
        ledger_balance: number;  

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
        available_balance: number;              

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
        hold: number;               

    @Column({ length: 3, default: 'GBP' })
        currency: string;
    
    @Column( 'text', {default: '12/33 '})
        expiryEncrypt:string

    @Column({ default: 'ACTIVE' })
        status: 'ACTIVE' | 'BLOCKED' | 'CLOSED';

    @CreateDateColumn({ name: 'created_at' })
        createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
        updatedAt: Date;

    @OneToMany(() => Transaction, transaction => transaction.customer)
        transactions: Transaction[];

    @OneToMany(() => Ledger, ledger => ledger.account)
        ledgerEntries: Ledger[];

    @OneToMany(() => Ledger, ledger =>  ledger.idempotency_key)
        ledgers: Ledger[];

    @ManyToOne(() => Party)
        @JoinColumn({ name: 'customer_id' })
        customer: Party;
        }




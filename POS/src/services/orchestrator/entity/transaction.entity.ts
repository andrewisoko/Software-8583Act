import { Terminal } from "src/services/web_terminal/entity/wt.entity";
import { Party } from "src/services/party_service/entity/party.entity";
import { Entity,PrimaryColumn,Column, ManyToOne,OneToMany,CreateDateColumn, OneToOne } from "typeorm";
import { Account } from "src/services/account_service/entity/account.entity";
import { RuleEngine } from "src/services/rule_engine_service/entity/rule.engine.entity";
import { Ledger } from "src/services/ledger.service/entity/ledger.entity";



export enum TRANSACTION_STATUS {
    PENDING = "pending",
    APPROVED = "approved",
    DECLINED = "declined",
    REFUNDED = "refunded"
}

@Entity("Transaction")
export class Transaction {


    @PrimaryColumn({
        type: 'varchar',
        unique: true,
        default: () => `'TRN_' || nextval('transaction_sequence')`
        })
        id: string;

    @Column('varchar', { length:3, default:"GBP" })
    currency:string;

    @Column('decimal', { precision: 6, scale: 2, default: 100 })
    amount:number

    @Column( 'decimal' ,{ default: 129347 })
    stan:number /*Systems Trace Audit Number*/

      @Column({
        type:"enum",
        enum:TRANSACTION_STATUS,
        default:TRANSACTION_STATUS.PENDING,
    })
    status: TRANSACTION_STATUS;

    @CreateDateColumn({ name:'timestamp' })
    timestamp:Date

    @Column( 'text' )
    expiryEncrypt:string;
    
    @Column( 'text' )
    panEncrypt:string;
 
    @Column('varchar', {length: 50 ,default:"TEST MERCHANT LONDON GB"})
    merchant:string;

    @OneToMany(() => Ledger, ledger => ledger.transaction)
    ledgerEntries: Ledger[];

    @OneToOne(()=>RuleEngine,ruleEngine =>ruleEngine.transaction)
    ruleEngine:RuleEngine

    @ManyToOne(()=>Account,account =>account.transactions)
    account:Account; 

    @ManyToOne(()=>Party,party =>party.transactions)
    customer:Party;

    @ManyToOne(()=>Terminal,terminal =>terminal.transactions)
    terminal:Terminal;
}


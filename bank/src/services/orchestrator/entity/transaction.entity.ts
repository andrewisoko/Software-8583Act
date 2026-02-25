import { Terminal } from "src/services/web_terminal/entity/wt.entity";
import { Party } from "src/services/party_service/entity/party.entity";
import { Entity,PrimaryColumn,Column, ManyToOne,CreateDateColumn } from "typeorm";
import { Account } from "src/services/account_service/entity/account.entity";

export enum TRANSACTION_STATUS {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
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

    @Column({
         type: 'numeric',
        precision: 12,
        nullable: false,
        default: 0 
    })
    amount:number

      @Column({
        type:"enum",
        enum:TRANSACTION_STATUS,
        default:TRANSACTION_STATUS.PENDING,
    })
    status: TRANSACTION_STATUS;

    @CreateDateColumn({ name:'timestamp' })
    timestamp:Date
    
    @Column({nullable:true})
    panToken:string;
    
    @Column('varchar', {length: 25 ,default:"Merchant Tutorial"})
    merchant:string;

    @ManyToOne(()=>Account,account =>account.id)
    account:Account; 

    @ManyToOne(()=>Party,party =>party.fullName)
    customer:Party[]

    @ManyToOne(()=>Terminal,terminal =>terminal.signature)
    terminal:Terminal[]
}


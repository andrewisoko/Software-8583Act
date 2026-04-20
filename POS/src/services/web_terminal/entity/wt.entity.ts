import { PrimaryColumn,Column,Entity,CreateDateColumn,OneToMany } from "typeorm";
import { Transaction } from "src/services/orchestrator/entity/transaction.entity";

export enum Role {
    ISSUER = "issuer",
    TERMINAL = "terminal",
    NULL = "null"
}

@Entity("terminal")
export class Terminal{

   @PrimaryColumn({
        type: 'varchar',
        unique: true,
        default: () => `'TERMID0' || nextval('terminal_sequence')`
        }
   )
        id: string;

    @Column('text' , { default: "accesstokenGGtutorial" })
        acc_token:string;

    @Column({ type:'integer',  default: 87671023 })
        serialNumber:number;

    @Column( 'varchar', { length:21, default:"1.2.840.113549.1.1.11"} )
        signature:string;

    @Column( 'varchar', { length:50, default:"ISSUER BANK"} )
    issuer:string;

    @Column('varchar', { length: 50, default:"TEST MERCHANT LONDON GB"} )
    subject:string;

    @Column({
        type:"enum",
        enum:Role,
        default:Role.NULL
    })
    role:Role

    @CreateDateColumn({name:'timestamp'})
        timestamp:Date

    @OneToMany(() => Transaction, transaction => transaction.terminal)
        transactions: Transaction[];

}
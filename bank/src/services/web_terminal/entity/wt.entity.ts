import { PrimaryGeneratedColumn,Column,Entity,CreateDateColumn } from "typeorm";

export enum Role {
    CUSTOMER = "customer",
    TERMINAL = "terminal"
}

@Entity("Terminal")
export class Terminal{

   @PrimaryGeneratedColumn('uuid')
        id: string;

    @Column({ type:'numeric', precision:8 ,scale:0 })
    serialNumber:number;

    @Column( 'varchar', { length:21, default:"1.2.840.113549.1.1.11"} )
    signature:string;

    @Column( 'varchar', { length:20, default:"Tutorial Bank"} )
    issuer:string;

    @Column('varchar', { length:20, default:"Merchant Tutorial"} )
    subject:string;

    @Column({
        type:"enum",
        enum:Role,
        default:Role.CUSTOMER
    })
    role:Role

 @CreateDateColumn({name:'timestamp'})
    timestamp:Date

}
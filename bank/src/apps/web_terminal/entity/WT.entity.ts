import { PrimaryGeneratedColumn,Column,Entity } from "typeorm";

export enum Role {
    CUSTOMER = "customer",
    TERMINAL = "terminal"
}

Entity("terminals")
export class Terminal{

    @PrimaryGeneratedColumn()
    id:number;

    @Column()
    serialNumber:number;

    @Column()
    signature:string;

    @Column()
    issuer:string;

    @Column()
    subject:string;

    @Column({
        type:"enum",
        enum:Role,
        default:Role.CUSTOMER
    })
    role:Role

}
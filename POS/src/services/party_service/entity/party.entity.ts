import { Entity,PrimaryColumn,Column,BeforeInsert, PrimaryGeneratedColumn,OneToMany } from "typeorm";
import { Transaction } from "src/services/orchestrator/entity/transaction.entity";


export enum TIERS {
    TIER_0 = "tier_0",
    TIER_1 = "tier_1",
    TIER_2 = "tier_2",
    TIER_3 = "tier_3",
    TIER_4 = "tier_4"
}

export enum STATUS{
    
    ACTIVE = "active",
    INACTIVE = 'Inactive',
    SUSPENDED = 'Suspended',
    CLOSE  = 'Closed',
    PENDING = 'Pending',
}

@Entity("party")
export class Party {

    @PrimaryColumn({type:'text'})
    id:string;

    @Column('varchar', { length: 20, default: 'Name Surname' })
    full_name:string;

    @Column('varchar', { length: 90, default: '10 London Street CH15 8XF UNITED KINGDOM' })
    address:string /* not best approach to store addresss but efficient enough for the tutorial */

    @Column({ type: 'numeric', precision: 10, scale: 0, default:"0123456789"})
    contact_details: number;

    @Column({
        type:"enum",
        enum:TIERS,
        default:TIERS.TIER_2
    })
    kyc:TIERS;

    @Column({
        type:"enum",
        enum:STATUS,
        default:STATUS.ACTIVE
         }
    )
    status:STATUS;

    @OneToMany(() => Transaction, transaction => transaction.customer)
    transactions: Transaction[];

}



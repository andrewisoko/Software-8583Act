import { Entity,PrimaryColumn,Column,BeforeInsert } from "typeorm";


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

@Entity("Party")
export class Party {

     @PrimaryColumn('varchar', { length: 20 })
         id: string;
    
    @BeforeInsert()
        setId() {
            const random = Math.floor(1000 + Math.random() * 9000); 
            this.id = `PARTY_${random}`;
        }

    @Column('varchar', { length: 20 })
    fullName:string

    @Column()
    address:string

    @Column()
    contactDetails:number

    @Column({
        type:"enum",
        enum:TIERS,
        default:TIERS.TIER_2
    })
    kyc:TIERS

    @Column({
        type:"enum",
        enum:STATUS,
        default:STATUS.ACTIVE
         }
    )
    status:STATUS

}



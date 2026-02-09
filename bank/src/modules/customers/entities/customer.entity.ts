import { Column,PrimaryColumn} from "typeorm";
import { Entity } from "typeorm";

export enum STATUS {
     ACTIVE = "active",
    INACTIVE = 'Inactive',
    SUSPENDED = 'Suspended',
    CLOSE  = 'Closed',
    PENDING = 'Pending',
}

export enum TIERS {

    TIER_0 = "tier_0",  
    TIER_1 = "tier_1",  
    TIER_2 = "tier_2",  
    TIER_3 = "tier_3",  
    TIER_4 = "tier_4",  
}


@Entity("customers")
export class Customer {

    @PrimaryColumn()
    id:string;

    @Column()
    name:string;

    @Column({
        type:"enum",
        enum:STATUS,
        default:STATUS.ACTIVE
    })
    status:STATUS;
    
    /* these are regulations to check the credibility of the identity. from 0 which is vague to 4 representing a verified enhanced due diligence, source of wealth, etc.*/
    @Column({
        type:"enum",
        enum:TIERS,
        default:TIERS.TIER_2
    })
    kyc_level:TIERS;

    
    @Column()
    created_at:Date;
}

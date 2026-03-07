import { PrimaryGeneratedColumn,Column,Entity,CreateDateColumn,OneToMany,JoinColumn} from "typeorm";
import { Transaction } from "src/services/orchestrator/entity/transaction.entity";



@Entity("Acquirer")
export class Acquirer{

   @PrimaryGeneratedColumn('uuid')
        id: string;

    @Column({
         type: 'numeric',
        precision: 12,
        nullable: false,
        default: 0 
    })
        gross_amount:number

    @Column('decimal', { precision: 6, scale: 2, default: 0.74 })
        fee: number;

    @Column({
         type: 'numeric',
        precision: 12,
        nullable: false,
        default: 0 
    })
        merchant_net_amount:number

    @Column('varchar', {length: 50 ,default:"TEST MERCHANT LONDON GB"})
        merchant:string;
        
    @CreateDateColumn({name:'timestamp'})
        timestamp:Date


}
import { PrimaryGeneratedColumn,Column,Entity,CreateDateColumn,OneToMany,JoinColumn} from "typeorm";




@Entity("acquirer")
export class Acquirer{

   @PrimaryGeneratedColumn('uuid')
        id: string;

    @Column('decimal', { precision: 6, scale: 2, default: 0 })
        gross_amount:number

    @Column('decimal', { precision: 6, scale: 2, default: 0.74 })
        fee: number;

    @Column('decimal', { precision: 6, scale: 2, default: 100 })
        merchant_net_amount:number

    @Column('varchar', {length: 50 ,default:"TEST MERCHANT LONDON GB"})
        merchant:string;
        
    @CreateDateColumn({name:'timestamp'})
        timestamp:Date


}
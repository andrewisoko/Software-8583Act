import { PrimaryGeneratedColumn,Column,Entity,CreateDateColumn,OneToOne,JoinColumn} from "typeorm";
import { Transaction } from "src/services/orchestrator/entity/transaction.entity";

export enum DECISION  {

    APPROVED = "approved",
    DECLINED = "declined"

}

@Entity("rule_engine")
export class RuleEngine{

   @PrimaryGeneratedColumn('uuid')
        log_id: string;

    @Column({
        type:"enum",
        enum:DECISION,
        default:DECISION.DECLINED
    })
    decision:DECISION

    @CreateDateColumn({name:'timestamp'})
        timestamp:Date

    @OneToOne(() => Transaction, transaction => transaction.rule_engine)
    @JoinColumn()
        transaction: Transaction;

}
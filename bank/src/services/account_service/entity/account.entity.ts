import { Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn } from "typeorm";


@Entity("Account")
export class Account{

    @PrimaryGeneratedColumn('uuid')
     id: string;

     @Column({ unique: true })
        accountNumber: string;

    @Column({ name: 'customer_id' })
        customerId: string;     

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
        balance: number;              

    @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
        hold: number;               

    @Column({ length: 3, default: 'GBP' })
        currency: string;

    @Column({ default: 'ACTIVE' })
        status: 'ACTIVE' | 'BLOCKED' | 'CLOSED';

    @CreateDateColumn({ name: 'created_at' })
        createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
        updatedAt: Date;
    }




import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, HydratedDocument } from 'mongoose';

export enum ACCOUNT_STATUS {
    ACTIVE = 'ACTIVE',
    BLOCKED = 'BLOCKED',
    CLOSED = 'CLOSED',
}

@Schema({ timestamps: true })
export class Account extends Document {

    @Prop({ type: String, default: 'fekwjdekdoSISISIS' })
    panEncrypt: string;

    @Prop({ type: String, default: 'Johnson Handsome' })
    fullName: string;

    @Prop({ type: Types.ObjectId, ref: 'Party', required: true })
    customerId: Types.ObjectId;

    @Prop({ type: Number, precision: 15, scale: 2, default: 0 })
    ledger_balance: number;

    @Prop({ type: Number, precision: 15, scale: 2, default: 0 })
    available_balance: number;

    @Prop({ type: Number, precision: 15, scale: 2, default: 0 })
    hold: number;

    @Prop({ type: String, maxlength: 3, default: 'GBP' })
    currency: string;

    @Prop({ type: String, default: '12/33' })
    expiryEncrypt: string;

    @Prop({
        type: String,
        enum: ACCOUNT_STATUS,
        default: ACCOUNT_STATUS.ACTIVE,
    })
    status: ACCOUNT_STATUS;

    @Prop({ type: [Types.ObjectId], ref: 'Transaction', default: [] })
    transactions: Types.ObjectId[];

    @Prop({ type: [Types.ObjectId], ref: 'Ledger', default: [] })
    ledgerEntries: Types.ObjectId[];

    @Prop({ type: Types.ObjectId, ref: 'Party' })
    customer: Types.ObjectId;

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;

    @Prop({ type: Date })
    updatedAt: Date;
}

export type AccountDocument = HydratedDocument<Account>;
export const AccountSchema = SchemaFactory.createForClass(Account);

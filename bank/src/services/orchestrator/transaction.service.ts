import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction } from "./entity/transaction.entity";
import { Repository } from "typeorm";
import { Party } from "../party_service/entity/party.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";


export interface dataPayload {
    token: string;
    amount:number;
    currency: string;
    merchant: string;
    timestamp?: Date;
    customerID?: number;
    accountType?: string /*enum* only one account type for purpose of the project */ 
    // location?

}

export interface cardData {
    pan:string,
    expiry:Date,
    amount:number,
    currency:string,
    merchant:string,
    timestamp:Date,
    customerId:string,
    accountId:string, 
    terminalId:string,
}

@Injectable()
export class TransactionService{
    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>
    ){}

    async orchestrate(cardData){

    }

}
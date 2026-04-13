import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction, TRANSACTION_STATUS } from "./entity/transaction.entity";
import { Repository } from "typeorm";
import { Party } from "../party_service/entity/party.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { Account } from "../account_service/document/account.doc";
import { EncryptSecurity } from "./encryption/encrypt.security";
import { HttpService } from "@nestjs/axios";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";
import { firstValueFrom } from 'rxjs';
import { RuleEngine } from "../rule_engine_service/entity/rule.engine.entity";
import { IssuerService } from "../auth/banks/issuer_service/issuer.service";
import { Model } from "mongoose";
import { AccountDocument } from "../account_service/document/account.doc";
import { InjectModel } from "@nestjs/mongoose";



export interface EngineCheckRequest {
    panToken: string;
    amount: number;
    currency: string;
    merchant: string;
    accountStatus: "ACTIVE" | "BLOCKED" | "CLOSED";
    customerID: string;
}

export interface AcquirerRequest {
    amount:number,
    panToken: string;
    terminalid: string,
    merchant: string,
    currency:string,
    exiprationDate:string,
    fullName:string
    stan:number
}


@Injectable()
export class TransactionService{
    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectRepository(Party) private readonly partyRepository:Repository<Party>,
        @InjectModel('Account') private accountModel: Model<AccountDocument>,
        @InjectRepository(Terminal) private readonly terminalRepository:Repository<Terminal>,
        @InjectRepository(RuleEngine) private readonly ruleEngineRepository:Repository<RuleEngine>,


        private readonly encryption:EncryptSecurity,
        private readonly httpService: HttpService,
        private readonly issuerService:IssuerService

    ){}

    async createTransaction({
        pan,
        expiry,
        amount,
        currency,
        merchant,
        customer,
        account,
        terminal,

    }:FullRequestDto

    ){
        try {

            const customerData = await this.partyRepository.findOne({ where:{ id:customer }})
            if(! customerData ) throw new NotFoundException("Party not found");
       
            const accountData = await this.accountModel.findOne({ id:account })
            if( ! accountData ) throw new NotFoundException("Account not found");

            const terminalData = await this.terminalRepository.findOne({ where:{ id:terminal }})
            if(! terminalData ) throw new NotFoundException("terminal not found");

            const encryptedPan = JSON.stringify(this.encryption.encrypt(pan));
            const encryptExpiryDate = JSON.stringify(this.encryption.encrypt(expiry));

            const transaction = await this.transactionRepository.create({

                currency:currency,
                amount:amount,
                merchant:merchant,
                customer:customerData,
                // account:accountData,
                terminal:terminalData,
                panEncrypt:encryptedPan,
                expiryEncrypt:encryptExpiryDate,

                })
                await this.transactionRepository.save(transaction)

                return transaction
            
        } catch (error) {
            console.log(`error: ${error}`)
         }   
    };

    async createRuleEngineTable(
        decision,
        transaction,
    ){
        const ruleEngine = this.ruleEngineRepository.create({
            decision:decision,
            transaction:transaction
        })

        return this.ruleEngineRepository.save(ruleEngine)
    }
    
   createStan(){
        const randomNum = Math.floor(Math.random() * 1000000);
        return randomNum
    }

    

    async orchestrate( /* transaction service via httpService orchestrates its operations */
    fullRequestData:FullRequestDto,
    ){      

        try {
            
            /* data from gateway-api to transaction service first hop*/
    
            const transaction = await this.createTransaction({
                pan:fullRequestData.pan,
                expiry:fullRequestData.expiry,
                amount:fullRequestData.amount,
                currency:fullRequestData.currency,
                merchant:fullRequestData.merchant,
                timestamp:fullRequestData.timestamp,
                customer:fullRequestData.customer,
                account:fullRequestData.account,
                terminal:fullRequestData.terminal,
            })

            if (! transaction) throw new Error ("failed transaction")

            const panEncryptParse = JSON.parse(transaction.panEncrypt);
            const terminalToken = transaction.terminal.acc_token
         
            let panToken;


            /* transansaction service calls merchant service (Auth) */

            const validateTerminalResponse = await firstValueFrom(
            this.httpService.get(
                'http://localhost:3002/api.gateway/auth/validation-terminal/',
                {
                headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                },
            ),
            );
            console.log(validateTerminalResponse.data);

            const stan = this.createStan()
            transaction.stan = stan
            await this.transactionRepository.save(transaction)

            /* transansaction service calls tokenise token */

           
            const tokenResponse = await firstValueFrom(

            this.httpService.post(
                'http://localhost:3002/api.gateway/token/pan-tokenisation/',
                { panEncrypt: panEncryptParse },
                 {
                headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                },

                )
            );

            panToken = tokenResponse.data;
            // console.log(panToken);
            
           
            /* transansaction service calls rule engine. */

            const ruleEngine = await firstValueFrom(
                    this.httpService.post(
                    'http://localhost:3002/api.gateway/rule-engine/checks/',
                    {
                        token: panToken,
                        amount: fullRequestData.amount,
                        currency: fullRequestData.currency,
                        merchant: fullRequestData.merchant,
                        accountStatus: fullRequestData.accountStatus,
                        customerID: fullRequestData.customerID,
                    },
                    {
                     headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                 },
                )
            ); 
            console.log("rule engine:", ruleEngine.data);

            const decision = ruleEngine.data["action"]
            const ruleEngineTable = await this.createRuleEngineTable(decision,transaction);
            transaction.ruleEngine = ruleEngineTable;


            /*banks talking to each other */


            const acquirerService = await firstValueFrom(
                this.httpService.post(
                     'http://localhost:3002/api.gateway/acquirer/bank/',
                    {
                        amount:transaction.amount,
                        pan: panToken,
                        terminalid:transaction.terminal.id,
                        merchant: transaction.merchant,
                        currency: transaction.currency,
                        exiprationDate: transaction.expiryEncrypt,
                        fullName: transaction.customer.fullName,
                        stan:transaction.stan
        
                    },                    {
                     headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                 },

                )
            )
            
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
     
            const issuerService = this.issuerService.IssuerBankService();
            await sleep(3000);  /*waits for response */

            
        /* publishing event on kafka*/


        const approvedTrn = await this.transactionRepository.findOne({ where:{ id:transaction.id } });
        if ( !approvedTrn ) throw new NotFoundException( "Transaction not found" );

        if( approvedTrn.status === TRANSACTION_STATUS.APPROVED){

         
            const notificationService = await firstValueFrom(
                this.httpService.post('http://localhost:3002/api.gateway/notification/kafka-message',
                    {
                        message: "Transaction details",
                        customer:fullRequestData.customer,
                        amount:fullRequestData.amount,
                        currency:fullRequestData.currency,
                        merchant:fullRequestData.merchant,
                        timestamp:fullRequestData.timestamp,
                    },
                    {
                        headers: {
                        Authorization: `Bearer ${terminalToken}`,
                        },
                     },
                    
                )
            )

         }
        
        const settlementEngine = await firstValueFrom(
            this.httpService.post(
                'http://localhost:3002/api.gateway/settlement/engine-updates',
                {id:transaction.id},
                    {
                     headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                 },

            )
        )


        } catch (error) {
            console.log(`Error: ${error}`)
        }
    }
    
}
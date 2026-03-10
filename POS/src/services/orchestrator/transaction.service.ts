import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction, TRANSACTION_STATUS } from "./entity/transaction.entity";
import { Repository } from "typeorm";
import { Party } from "../party_service/entity/party.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { Account } from "../account_service/entity/account.entity";
import { EncryptSecurity } from "./encryption/encrypt.security";
import { HttpService } from "@nestjs/axios";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";
import { firstValueFrom } from 'rxjs';
import { RuleEngine } from "../rule_engine_service/entity/rule.engine.entity";
import { IssuerService } from "../auth/banks/issuer_service/issuer.service";


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
    panEncrypt:string,
    terminalid: string,
    merchant: string,
    currency:string,
    exiprationDate:string,
    stan:number
}


@Injectable()
export class TransactionService{
    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectRepository(Party) private readonly partyRepository:Repository<Party>,
        @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
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
       
            const accountData = await this.accountRepository.findOne({ where:{ id:account }})
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
                account:accountData,
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

            // const decision = ruleEngine.data["action"]
            // const ruleEngineTable = await this.createRuleEngineTable(decision,transaction);
            // transaction.ruleEngine = ruleEngineTable;


            /*banks talking to each other */


            const acquirerService = await firstValueFrom(
                this.httpService.post(
                     'http://localhost:3002/api.gateway/acquirer/bank/',
                    {
                        amount:transaction.amount,
                        pan: transaction.panEncrypt,
                        terminalid:transaction.terminal.id,
                        merchant: transaction.merchant,
                        currency: transaction.currency,
                        exiprationDate: transaction.expiryEncrypt,
                        stan:transaction.stan
        
                    },
                    {
                     headers: {
                    Authorization: `Bearer ${terminalToken}`,
                    },
                 },

                )
            )
            const issuerService = this.issuerService.IssuerBankService();

            /*approval transaction process */
            console.log("PENDING STATUS", transaction.status);
            const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            await sleep(2000);

            const fs = require('fs');
            const path = require('path');
            
         
            const approvedFileJSON = path.join( __dirname,  '..', '..', '..', 'approved.json' );

            console.log(approvedFileJSON);
                            
         
            if ( ! fs.existsSync( approvedFileJSON )){
               transaction.status = TRANSACTION_STATUS.DECLINED; 
            }
            else{
                transaction.status = TRANSACTION_STATUS.APPROVED;
                console.log("APPROVED", transaction.status)
                fs.unlinkSync(approvedFileJSON);
                console.log('File deleted successfully');
            }






        } catch (error) {
            console.log(`Error: ${error}`)
        }

    }
    
}
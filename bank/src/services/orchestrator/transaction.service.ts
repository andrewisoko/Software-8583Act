import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction } from "./entity/transaction.entity";
import { Repository } from "typeorm";
import { Party } from "../party_service/entity/party.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { Account } from "../account_service/entity/account.entity";
import { EncryptSecurity } from "./encryption/encrypt.security";
import { HttpService } from "@nestjs/axios";


export interface dataPayload {
    token: string;
    accountStatus:string;
    customerID: string;
    // location?

}

export interface fullRequestData {
    pan:string,
    amount:number,
    currency:string,
    expiry:string,
    merchant:string,
    timestamp:Date,
    customer:string,
    account:string, 
    terminal:string,
    token?: dataPayload
    accountStatus?:dataPayload
    customerID?: dataPayload
    // location?
}

@Injectable()
export class TransactionService{
    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
        @InjectRepository(Party) private readonly partyRepository:Repository<Party>,
        @InjectRepository(Account) private readonly accountRepository:Repository<Account>,
        @InjectRepository(Terminal) private readonly terminalRepository:Repository<Terminal>,

        private readonly encryption:EncryptSecurity,
        private readonly httpService: HttpService,

    ){}

    async createTransaction({
        pan,
        expiry,
        amount,
        currency,
        merchant,
        timestamp,
        customer,
        account,
        terminal,

    }:fullRequestData

    ){
        const customerId = await this.partyRepository.findOne({where:{id:customer}})
        if(! customerId ) throw new NotFoundException("Party not found");

        const accountId = await this.accountRepository.findOne({where:{id:account}})
        if( ! accountId ) throw new NotFoundException("Account not found");

        const terminalId = await this.terminalRepository.findOne({where:{id:terminal}})
        if(! terminalId ) throw new NotFoundException("terminal not found");

        const encryptedPan =  this.encryption.encrypt(pan).toString()
        const encryptExpiryDate =  this.encryption.encrypt(expiry).toString()

         try {
             const data = await this.transactionRepository.create({

                currency:currency,
                amount:amount,
                merchant:merchant,
                timestamp:timestamp,
                customer:customerId,
                account:accountId,
                terminal:terminalId,
                panEncrypt:encryptedPan,
                expiry:encryptExpiryDate
                 
                })
                console.log(`transaction data: ${data}`)
            
         } catch (error) {
            console.log(`error: ${error}`)
         }   

        return `transaction created`
    }

    async orchestrate( /* transaction service via httpService orchrstrates its operations */
    fullRequestData:fullRequestData
    ){

        try {
            
            /* data from gateway-api to transaction service first hop */
    
            await this.createTransaction({
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

            const panEncrypt = await this.transactionRepository.findOne({ where:{ panEncrypt:fullRequestData.pan } })
            if(! panEncrypt ) throw new NotFoundException("pan not found");

            const CustomerID = await this.partyRepository.findOne({ where:{ id: fullRequestData.customerID } });
            if (! CustomerID ) throw new NotFoundException("customerID not found");

            const accountStatus = await this.accountRepository.findOne({ where:{ status:fullRequestData.accountStatus }})
            let panToken;

            /* transansaction service calls merchant service (Auth) */

            const validateTerminal = () => this.httpService.get('http://localhost:3002/api.gateway/auth/validation-terminal/')
            validateTerminal()
            console.log("Web terminal validated ✅");

            /* transansaction service calls tokenise token */

            const tokenisePan = () => {
                return this.httpService.post('http://localhost:3002/api.gateway/token/pan-tokenisation/',{panEncrypt}) /*test if jwt guard is needed */
            }
            panToken = tokenisePan()
            console.log(panToken)
            console.log("Pan tokenised 🔐");

            /* and so on...*/

            const ruleEngine = () => {
                return this.httpService.post(
                    'http://localhost:3002/api.gateway/rule-engine/checks/',
                    {
                        token:panToken,
                        amount:fullRequestData.amount,
                        currency:fullRequestData.currency,
                        merchant:fullRequestData.merchant,
                        accountStatus:,
                        customerID: fullRequestData.customerID,
                    }
                )
            }
            ruleEngine()


        } catch (error) {
            console.log(`Error: ${error}`)
        }


    }

}
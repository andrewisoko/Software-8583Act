import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Transaction } from "./entity/transaction.entity";
import { Repository } from "typeorm";
import { Party } from "../party_service/entity/party.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { Account } from "../account_service/entity/account.entity";
import { EncryptSecurity } from "./encryption/encrypt.security";
import { HttpService } from "@nestjs/axios";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";
import { firstValueFrom } from 'rxjs';


export interface EngineCheckRequest {
    token: string;
    amount: number;
    currency: string;
    merchant: string;
    accountStatus: "ACTIVE" | "BLOCKED" | "CLOSED";
    customerID: string;
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

            /* and so on...*/

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
        
       


        } catch (error) {
            console.log(`Error: ${error}`)
        }

    }
    
}
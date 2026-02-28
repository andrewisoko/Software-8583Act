import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { dataPayload, fullRequestData } from "../orchestrator/transaction.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Transaction } from "../orchestrator/entity/transaction.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { Party } from "../party_service/entity/party.entity";


@Injectable()
export class RuleEngineService{
    @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>;
    @InjectRepository(Terminal) private readonly terminalRepository:Repository<Terminal>;
    @InjectRepository(Party) private readonly partyRepository:Repository<Party>;

    async enginechecks(
        dataPayload:dataPayload,
        fullRequestData:fullRequestData,
        ){
        
        try {
            let approved:boolean= false

            const checkCustomerID = await this.partyRepository.findOne({where:{id:dataPayload.customerID}});
            if (! checkCustomerID ) throw new NotFoundException("customerID not found");

            const checkMerchant = await this.terminalRepository.findOne({where:{subject: fullRequestData.merchant}});
            console.log(`merchant ${checkMerchant}`);

            if (! checkMerchant ) throw new NotFoundException("merchant not found");
            if ( dataPayload.accountStatus !== "ACTIVE" ) throw new UnauthorizedException("account not active")
            
            if(fullRequestData.amount >= 150000) throw new UnauthorizedException("Invalid amount");  /*balance check to be added.*/
            if (fullRequestData.currency !== "GBP") throw new UnauthorizedException("Invalid currency");

            approved = true
            const action = approved ? "approve": "declined";

            return {"action": action};
             
            
        } catch (error) {
            console.log( `Error: ${error}` );
            
        }
    };

};
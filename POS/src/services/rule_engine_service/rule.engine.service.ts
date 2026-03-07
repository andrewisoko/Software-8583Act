import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EngineCheckRequest } from "../orchestrator/transaction.service";
import { Repository } from "typeorm";
import { Transaction } from "../orchestrator/entity/transaction.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { Party } from "../party_service/entity/party.entity";



@Injectable()
export class RuleEngineService{
    // @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>;
    @InjectRepository(Terminal) private readonly terminalRepository:Repository<Terminal>;
    @InjectRepository(Party) private readonly partyRepository:Repository<Party>;

    async enginechecks(
        engineCheckRequest: EngineCheckRequest
        ){
        
        let approved:boolean= false;

        try {

            const checkCustomerID = await this.partyRepository.findOne({ where:{ id:engineCheckRequest.customerID }});
            if (! checkCustomerID ) throw new NotFoundException("customerID not found");

            const checkMerchant = await this.terminalRepository.findOne({ where:{subject: engineCheckRequest.merchant }});
            if (! checkMerchant ) throw new NotFoundException("merchant not found");

            if ( engineCheckRequest.accountStatus !== "ACTIVE" ) throw new UnauthorizedException("account not active")
            
            if( engineCheckRequest.amount >= 150000 ) throw new UnauthorizedException("Invalid amount");  /*balance check to be added.*/
            if ( engineCheckRequest.currency !== "GBP" ) throw new UnauthorizedException("Invalid currency");

            approved = true
            const action = approved ? "approved": "declined";
            

            return {"action": action};
             
            
        } catch (error) {
            console.log( `Error: ${error}` );
            
        }

    };

};
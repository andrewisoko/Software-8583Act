import { Controller,Post, UseGuards,Body,Request } from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { RolesGuard } from "src/services/auth/roles/roles.guard";
import { Roles } from "../auth/roles/roles.decorators";
import { Role} from "../web_terminal/entity/wt.entity";
import { RuleEngineService } from "./rule.engine.service";






@Controller('rule-engine')
export class RuleEngineController{

    constructor( private readonly ruleEngineService:RuleEngineService,
     ){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Post('checks')
    async ruleEngineChecks(
       @Body() ruleEngineDto:{
        token:string,
        amount:number;
        currency: string;
        merchant: string;
        accountStatus:"ACTIVE"|"BLOCKED"|"CLOSED";
        customerID: string;
        }
    ){
   

    return await this.ruleEngineService.
    enginechecks(
        {
        accountStatus:ruleEngineDto.accountStatus,
        customerID:ruleEngineDto.customerID,
        token:ruleEngineDto.token,
        amount:ruleEngineDto.amount,
        currency:ruleEngineDto.currency,
        merchant:ruleEngineDto.merchant,
 
    })   
  } 
}
import { Controller,Get, Request, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { Role } from "../web_terminal/entity/wt.entity";
import { Roles } from "../auth/roles/roles.decorators";
import { RolesGuard } from "src/services/auth/roles/roles.guard";
import { TokenisationService } from "../tokenisation_service/tokenisation.service";

@Controller("transaction")
export class TransactionController {

    constructor( private readonly tokenisationService:TokenisationService ){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Get("orchestra") 
    
    synchCalls(
        @Request() req
    ){
        console.log("merchant validated.")

        const {pan} = req.card
        this.tokenisationService.tokenisePan(pan)
        console.log("pan tokenised.")
    }
    
    }
   


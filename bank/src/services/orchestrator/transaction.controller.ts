import { Controller,Post, UseGuards,Request, Body} from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { Role } from "../web_terminal/entity/wt.entity";
import { Roles } from "../auth/roles/roles.decorators";
import { RolesGuard } from "src/services/auth/roles/roles.guard";
import { TransactionService } from "./transaction.service";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";




@Controller("transaction")
export class TransactionController {
    constructor(
        private readonly transactionService: TransactionService
    ) {}

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.TERMINAL)
    @Post("orchestra")
    orchestrate(
        @Body() dataDto:FullRequestDto
    ) {
        // const { 
        //     pan,
        //     expiry, 
        //     amount, 
        //     currency, 
        //     merchant, 
        //     timestamp, 
        //     customer, 
        //     account, 
        //     terminal
        // } = req.customer

        return this.transactionService.orchestrate(dataDto)
    }
}

// pan:pan,
// expiry:expiry,
// amount:amount,
// currency:currency, 
// merchant:merchant, 
// timestamp:timestamp, 
// customer:customer, 
// account:account, 
// terminal:terminal


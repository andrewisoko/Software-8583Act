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

    
    @Post("orchestra") 
    orchestrate(
        @Body() dataDto:FullRequestDto
    ) {
        return this.transactionService.orchestrate(dataDto)
    }
}




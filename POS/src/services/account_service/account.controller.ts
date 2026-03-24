import { Controller,Post,Body } from '@nestjs/common';
import { AccountService } from './account.service';
import { UseGuards } from '@nestjs/common';
import { Role } from '../web_terminal/entity/wt.entity';
import { JwtAuthGuard } from '../auth/authGuard';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Roles } from '../auth/roles/roles.decorators';


@Controller('account')
export class AccountController {

    constructor(
        private readonly accountService:AccountService,
    ){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.ISSUER)
    @Post("account-checks")
    async accountChecks(
        @Body() dataDto: {
            fullName:string,
            amount:number,
            transaction:string,
            expiryDate:string,
            pan:string,
        }
    ){
        return await this.accountService.accountChecks(
            dataDto.fullName,
            dataDto.amount,
            dataDto.transaction,
            dataDto.expiryDate,
            dataDto.pan
        )
    }

}

import { Controller,Post,Body } from '@nestjs/common';
import { LedgerRecord, LedgerService } from './ledger.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/authGuard';
import { Roles } from '../auth/roles/roles.decorators';
import { RolesGuard } from '../auth/roles/roles.guard';
import { Role } from '../web_terminal/entity/wt.entity';
import { AuthGuard } from '@nestjs/passport';


@Controller('ledger')
export class LedgerController {
    constructor(
        private readonly ledgerService: LedgerService
    ){}

    @UseGuards(AuthGuard('issuer-jwt'),RolesGuard)
    @Roles(Role.ISSUER)
    @Post("double-entry")
    async saveDoubleEntry(
        @Body() ledgerdataDto: {
            account_id:string,
            transaction_id:string,
            amount:number,
            currency:string,
            eventTimestamp:Date,
            maskedPan:string,
        }
    ){
        return this.ledgerService.saveDoubleEntry(ledgerdataDto)
    }
}

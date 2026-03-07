import { Controller, Post,Body } from '@nestjs/common';
import { AcquirerService } from './acquirer.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../authGuard';
import { RolesGuard } from '../../roles/roles.guard';
import { Roles } from '../../roles/roles.decorators';
import { Role } from 'src/services/web_terminal/entity/wt.entity';


@Controller('acquirer')
export class AcquirerController {
    constructor(
        private readonly acquirerService:AcquirerService
    ){}
    
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Post("bank")
    acquirerBankService(
        @Body() dataDto:{
            amount:number,
            pan:string,
            terminalid: string,
            merchant: string,
            currency:string,
            exiprationDate:string,
            transactionId:string
        }
    ){
        this.acquirerService.acquirerBankService({
            amount:dataDto.amount,
            panEncrypt: dataDto.pan,
            terminalid:dataDto.terminalid,
            merchant: dataDto.merchant,
            currency: dataDto.currency,
            exiprationDate:dataDto.exiprationDate,
        })
    }
}

import { Controller,Body,Post } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/services/auth/authGuard';
import { Role } from 'src/services/web_terminal/entity/wt.entity';
import { Roles } from 'src/services/auth/roles/roles.decorators';
import { RolesGuard } from 'src/services/auth/roles/roles.guard';

@Controller('settlement')
export class SettlementController {
    constructor(
        private readonly settlementEngineServices: SettlementService,
    ){}

    
    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Post('engine-updates')
    updates(
        @Body() Dto:{id:string}
    ){
        return this.settlementEngineServices.updates(Dto.id)
    }
}

import { Controller,Body,Post } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Role } from '../web_terminal/entity/wt.entity';
import { Roles } from '../auth/roles/roles.decorators';
import { JwtAuthGuard } from '../auth/authGuard';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../auth/roles/roles.guard';

@Controller('notification')
export class NotificationController {

    constructor( private readonly notificationService: NotificationService ){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Post("kafka-message")
    async notification(
        @Body() dataDto: {

        message: string,
        customer:string,
        amount:number,
        currency:string,
        merchant:string,
        timestamp:string
    }
    ){ 
        await this.notificationService.bootstrap()
        await this.notificationService.onModuleInit()

        return this.notificationService.sendMessage({
            message: dataDto.message,
            customer:dataDto.customer,
            amount:dataDto.amount,
            currency:dataDto.currency,
            merchant:dataDto.merchant,
            timestamp:dataDto.timestamp
        })
        
    }
}

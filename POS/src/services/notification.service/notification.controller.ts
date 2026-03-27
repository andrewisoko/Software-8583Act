import { Controller,Body,Post } from '@nestjs/common';
import { NotificationService } from './notification.service';




@Controller('notification')
export class NotificationController {

    constructor( private readonly notificationService: NotificationService ){}

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

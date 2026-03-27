import { Injectable, OnModuleInit } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ClientKafka } from '@nestjs/microservices';
import { AppModule } from 'src/api_gateway/config/app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';
import { NotificationModule } from './notification.module';

export interface KafkaMessageData {

        message: string,
        customer:string,
        amount:number,
        currency:string,
        merchant:string,
        timestamp:string
}

@Injectable()
export class NotificationService implements OnModuleInit {

       @Inject('KAFKA_SERVICE') private readonly client: ClientKafka

    async bootstrap() {
      const app = await NestFactory.createMicroservice<MicroserviceOptions>(NotificationModule, {
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'POS-app',
            brokers: ['localhost:9092'], 
          },
          consumer: {
            groupId: 'user-account',
          },
        },
      });
    
      await app.listen();
    }

    async onModuleInit() {
        await this.client.connect();
    }

    async sendMessage(data:KafkaMessageData) {
        return this.client.emit('notification-topic', {

            message: data.message,
            customer:data.customer,
            amount:data.amount,
            currency:data.currency,
            merchant:data.merchant,
            timestamp:data.timestamp,
        });
    }
    
}

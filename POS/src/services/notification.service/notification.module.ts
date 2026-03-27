import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ClientKafka } from '@nestjs/microservices';



@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
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
      },
    ]),
  ],

  providers: [NotificationService],
  controllers: [NotificationController]
})
export class NotificationModule {}

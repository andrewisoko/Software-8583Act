import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {ConfigModule} from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from '../../services/auth/auth.module';
import { Terminal } from 'src/services/web_terminal/entity/wt.entity';
import { WTModule } from 'src/services/web_terminal/wt.module';
import { TransactionModule } from 'src/services/orchestrator/transaction.module';





@Module({
  imports: [
    ConfigModule.forRoot({

      isGlobal:true,
      envFilePath:__dirname + '/../../../.env'
    }
  ),
  TypeOrmModule.forRootAsync({
    imports:[
      ConfigModule,
      TransactionModule,
      AuthModule,
      WTModule
    ],
    inject:[ConfigService],
    useFactory:(configService:ConfigService) => {
      // console.log(configService.get<string>('DB_USER'))
      return{
        type: 'postgres',
        host: configService.get<string>('DB_'),
        port: parseInt(configService.get<string>('DB_PORT') ?? '5432', 10),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        synchronize:true,
        entities:[Terminal]
      }
    }
  })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

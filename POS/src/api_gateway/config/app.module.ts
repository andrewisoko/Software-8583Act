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
import { Party } from 'src/services/party_service/entity/party.entity';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { RuleEngineModule } from 'src/services/rule_engine_service/rule.engine.module';
import { AccountModule } from 'src/services/account_service/account.module';
import { Account } from 'src/services/account_service/entity/account.entity';
import { TokenisationModule } from 'src/services/tokenisation_service/tokenisation.module';
import { HttpModule } from '@nestjs/axios';
import { AcquirerModule } from 'src/services/auth/banks/acquirer_service/acquirer.module';
import { RuleEngine } from 'src/services/rule_engine_service/entity/rule.engine.entity';
import { Acquirer } from 'src/services/auth/banks/entity/acquirer.entity';



@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({

      isGlobal:true,
      envFilePath:__dirname + '/../../../.env'
    },
  ),
  TypeOrmModule.forRootAsync({
    imports:[
      TransactionModule,
      RuleEngineModule,
      TokenisationModule,
      AuthModule,
      AccountModule,
      HttpModule,
      WTModule,
      AcquirerModule
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
        entities:[
          Terminal,
          Party,
          Transaction,
          Account,
          RuleEngine,
          Acquirer
        ]
      }
    }
  })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

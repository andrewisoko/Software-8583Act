import { Module } from "@nestjs/common";
import { TransactionController } from "./transaction.controller";
import { TokenisationService } from "../tokenisation_service/tokenisation.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "./entity/transaction.entity";
import { HttpModule } from '@nestjs/axios';
import { TokenisationController } from "../tokenisation_service/tokenisation.controller";
import { TransactionService } from "./transaction.service";
import { EncryptSecurity } from "./encryption/encrypt.security";
import { Party } from "../party_service/entity/party.entity";
import { Terminal } from "../web_terminal/entity/wt.entity";
import { RuleEngine } from "../rule_engine_service/entity/rule.engine.entity";
import { IssuerService } from "../auth/banks/issuer_service/issuer.service";
import { Conversion } from "../auth/banks/iso_val_conversions/conversions";
import { ConfigService } from "@nestjs/config";
import { AccountService } from "../account_service/account.service";
import { Ledger } from "../ledger.service/entity/ledger.entity";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AccountSchema } from "../account_service/document/account.doc";


@Module({
    imports:[
        HttpModule,
        JwtModule.registerAsync({
                imports:[ConfigModule],
                inject:[ConfigService],
                useFactory:(configService:ConfigService) => {
                    
                    return{
                        global: true,
                        secret: configService.get<string>("JWT_KEY"),
                    }
                },
            }),
         MongooseModule.forFeature([ { name :'Account', schema:AccountSchema }]),
        TypeOrmModule.forFeature([
            Transaction,
            Party,
            Terminal,
            RuleEngine,
            Ledger
        ])
    ],
    controllers:[
        TransactionController,
        TokenisationController
    ],
    providers:[
        TokenisationService,
        TransactionService,
        IssuerService,
        EncryptSecurity,
        Conversion,
        AccountService,
        ConfigService,  
    ],
})

export class TransactionModule{}
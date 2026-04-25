import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Module } from "@nestjs/common";
import { MerchantController } from "./merchant_service/merchant.controller";
import { TerminalJwtStrategy } from "./terminal.jwt.strategy";
import { Conversion } from "./banks/iso_val_conversions/conversions";
import { IssuerService } from './banks/issuer_service/issuer.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "../orchestrator/entity/transaction.entity";
import { EncryptSecurity } from "../orchestrator/encryption/encrypt.security";
import { HttpModule } from "@nestjs/axios";
import { AccountService } from "../account_service/account.service";
import { Ledger } from "../ledger.service/entity/ledger.entity";
import { IssuerJwtStrategy } from "./banks/issuer_service/Issuer.jwt.strategy";
import { ContractJwtStrategy } from "./banks/issuer_service/contract.jwt.strategy";
import { AccountSchema } from "../account_service/document/account.doc";
import { MongooseModule } from "@nestjs/mongoose";
import { IssuerRuleService } from "./banks/issuer_service/issuer_rules/issuer.rules.service";
import { IssuerRulesController } from "./banks/issuer_service/issuer_rules/issuer.rules.controller";
import { SettlementService } from "../settlement/settlement_engine/settlement.service";


/* initial auth approach will be a simple jwt authorisation. The app initially verifies if web POS terminal contains the token.*/

@Module({
    imports:[
        TypeOrmModule.forFeature([Transaction,Ledger]),
        MongooseModule.forFeature([ { name :'Account', schema:AccountSchema }]),
        PassportModule,
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
    ], 
    controllers:[MerchantController,IssuerRulesController],
    providers:[
        HttpModule,
        TerminalJwtStrategy,
        IssuerJwtStrategy,
        ContractJwtStrategy,
        Conversion,
        AccountService,
        IssuerService,
        EncryptSecurity,
        IssuerRuleService,
        SettlementService
    ],
    exports:[IssuerService]
})

export class AuthModule {}
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Module } from "@nestjs/common";
import { MerchantController } from "./merchant_service/merchant.controller";
import { MechartService } from "./merchant_service/merchant.service";
import { TerminalJwtStrategy } from "./terminal.jwt.strategy";
import { Conversion } from "./banks/iso_val_conversions/conversions";
import { IssuerService } from './banks/issuer_service/issuer.service';
import { PartyBankAccount } from "./banks/partyBankAccount";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Transaction } from "../orchestrator/entity/transaction.entity";
import { EncryptSecurity } from "../orchestrator/encryption/encrypt.security";
import { Account } from "../account_service/entity/account.entity";
import { HttpModule } from "@nestjs/axios";
import { AccountService } from "../account_service/account.service";
import { Ledger } from "../ledger.service/entity/ledger.entity";
import { IssuerJwtStrategy } from "./banks/issuer_service/Issuer.jwt.strategy";



/* initial auth approach will be a simple jwt authorisation. The app initially verifies if web POS terminal contains the token.*/

@Module({
    imports:[
        TypeOrmModule.forFeature([Transaction,Account,Ledger]),
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
    controllers:[MerchantController],
    providers:[
        MechartService,
        TerminalJwtStrategy,
        IssuerJwtStrategy,
        JwtService,
        Conversion,
        AccountService,
        IssuerService,
        EncryptSecurity
    ]
})

export class AuthModule {}
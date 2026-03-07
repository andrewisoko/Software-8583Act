import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Module } from "@nestjs/common";
import { MerchantController } from "./merchant_service/merchant.controller";
import { MechartService } from "./merchant_service/merchant.service";
import { JwtStrategy } from "./jwt.strategy";

/* initial auth approach will be a simple jwt authorisation. The app initially verifies if web POS terminal contains the token.*/

@Module({
    imports:[
        PassportModule,
        JwtModule.registerAsync({
            imports:[ConfigModule],
            inject:[ConfigService],
            useFactory:(configService:ConfigService) => {
                return{
                    global: true,
                    secret: configService.get<string>("JWT_KEY")
                }
            },
        })
    ], 
    controllers:[MerchantController],
    providers:[MechartService,JwtStrategy]
})

export class AuthModule {}
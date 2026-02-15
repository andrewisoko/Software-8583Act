import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { PassportModule } from "@nestjs/passport";
import { Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

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
    controllers:[AuthController],
    providers:[AuthService]
})

export class AuthModule {}
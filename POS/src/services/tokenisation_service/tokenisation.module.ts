import { Module } from "@nestjs/common";
import { TokenisationController } from "./tokenisation.controller";
import { TokenisationService } from "./tokenisation.service";
import { EncryptSecurity } from "../orchestrator/encryption/encrypt.security";

@Module({
    imports:[],
    controllers:[TokenisationController],
    providers:[TokenisationService,EncryptSecurity],
})

export class TokenisationModule{}
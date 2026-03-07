import { Controller,Post, UseGuards, Body } from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { RolesGuard } from "src/services/auth/roles/roles.guard";
import { TokenisationService } from "./tokenisation.service";
import { Roles } from "../auth/roles/roles.decorators";
import { Role, Terminal } from "../web_terminal/entity/wt.entity";


@Controller('token')
export class TokenisationController{

    constructor( private readonly tokenisationService:TokenisationService){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Post('pan-tokenisation')
    tokenisePan(
        @Body() panDto:{panEncrypt:string}
    ){
        return this.tokenisationService.tokenisePan(panDto.panEncrypt)
    }
}
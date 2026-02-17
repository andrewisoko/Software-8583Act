import { Controller,Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/api_gateway/auth/authGuard";
import { Role } from "./entity/wt.entity";
import { Roles } from "src/api_gateway/auth/roles/roles.decorators";
import { RolesGuard } from "src/api_gateway/auth/roles/roles.guard";
import { WebTerminal } from "./wt.service";


@Controller('terminal')
export class WebTerminalController{

    constructor(private readonly webTerminal:WebTerminal){}

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.CUSTOMER)
    @Get('create-terminal')
    createWT(){
        return this.webTerminal.CreateWT()
    }
}
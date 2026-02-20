import { Controller,Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { Role } from "src/services/web_terminal/entity/wt.entity";
import { Roles } from "src/services/auth/roles/roles.decorators";
import { RolesGuard } from "src/services/auth/roles/roles.guard";


@Controller('auth')
export class MerchantController{

    @UseGuards(JwtAuthGuard,RolesGuard)
    @Roles(Role.TERMINAL)
    @Get('validation-terminal')
    validateTerminal(){
        return "Web terminal validated 🚀"
    }
}
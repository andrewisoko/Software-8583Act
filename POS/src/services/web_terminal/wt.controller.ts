import { Controller, UseGuards, Post,Body } from "@nestjs/common";
import { JwtAuthGuard } from "src/services/auth/authGuard";
import { WebTerminal } from "./wt.service";
import { AuthGuard } from "@nestjs/passport";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";

export interface cardData {
            pan: string,
            amount: number,
            currency: string,
            expiry: string,
            merchant: string,
            timestamp: string,
            customer: string,
            account: string,
}

@Controller('terminal')
export class WebTerminalController{

    constructor(private readonly webTerminal:WebTerminal){}

    @UseGuards(AuthGuard('card-jwt'))
    @Post('create-terminal')
    createWT(
        @Body() cardDetailsDto:cardData
    ){
        return this.webTerminal.CreateWT(
            {
                pan: cardDetailsDto.pan,
                amount: cardDetailsDto.amount,
                currency: cardDetailsDto.currency,
                expiry: cardDetailsDto.expiry,
                merchant: "TEST MERCHANT LONDON GB",
                timestamp: cardDetailsDto.timestamp,
                customer: cardDetailsDto.customer,
                account: cardDetailsDto.account,
            }
        )
    }
}
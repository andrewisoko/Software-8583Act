import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Terminal } from "./entity/wt.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "./entity/wt.entity";
import { HttpService } from "@nestjs/axios";
import { FullRequestDto } from "src/api_gateway/config/dto/request.data.dto";
import { firstValueFrom } from "rxjs";




@Injectable()
export class WebTerminal{
    constructor(
        @InjectRepository(Terminal) private readonly TerminalRepository: Repository<Terminal>,
        private readonly httpService:HttpService,
        private readonly jwtService:JwtService,
    ){}

    generateSerialNum(){
        const randomNum = Math.floor(Math.random() * 100000000);
        return randomNum
      }

    generateSignature(){
        /* cheap imitation of sha256WithRSAEncryption algorithm output*/

        let randomNum = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) + 100000000000000000000n /* using Big int since interger chosen overpass js number's precision limit. (20 digits)*/
        let objContainer =  randomNum.toString().split("");

        const objWithDots = () => { 
        for(let items of objContainer){
            objContainer[1] = objContainer[3] = objContainer[7] = objContainer[14] = objContainer[16] = objContainer[18] = ".";
            
            return objContainer.join('')
        }
        }
        return objWithDots()
    }

   
    async CreateWT(
        cardDetails:Partial<FullRequestDto>
    ){

        const serialNumber = this.generateSerialNum();
        // console.log(serialNumber)
        const signature = this.generateSignature();
        
        const certTerminal = {
            serialNumber: serialNumber,
            signature: signature,
            issuer:'ISSUER BANK TUTORIAL',
            subject:'TEST MERCHANT LONDON GB',
            role: Role.TERMINAL
        };
        const terminal_token = this.jwtService.sign(certTerminal);

        const terminal = await this.TerminalRepository.create(certTerminal);
        terminal.acc_token = terminal_token
        
        await this.TerminalRepository.save(terminal);

        // if camera scans payload

        const response = await firstValueFrom( this.httpService.post(
            'http://localhost:3002/api.gateway/',
            {
                pan: cardDetails.pan,
                amount: cardDetails.amount,
                currency: cardDetails.currency,
                expiry: cardDetails.expiry,
                merchant: cardDetails.merchant,
                timestamp: cardDetails.timestamp,
                customer: cardDetails.customer,
                account: cardDetails.account,
                terminal:terminal.id
            },
            {
                headers:{
                    Authorization:`Bearer ${terminal.acc_token}`
                },
            },
        ))


        return response.data

    }

}

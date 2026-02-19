import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { Terminal } from "./entity/wt.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Role } from "./entity/wt.entity";



Injectable()
export class WebTerminal{
    constructor(
        @InjectRepository(Terminal) private readonly TerminalRepository: Repository<Terminal>,
        private readonly jwtService:JwtService,
    ){}

    generateSerialNum(){
        let randomNum = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) + 1000000000000000n  /* using Big int since interger chosen overpass js number's precision limit. */
        return randomNum.toString()
    }

    generateSignature(){
        /* cheap imitation of sha256WithRSAEncryption algorithm output*/

        let randomNum = BigInt(Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)) + 100000000000000000000n  
        let objContainer =  randomNum.toString().split("");

        const objWithDots = () => { 
        for(let items of objContainer){
            objContainer[1] = objContainer[3] = objContainer[7] = objContainer[14] = objContainer[16] = objContainer[18] = ".";
            
            return objContainer.join('')
        }
        }
        console.log(objContainer)
        return objWithDots()

    }


        


    async CreateWT(){

        const serialNumber = this.generateSerialNum();
        const signature = this.generateSignature();

        const certTerminal = {
            serialNumber:Number(serialNumber),
            signature: signature,
            issuer:'Tututorial Bank',
            subject:'Merchant Tutorial',
            role: Role.TERMINAL
        };
        const terminal_token = this.jwtService.sign(certTerminal);

        await this.TerminalRepository.create(certTerminal)
        await this.TerminalRepository.save(certTerminal)

        return {terminal_token:terminal_token}

    }

}

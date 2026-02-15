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
        const randomNum = Math.floor(Math.random() * 100000000);
        return randomNum.toString().padStart(13,'0')
    }

    generateSignature(){

        /* cheap imitation of sha256WithRSAEncryption algorithm output*/

        const randomNum = Math.floor(Math.random() * 100000000);
        const randomNumtoNine = Math.floor(Math.random() * 9);

        const  ThreeSeq = randomNum.toString().padStart(3,'0')
        const  SixSeq = randomNum.toString().padStart(6,'0')
        const  twoSeq = randomNum.toString().padStart(2,'0')

        return `${randomNumtoNine}.${randomNumtoNine}.${ThreeSeq}.${SixSeq}.${randomNumtoNine}.${randomNumtoNine}.${twoSeq}`
    }

    generateId(){

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

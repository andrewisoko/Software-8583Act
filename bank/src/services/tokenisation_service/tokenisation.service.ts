import { Injectable, NotFoundException,ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository} from "typeorm";
import { Transaction } from "../orchestrator/entity/transaction.entity";
import { EncryptSecurity } from "../orchestrator/encryption/encrypt.security";


@Injectable()
export class TokenisationService {

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
        private readonly decryption:EncryptSecurity
    ){}

    /* PCI compliance to add  */
    async tokenisePan(encryptedPan:string){
        
        const crypto = require('crypto');
        try {
            if(!encryptedPan) throw new NotFoundException("pan not found")
                // console.log(pan)
            const rawPan = this.decryption.decrypt(encryptedPan)
            const token  = crypto.createHash('sha256').update(rawPan.toString()).digest('hex');
            const findExistingtoken = await this.transactionRepository.findOne({ where:{panEncrypt:token }}) 
    
            if (findExistingtoken) {
             throw new ConflictException('pan already generated');
            }   
            await this.transactionRepository.save({ panEncrypt:token })
            return "Pan token saved";
            
        } catch (error) {
            console.log(`error ${error}`)
        }
    }
}
import { Injectable, NotFoundException,ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository} from "typeorm";
import { Transaction } from "../orchestrator/entity/transaction.entity";
import { EncryptSecurity } from "../orchestrator/encryption/encrypt.security";


export interface TokenRecord {
  token: string;
  rawPan: string;
};

export const vault: TokenRecord[] = []



@Injectable()
export class TokenisationService {

    constructor(
        // @InjectRepository(Transaction) private readonly transactionRepository: Repository<Transaction>,
        private readonly decryption:EncryptSecurity
    ){}

     store(record: TokenRecord, records: TokenRecord[] ) {
        records.push(record);   
    }


    detokenisetoken(token:string){
        return vault.find( r => r.token === token)?.rawPan
    }


    /* PCI compliance to add  */
    tokenisePan(encryptedPan:string){

    try {
        if(!encryptedPan) throw new NotFoundException("pan not found")
            // console.log(pan)
        const rawPan = this.decryption.decrypt(encryptedPan);
        const token = crypto.randomUUID();
        this.store( { token, rawPan }, vault );
        
        console.log("Pan tokenised.");
        return token;
        
    } catch (error) {
        console.log(`error ${error}`)
    }
}
}
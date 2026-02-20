import { Injectable, NotFoundException } from "@nestjs/common";
import { NotFoundError } from "rxjs";
import * as bcrypt from 'bcrypt';

@Injectable()
export class TokenisationService {

    tokenisePan(pan){
        if(!pan) throw new NotFoundException("pan not found")
            console.log(pan)
        return bcrypt.hash(pan,10)
    }
}
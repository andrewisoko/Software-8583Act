import { Injectable } from '@nestjs/common';
import { Conversion } from '../iso_val_conversions/conversions';
import { ConfigService } from '@nestjs/config';
import { PartyBankAccount } from '../partyBankAccount';





@Injectable()
export class IssuerService {

    constructor(
        private readonly convertToVal: Conversion,
        private readonly bankParty: PartyBankAccount
    ){}

    
    parseIsoMessage(buffer) {

        const Iso8583 = require('iso_8583');

        const message = buffer.slice(2); // remove 2-byte length header

        const iso = new Iso8583();
        const parsed = iso.getIsoJSON(message);

        return parsed;

        }

    IssuerBankService(){

        let responseCode = "00";
        const net = require('net');

        const server = net.createServer((socket) => {

        socket.on('data', (data) => {

            console.log("Received ISO message:", data.toString('hex'));

            const isoMsg = this.parseIsoMessage(data);
            
            /*Authorisation process */
            const bank = this.bankParty.getBankParty();

            const amount = this.convertToVal.reverseIsoAmount(isoMsg[4])
            const expiryDate = this.convertToVal.reverseExpiry(isoMsg[14])
            const pan = isoMsg[2]
            
            //  console.log(` isoAmount: ${amount}`)
            //  console.log(` expiryDate: ${expiryDate}`)
            //  console.log(` pan: ${pan}`)
            //  console.log(` balance: ${bank.BALANCE}`)
            //  console.log(` bank Exp: ${bank.EXPIRY}`)
            //  console.log(` bank pan: ${bank.PAN}`)


            if(amount > bank.BALANCE || expiryDate !== bank.EXPIRY || pan !== bank.PAN){
                responseCode = "51"
            }
            console.log(`response: ${responseCode}`)
            
             });

        });
        server.listen(5000, () => {
        console.log("ISO8583 server running on port 5000");
        });

    };

}

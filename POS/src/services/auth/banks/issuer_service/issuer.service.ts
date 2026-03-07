import { Injectable } from '@nestjs/common';
import { Coversion } from '../iso_val_conversions/conversions';
import { ConfigService } from '@nestjs/config';



export const BankParty1 = {

  BALANCE: 2000,
  PAN: process.env.ISSUER_PARTY1_PAN,
  EXPIRY: process.env.EXPIRY_DATE, 

} as const;


@Injectable()
export class IssuerService {

    constructor(
        private readonly convertToVal: Coversion
    ){}

    
    parseIsoMessage(buffer) {

        const Iso8583 = require('iso_8583');

        const message = buffer.slice(2); // remove 2-byte length header

        const iso = new Iso8583();
        const parsed = iso.getIsoJSON(message);

        return parsed;

        }

    IssuerBankService(){
        const net = require('net');

        const server = net.createServer((socket) => {

        socket.on('data', (data) => {

            console.log("Received ISO message:", data.toString('hex'));

            const isoMsg = this.parseIsoMessage(data);

            /*Authorisation process */

            let responseCode = "00";
            
            const amount = this.convertToVal.reverseIsoAmount(isoMsg[4])
            const expiryDate = this.convertToVal.reverseExpiry(isoMsg[14])
            const pan = isoMsg[2]
        

            if(amount >= BankParty1.BALANCE || expiryDate !== BankParty1.EXPIRY || pan !== BankParty1.PAN){
                responseCode = "51"
            }
            return responseCode;
           



        //  const isoMsg = parseIsoMessage(data);

        //   const amount = isoMsg[4];
        //   const pan = isoMsg[2];

        //   let responseCode = "00";

        //   if (amount > 100000) {
        //     responseCode = "51";
        //   }

        //   const response = buildIsoResponse(isoMsg, responseCode);

        //   socket.write(response);

            // console.log("MTI:", iso[0]);
            // console.log("PAN:", iso[2]);
            // console.log("Amount:", iso[4]);
            // console.log("STAN:", iso [11]);
            // console.log("Terminal:", iso [41]);
            // console.log("Merchant:", iso [43]);
            // console.log("Currency:", iso [49]);
             

             });

        });
        server.listen(5000, () => {
        console.log("ISO8583 server running on port 5000");
        });
    };
}

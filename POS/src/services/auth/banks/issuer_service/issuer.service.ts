import { Injectable } from '@nestjs/common';
import { Conversion } from '../iso_val_conversions/conversions';
import { ConfigService } from '@nestjs/config';
import { PartyBankAccount } from '../partyBankAccount';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';




@Injectable()
export class IssuerService {

    constructor(
        @InjectRepository(Transaction) private readonly transactionRepository:Repository<Transaction>,
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


        const net = require('net');
        const fs = require('fs');

        const server = net.createServer((socket) => {

        socket.on('data', (data) => {

            console.log("Received ISO message:", data.toString('hex'));

            let responseCode = "51";
            const isoMsg = this.parseIsoMessage(data);
            
            /*Authorisation process */
            const bank = this.bankParty.getBankParty();

            const pan = isoMsg[2]
            const stan = Number( isoMsg[11] )
            const amount = this.convertToVal.reverseIsoAmount(isoMsg[4])
            const expiryDate = this.convertToVal.reverseExpiry(isoMsg[14])
            
            //  console.log(` isoAmount: ${amount}`)
            //  console.log(` expiryDate: ${expiryDate}`)
            //  console.log(` pan: ${pan}`)
            //  console.log(` balance: ${bank.BALANCE}`)
            //  console.log(` bank Exp: ${bank.EXPIRY}`)
            //  console.log(` bank pan: ${bank.PAN}`)


            if(amount <= bank.BALANCE || expiryDate == bank.EXPIRY || pan == bank.PAN){
                responseCode = "00"

                const responseApporved = {
                    "Authorisation_code": "9384FDC",
                    "Response_code": responseCode,
                    "Reason": "All data vaildated."
                }

            const json = JSON.stringify(responseApporved, null, 2);  /* not the most elegant of the approaches */

                fs.writeFile('approved.json', json, 'utf8', (err) => {
                    if (err) {
                        console.error('Error writing file:', err);
                    }
                    console.log('JSON file created: approved.json');
                    });
    
            };
            console.log(`response: ${responseCode}`)


            
            });
            

        });
        server.listen(5000, () => {
        console.log("ISO8583 server running on port 5000");
        });

    };

}

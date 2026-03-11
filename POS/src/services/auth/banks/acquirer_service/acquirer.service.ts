import { Injectable } from '@nestjs/common';
import { AcquirerRequest } from 'src/services/orchestrator/transaction.service';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';
import { Conversion } from '../iso_val_conversions/conversions';
import { InjectRepository } from '@nestjs/typeorm';
import { Acquirer } from '../entity/acquirer.entity';
import { TokenisationService, vault } from 'src/services/tokenisation_service/tokenisation.service';
import { Repository } from 'typeorm';

@Injectable()
export class AcquirerService {
    
    constructor(
        @InjectRepository(Acquirer) private readonly acquirerRepository:Repository<Acquirer>,
         private readonly tokenService:TokenisationService,
        private readonly encryptSecurity: EncryptSecurity,
        private readonly convertInIsoVal: Conversion,
    ){}


    async acquirerBankService( acqData:AcquirerRequest ){


        const fee = 0.74;
        const merchantNetAmount = acqData.amount - fee;

        const acquirerTable = await this.acquirerRepository.create(
            {
                gross_amount:acqData.amount,
                merchant:acqData.merchant,
                fee:fee,
                merchant_net_amount:merchantNetAmount
            }
        )

        await this.acquirerRepository.save(acquirerTable)


        const net = require('net');
        const iso8583 = require('iso_8583');

        
        const isoAmount = this.convertInIsoVal.toIsoAmount(acqData.amount);

        // const panObject = JSON.parse(acqData.panToken)
        const expObject =  JSON.parse(acqData.exiprationDate);

        const rawPan = this.tokenService.detokenisetoken(acqData.panToken);


        // console.log(typeof(rawPan));

        const rawExpDate = this.encryptSecurity.decrypt(expObject);
        
        const isoExpDate = this.convertInIsoVal.formatExpiry(rawExpDate)

        const stanString = acqData.stan.toString()
        
        const acquirer = new net.Socket();
        
        
        acquirer.connect(5000,'localhost',() => {
            
            let data = {
                0: '0200', /*financial transaction request (response is 0210) */
                2: rawPan,
                3: '000000', /*processing code*/
                4: isoAmount,
                11: stanString, /*System Trace Audit Number.*/
                14: isoExpDate,
                41: acqData.terminalid,
                43: acqData.merchant.padEnd(40, " "),
                49: "826" /*this is the ISO 4217 numeric currency code ecquivalent of GBP */
            };
            
            
            let iso = new iso8583(data);
            

            const isoBuffer = iso.getBufferMessage();
            

            // add 2-byte length header
            const len = Buffer.alloc(2);
            len.writeUInt16BE(isoBuffer.length);

    
            const finalMessage = Buffer.concat([len, isoBuffer]);
    
            acquirer.write(finalMessage);

        })
        

        acquirer.on('data', (data) => {
        console.log('Response:', data.toString('hex'));
        });
        

    }
}

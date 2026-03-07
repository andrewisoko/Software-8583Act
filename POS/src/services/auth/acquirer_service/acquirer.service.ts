import { Injectable } from '@nestjs/common';
import { AcquirerRequest } from 'src/services/orchestrator/transaction.service';
import { NestFactory } from '@nestjs/core';
import { AcquirerModule } from './acquirer.module';

@Injectable()
export class AcquirerService {
    /* calculate fee, check Merchant net amount, routes to the correct issuer bank */

    acquirerBankService( data:AcquirerRequest ){

        const net = require('net');
        const iso8583 = require('iso_8583');
        const fee = 0.74;
        const merchantNetAmount = data.amount - fee;

        const acquirer = new net.Socket();
        

    }
}

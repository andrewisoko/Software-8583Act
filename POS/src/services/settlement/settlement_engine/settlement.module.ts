import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { SettlementController } from './settlement.controller';
import { SettlementSignal } from '@nestjs/core/injector/settlement-signal';
import { SettlementService } from './settlement.service';
import { Ledger } from 'src/services/ledger.service/entity/ledger.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSchema } from 'src/services/account_service/document/account.doc';

@Module({
    imports:[
        TypeOrmModule.forFeature([Transaction,Ledger]),
        MongooseModule.forFeature([ {name:'Account', schema: AccountSchema} ])
],
    controllers:[SettlementController],
    providers:[SettlementService]

})
export class SettlementEngineModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from 'src/services/orchestrator/entity/transaction.entity';
import { SettlementController } from './settlement.controller';
import { SettlementSignal } from '@nestjs/core/injector/settlement-signal';
import { SettlementService } from './settlement.service';
import { Ledger } from 'src/services/ledger.service/entity/ledger.entity';
import { Account } from 'src/services/account_service/entity/account.entity';

@Module({
    imports:[TypeOrmModule.forFeature([Transaction,Ledger,Account])],
    controllers:[SettlementController],
    providers:[SettlementService]

})
export class SettlementEngineModule {}

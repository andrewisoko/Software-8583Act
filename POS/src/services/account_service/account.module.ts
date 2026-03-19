import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';
import { Transaction } from '../orchestrator/entity/transaction.entity';
import { EncryptSecurity } from '../orchestrator/encryption/encrypt.security';
import { Ledger } from '../ledger.service/entity/ledger.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account,Transaction,Ledger])],
  controllers: [AccountController],
  providers: [AccountService,EncryptSecurity]
})
export class AccountModule {}

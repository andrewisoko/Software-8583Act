import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './entity/account.entity';
import { Transaction } from '../orchestrator/entity/transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account,Transaction])],
  controllers: [AccountController],
  providers: [AccountService]
})
export class AccountModule {}

import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../orchestrator/entity/transaction.entity';
import { EncryptSecurity } from '../orchestrator/encryption/encrypt.security';
import { Ledger } from '../ledger.service/entity/ledger.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSchema } from './document/account.doc';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction,Ledger]),
    MongooseModule.forFeature([ { name :'Account', schema:AccountSchema }])
  ],
  controllers: [AccountController],
  providers: [AccountService,EncryptSecurity]
})
export class AccountModule {}

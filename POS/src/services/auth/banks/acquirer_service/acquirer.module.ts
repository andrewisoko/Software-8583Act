import { Module } from '@nestjs/common';
import { AcquirerService } from './acquirer.service';
import { AcquirerController } from './acquirer.controller';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';
import { Coversion } from '../iso_val_conversions/conversions';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Acquirer } from '../entity/acquirer.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Acquirer])],
  providers: [AcquirerService,EncryptSecurity,Coversion],
  controllers: [AcquirerController]
})
export class AcquirerModule {}

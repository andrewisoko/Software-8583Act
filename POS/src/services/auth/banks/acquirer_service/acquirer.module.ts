import { Module } from '@nestjs/common';
import { AcquirerService } from './acquirer.service';
import { AcquirerController } from './acquirer.controller';
import { EncryptSecurity } from 'src/services/orchestrator/encryption/encrypt.security';
import { Conversion } from '../iso_val_conversions/conversions';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Acquirer } from '../entity/acquirer.entity';
import { TokenisationService } from 'src/services/tokenisation_service/tokenisation.service';

@Module({
  imports:[TypeOrmModule.forFeature([Acquirer])],
  providers: [AcquirerService,
    EncryptSecurity,
    Conversion,
    TokenisationService
    ],
  controllers: [AcquirerController]
})
export class AcquirerModule {}

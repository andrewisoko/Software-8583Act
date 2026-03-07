import { Module } from '@nestjs/common';
import { AcquirerService } from './acquirer.service';
import { AcquirerController } from './acquirer.controller';

@Module({
  providers: [AcquirerService],
  controllers: [AcquirerController]
})
export class AcquirerModule {}

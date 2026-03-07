import { Test, TestingModule } from '@nestjs/testing';
import { AcquirerService } from './acquirer.service';

describe('AcquirerService', () => {
  let service: AcquirerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AcquirerService],
    }).compile();

    service = module.get<AcquirerService>(AcquirerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

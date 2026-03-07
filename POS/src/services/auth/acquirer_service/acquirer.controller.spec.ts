import { Test, TestingModule } from '@nestjs/testing';
import { AcquirerController } from './acquirer.controller';

describe('AcquirerController', () => {
  let controller: AcquirerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcquirerController],
    }).compile();

    controller = module.get<AcquirerController>(AcquirerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

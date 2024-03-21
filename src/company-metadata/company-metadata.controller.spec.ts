import { Test, TestingModule } from '@nestjs/testing';
import { CompanyMetadataController } from './company-metadata.controller';
import { CompanyMetadataService } from './company-metadata.service';

describe('CompanyMetadataController', () => {
  let controller: CompanyMetadataController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyMetadataController],
      providers: [CompanyMetadataService],
    }).compile();

    controller = module.get<CompanyMetadataController>(
      CompanyMetadataController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

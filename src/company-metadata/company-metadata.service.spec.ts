import { Test, TestingModule } from '@nestjs/testing';
import { CompanyMetadataService } from './company-metadata.service';

describe('CompanyMetadataService', () => {
  let service: CompanyMetadataService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyMetadataService],
    }).compile();

    service = module.get<CompanyMetadataService>(CompanyMetadataService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

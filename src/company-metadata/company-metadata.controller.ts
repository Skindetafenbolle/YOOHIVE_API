import { Controller } from '@nestjs/common';
import { CompanyMetadataService } from './company-metadata.service';
@Controller('company-metadata')
export class CompanyMetadataController {
  constructor(
    private readonly companyMetadataService: CompanyMetadataService,
  ) {}
}

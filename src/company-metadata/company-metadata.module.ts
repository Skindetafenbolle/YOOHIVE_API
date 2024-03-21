import { Module } from '@nestjs/common';
import { CompanyMetadataService } from './company-metadata.service';
import { CompanyMetadataController } from './company-metadata.controller';

@Module({
  controllers: [CompanyMetadataController],
  providers: [CompanyMetadataService],
})
export class CompanyMetadataModule {}

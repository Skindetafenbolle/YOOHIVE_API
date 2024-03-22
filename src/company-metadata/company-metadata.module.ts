import { Module } from '@nestjs/common';
import { CompanyMetadataService } from './company-metadata.service';
import { CompanyMetadataController } from './company-metadata.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyMetadatum } from './entities/company-metadatum.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyMetadatum])],
  controllers: [CompanyMetadataController],
  providers: [CompanyMetadataService],
})
export class CompanyMetadataModule {}

import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Category } from '../category/entities/category.entity';
import { Tag } from '../tag/entities/tag.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Category, Tag, CompanyMetadatum]),
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
})
export class CompanyModule {}

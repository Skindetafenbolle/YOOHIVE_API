import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Category } from '../category/entities/category.entity';
import { Tag } from '../tag/entities/tag.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';
import { User } from '../user/entities/user.entity';
import { TagModule } from '../tag/tag.module';
import { CompanyMetadataModule } from '../company-metadata/company-metadata.module';
import { CategoryModule } from '../category/category.module';
import { ServiceModule } from '../service/service.module';
import { Service } from '../service/entities/service.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Subcategory } from '../subcategory/entities/subcategory.entity';
import { SubcategoryModule } from '../subcategory/subcategory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      Category,
      Tag,
      CompanyMetadatum,
      User,
      Service,
      Subcategory,
    ]),
    TagModule,
    CompanyMetadataModule,
    CategoryModule,
    ServiceModule,
    SubcategoryModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService, JwtAuthGuard, RolesGuard],
  exports: [CompanyService],
})
export class CompanyModule {}

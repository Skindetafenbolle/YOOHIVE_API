import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { CompanyMetadataModule } from './company-metadata/company-metadata.module';
import { TagModule } from './tag/tag.module';
import { ServiceModule } from './service/service.module';

@Module({
  imports: [CompanyModule, UserModule, CategoryModule, CompanyMetadataModule, TagModule, ServiceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

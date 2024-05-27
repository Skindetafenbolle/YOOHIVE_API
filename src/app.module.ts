import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { CompanyMetadataModule } from './company-metadata/company-metadata.module';
import { TagModule } from './tag/tag.module';
import { ServiceModule } from './service/service.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { SubcategoryModule } from './subcategory/subcategory.module';
import { ElasticSearchModule } from './elasticsearch/elasticsearch.module';
import { IndexingModule } from './indexing/indexing.module';
import { ElasticSearchService } from './elasticsearch/elasticsearch.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CompanyModule,
    UserModule,
    CategoryModule,
    CompanyMetadataModule,
    TagModule,
    ServiceModule,
    AuthModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: 5432,
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        synchronize: true,
        // ssl: {
        //   rejectUnauthorized: false,
        // },
        entities: [__dirname + '/**/*.entity{.js, .ts}'],
      }),
      inject: [ConfigService],
    }),
    SubcategoryModule,
    ElasticSearchModule,
    IndexingModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly elasticSearchService: ElasticSearchService) {}

  async onModuleInit() {
    await this.elasticSearchService.createIndex('services');
    console.log('zslupa');
  }
}

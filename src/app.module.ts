import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CompanyModule } from './company/company.module';
import { UserModule } from './user/user.module';
import { CategoryModule } from './category/category.module';
import { CompanyMetadataModule } from './company-metadata/company-metadata.module';
import { TagModule } from './tag/tag.module';
import { ServiceModule } from './service/service.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as process from 'process';
import { Category } from './category/entities/category.entity';
import { Company } from './company/entities/company.entity';
import { CompanyMetadatum } from './company-metadata/entities/company-metadatum.entity';
import { Service } from './service/entities/service.entity';
import { Tag } from './tag/entities/tag.entity';
import { User } from './user/entities/user.entity';

@Module( {
  imports: [ConfigModule.forRoot( { isGlobal: true } ),
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
                port: configService.get('DB_PORT'),
                username: configService.get('DB_USERNAME'),
                password: configService.get('DB_PASSWORD'),
                database: configService.get('DB_NAME'),
                synchronize: true,
                entities: [__dirname + '/**/*.entity{.js, .ts}']
              }),

              inject: [ConfigService]
            }),
            TypeOrmModule.forFeature([Category, Company, CompanyMetadatum, Service, Tag, User])
  ],
  controllers: [AppController],
  providers: [AppService],
} )
export class AppModule {
}

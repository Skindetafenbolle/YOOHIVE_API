import { Module } from '@nestjs/common';
import { ServiceService } from './service.service';
import { ServiceController } from './service.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { Company } from '../company/entities/company.entity';
import { ElasticSearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service, Company]), ElasticSearchModule],
  controllers: [ServiceController],
  providers: [ServiceService],
  exports: [ServiceService],
})
export class ServiceModule {}

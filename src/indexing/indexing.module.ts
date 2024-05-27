// src/indexing/indexing.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from '../service/entities/service.entity';
import { IndexingService } from './indexing.service';
import { ElasticSearchModule } from '../elasticsearch/elasticsearch.module';

@Module({
  imports: [TypeOrmModule.forFeature([Service]), ElasticSearchModule],
  providers: [IndexingService],
})
export class IndexingModule {}

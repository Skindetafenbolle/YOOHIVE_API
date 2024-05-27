// elasticsearch.module.ts
import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ElasticSearchService } from './elasticsearch.service';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: 'https://f4ac3cf54ec54733b6743b6c31585ff4.es.us-east-1.aws.elastic.cloud:443',
      auth: {
        apiKey: 'VmN0Z29JOEJILWM3TWlIbTA3ZDg6eXhTZDdYdzRSeDJOaWVXNmhTc0lQUQ==',
      },
    }),
  ],
  exports: [ElasticsearchModule, ElasticSearchService],
  providers: [ElasticSearchService],
})
export class ElasticSearchModule {}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../service/entities/service.entity';
import { Client } from '@elastic/elasticsearch';
import { ElasticSearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class IndexingService implements OnModuleInit {
  private readonly elasticsearchClient: Client;

  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly elasticsearchService: ElasticSearchService,
  ) {
    this.elasticsearchClient = this.elasticsearchService.getClient();
  }

  async onModuleInit() {
    await this.elasticsearchService.createIndex('services');
    await this.indexAllServices();
  }

  async indexAllServices(batchSize: number = 1000) {
    let offset = 0;
    let services;

    do {
      services = await this.serviceRepository.find({
        skip: offset,
        take: batchSize,
      });

      if (services.length === 0) {
        break;
      }

      const bulkOperations = services.flatMap((service) => [
        { index: { _index: 'services', _id: service.id.toString() } },
        {
          id: service.id,
          name: service.name,
          description: service.description,
          // Другие поля, если необходимо
        },
      ]);

      if (bulkOperations.length === 0) {
        continue;
      }

      await this.elasticsearchClient.bulk({ body: bulkOperations });

      offset += batchSize;
    } while (services.length > 0);
  }
}

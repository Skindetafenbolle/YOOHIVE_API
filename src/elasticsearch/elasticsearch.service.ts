import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { Client } from '@elastic/elasticsearch';
import { Service } from '../service/entities/service.entity';

@Injectable()
export class ElasticSearchService {
  private readonly logger = new Logger(ElasticSearchService.name);
  private readonly client: Client;

  constructor(private readonly elasticsearchService: ElasticsearchService) {
    this.client = new Client({
      node: 'https://ebab85d65c4341ccbe20377095e915a7.europe-west3.gcp.cloud.es.io:443',
      auth: {
        apiKey: 'akQ1bmJaQUJIbFFXTmpleWlqbFc6bWhhVzFGZGtRN09KOWNyekUzYVVKZw==',
      },
    });
  }

  getClient(): Client {
    return this.client;
  }

  async createIndex(index: string) {
    try {
      const indexExists = await this.client.indices.exists({
        index,
      });

      if (!indexExists) {
        await this.client.indices.create({
          index,
          body: {
            settings: {
              analysis: {
                filter: {
                  synonym_filter: {
                    type: 'synonym',
                    synonyms: ['френч, маникюр', 'proverka, nepoklins'],
                  },
                },
                analyzer: {
                  custom_analyzer: {
                    type: 'custom',
                    tokenizer: 'edge_ngram_tokenizer',
                    filter: ['lowercase', 'synonym_filter'],
                  },
                },
                tokenizer: {
                  edge_ngram_tokenizer: {
                    type: 'edge_ngram',
                    min_gram: 1,
                    max_gram: 5,
                    token_chars: ['letter', 'digit'],
                  },
                },
              },
            },
            mappings: {
              properties: {
                name: { type: 'text', analyzer: 'custom_analyzer' },
                description: { type: 'text', analyzer: 'custom_analyzer' },
              },
            },
          },
        });
        this.logger.log(`Index '${index}' created successfully.`);
      } else {
        this.logger.warn(`Index '${index}' already exists.`);
      }
    } catch (error) {
      this.logger.error(`Error creating index '${index}': ${error.message}`);
    }
  }

  async indexService(service: Service) {
    try {
      await this.client.index({
        index: 'services',
        body: {
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price,
          // другие поля
        },
      });
      this.logger.log(`Service indexed successfully: ${service.id}`);
    } catch (error) {
      this.logger.error(
        `Error indexing service '${service.id}': ${error.message}`,
      );
    }
  }

  async search(query: string) {
    try {
      const result = await this.client.search({
        index: 'services',
        body: {
          query: {
            multi_match: {
              query,
              fields: ['name', 'description'],
              fuzziness: 'AUTO', // Добавляем нечеткий поиск
            },
          },
        },
      });
      this.logger.log(`Search query '${query}' executed successfully.`);
      return result.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      this.logger.error(
        `Error executing search query '${query}': ${error.message}`,
      );
      throw error;
    }
  }
}

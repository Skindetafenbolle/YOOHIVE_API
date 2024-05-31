import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServiceService } from './service.service';
import { Service } from './entities/service.entity';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';
import { ElasticSearchService } from '../elasticsearch/elasticsearch.service';

@Controller('service')
@ApiTags('service')
export class ServiceController {
  constructor(
    private readonly serviceService: ServiceService,
    private readonly elasticSearchService: ElasticSearchService,
  ) {}

  @Get(':id')
  @ApiParam({ name: 'id', description: 'The ID of the service' })
  @ApiResponse({
    status: 200,
    description: 'Service found',
    type: CreateServiceDto,
  })
  async getTagById(@Param('id') id: number): Promise<Service> {
    return await this.serviceService.getService(id);
  }

  @Get('/elastic/search')
  async searchServices(@Query('q') query: string) {
    return this.elasticSearchService.search(query);
  }
}

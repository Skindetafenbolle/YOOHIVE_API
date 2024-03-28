import { Controller, Get, Param } from '@nestjs/common';
import { ServiceService } from './service.service';
import { Service } from './entities/service.entity';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateServiceDto } from './dto/create-service.dto';

@Controller('service')
@ApiTags('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

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
}

import { Controller, Get, Param } from '@nestjs/common';
import { ServiceService } from './service.service';
import { Service } from './entities/service.entity';

@Controller('service')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}
  @Get(':id')
  async getTagById(@Param('id') id: number): Promise<Service> {
    return await this.serviceService.getService(id);
  }
}

import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '../company/entities/company.entity';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async createServices(
    company: Company,
    servicesData: any[],
  ): Promise<Service[]> {
    const services: Service[] = [];

    for (const serviceData of servicesData) {
      const service = new Service();
      service.name = serviceData.name || '';
      service.currency = serviceData.price?.currency || '';
      service.duration_minutes = serviceData.duration_minutes || 0;
      service.description = serviceData.description || '';
      service.companies = company;

      if (serviceData.price && serviceData.price.value !== null) {
        service.price = serviceData.price.value;
      } else {
        service.price = '';
      }
      if (serviceData.subServices && serviceData.subServices.length > 0) {
        service.subServices = await this.createServices(
          company,
          serviceData.subServices,
        );
      }

      services.push(service);
    }

    return await this.serviceRepository.save(services);
  }
}

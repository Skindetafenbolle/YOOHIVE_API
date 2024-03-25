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
      service.name = serviceData.name;
      service.price = serviceData.price.value;
      service.currency = serviceData.price.currency;
      service.duration_minutes = serviceData.duration_minutes;
      service.description = serviceData.description;
      service.companies = company; // Установка связи с компанией

      console.log('Service before save:', service); // Отладочный вывод

      if (serviceData.subServices && serviceData.subServices.length > 0) {
        service.subServices = await this.createServices(
          company,
          serviceData.subServices,
        );
      }

      services.push(service);
    }

    console.log('Services before save:', services);

    const savedServices = await this.serviceRepository.save(services);

    console.log('Saved services:', savedServices); // Отладочный вывод

    return savedServices;
  }
}

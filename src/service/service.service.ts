import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Service } from './entities/service.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from '../company/entities/company.entity';
import { ElasticSearchService } from '../elasticsearch/elasticsearch.service';

@Injectable()
export class ServiceService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly elasticSearchService: ElasticSearchService, // добавьте этот параметр
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

    const savedServices = await this.serviceRepository.save(services);
    for (const service of savedServices) {
      await this.elasticSearchService.indexService(service);
    }
    return savedServices;
  }

  async addSubService(
    parentId: number,
    companyId: number,
    subServiceData: Partial<Service>,
  ): Promise<Service> {
    const parentService = await this.serviceRepository.findOne({
      where: { id: parentId },
      relations: ['subServices'],
    });

    if (!parentService) {
      throw new NotFoundException('Parent service not found');
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const newSubService = this.serviceRepository.create(subServiceData);
    newSubService.parent = parentService;
    newSubService.companies = company;
    const savedSubService = await this.serviceRepository.save(newSubService);

    return savedSubService;
  }

  async getService(id: number) {
    const service = await this.serviceRepository.findOne({
      where: {
        id: id,
      },
      relations: ['parent'],
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async updateService(id: number, newData: Partial<Service>): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id: id },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }

    Object.assign(service, newData);
    return await this.serviceRepository.save(service);
  }

  async searchServices(query: string) {
    const result = await this.elasticSearchService.search(query);
    console.log(result);
    return result;
  }
}

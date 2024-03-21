import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './company/entities/company.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Company) private companyRepo: Repository<Company>,
  ) {}

  getAllCompany() {
    return `${this.companyRepo.find()} + dsds`;
  }
  getHello(): string {
    return 'Hello World!';
  }

  getProfile(): string {
    return 'Profile';
  }
}

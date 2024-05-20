import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyMetadatum } from './entities/company-metadatum.entity';
import { Company } from '../company/entities/company.entity';

@Injectable()
export class CompanyMetadataService {
  constructor(
    @InjectRepository(CompanyMetadatum)
    private companyMetadatumRepository: Repository<CompanyMetadatum>,
  ) {}

  async saveCompanyMetadata(metadata: {
    type: string;
    value: any;
    company: Company;
  }): Promise<CompanyMetadatum> {
    const { type, value, company } = metadata;

    const companyMetadatum = new CompanyMetadatum();
    companyMetadatum.type = type;
    companyMetadatum.value = value;
    companyMetadatum.company = company;

    return await this.companyMetadatumRepository.save(companyMetadatum);
  }

  // В файле company-metadata.service.ts

  async updateCompanyMetadata(metadata: CompanyMetadatum): Promise<void> {
    console.log(metadata + 'sjkflsdf');
    await this.companyMetadatumRepository.save(metadata);
  }
}

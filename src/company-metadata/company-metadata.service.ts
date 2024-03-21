import { Injectable } from '@nestjs/common';
import { CreateCompanyMetadatumDto } from './dto/create-company-metadatum.dto';
import { UpdateCompanyMetadatumDto } from './dto/update-company-metadatum.dto';

@Injectable()
export class CompanyMetadataService {
  create(createCompanyMetadatumDto: CreateCompanyMetadatumDto) {
    return 'This action adds a new companyMetadatum';
  }

  findAll() {
    return `This action returns all companyMetadata`;
  }

  findOne(id: number) {
    return `This action returns a #${id} companyMetadatum`;
  }

  update(id: number, updateCompanyMetadatumDto: UpdateCompanyMetadatumDto) {
    return `This action updates a #${id} companyMetadatum`;
  }

  remove(id: number) {
    return `This action removes a #${id} companyMetadatum`;
  }
}

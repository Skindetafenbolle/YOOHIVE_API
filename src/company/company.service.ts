import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Tag } from '../tag/entities/tag.entity';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';
import { User } from '../user/entities/user.entity';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CompanyMetadatum)
    private readonly companyMetadatumRepository: Repository<CompanyMetadatum>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createCompany(
    name: string,
    description: string,
    address: string,
    source: string,
    affiliation: string,
    geodata: object,
    tagIds: number[],
    categoryIds: number[],
  ): Promise<Company> {
    const company = this.companyRepository.create({
      name,
      description,
      address,
      source,
      affiliation,
      geodata,
    });

    if (tagIds && tagIds.length > 0) {
      company.tags = await this.tagRepository.findByIds(tagIds);
    }

    if (categoryIds && categoryIds.length > 0) {
      company.categories = await this.categoryRepository.findByIds(categoryIds);
    }

    return await this.companyRepository.save(company);
  }

  async addCompanyMetadatum(
    companyId: number,
    type: string,
    value: object,
  ): Promise<CompanyMetadatum> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const metadata = new CompanyMetadatum();
    metadata.type = type;
    metadata.value = value;
    metadata.companies = company;

    return await this.companyMetadatumRepository.save(metadata);
  }

  async getCompanyWithRelations(companyId: number): Promise<Company> {
    return await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
      relations: ['tags', 'companymetadatums', 'categories', 'users'],
    });
  }

  async addUserToCompany(userId: number, companyId: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
      relations: ['users'],
    });
    if (!company) {
      throw new Error('Company not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    company.users.push(user);

    return await this.companyRepository.save(company);
  }

  async removeUserFromCompany(
    companyId: number,
    userId: number,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
      relations: ['users'],
    });
    if (!company) {
      throw new Error('Company not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const userIdString = userId.toString();
    const userIndex = company.users.findIndex(
      (u) => u.id.toString() === userIdString,
    );

    if (userIndex === -1) {
      throw new Error('User not found in company');
    }

    company.users.splice(userIndex, 1);

    try {
      return await this.companyRepository.save(company);
    } catch (error) {
      throw new Error('Error saving changes');
    }
  }
}

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
    tagIds: number[],
    categoryIds: number[],
  ): Promise<Company> {
    const requestOptions = {
      method: 'GET',
    };
    const encodedAddress = encodeURIComponent(address);
    const geoDataResponse = await fetch(
      `https://api.geoapify.com/v1/geocode/search?text=${encodedAddress}&format=json&apiKey=258f766d097e435984f577698acb7cc0`,
      requestOptions,
    );
    const geoData: any = await geoDataResponse.json();

    if (geoData.results && geoData.results.length > 0) {
      const { lon, lat } = geoData.results[0];
      const geodata = { latitude: lat, longitude: lon };

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
        company.categories =
          await this.categoryRepository.findByIds(categoryIds);
      }

      return await this.companyRepository.save(company);
    } else {
      throw new Error('Geodata not found for the provided address');
    }
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
    try {
      return await this.companyRepository.findOne({
        where: {
          id: companyId,
        },
        relations: ['tags', 'companymetadatums', 'categories', 'users'],
      });
    } catch (e) {
      throw new Error(e.message);
    }
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

    try {
      return await this.companyRepository.save(company);
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async removeUserFromCompany(
    companyId: number,
    userId: number,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne( {
      where: {
        id: companyId,
      },
      relations: ['users'],
    } );
    if (!company) {
      throw new Error( 'Company not found' );
    }

    const user = await this.userRepository.findOne( { where: { id: userId } } );
    if (!user) {
      throw new Error( 'User not found' );
    }

    const userIdString = userId.toString();
    const userIndex = company.users.findIndex(
      (u) => u.id.toString() === userIdString,
    );

    if (userIndex === -1) {
      throw new Error( 'User not found in company' );
    }

    company.users.splice( userIndex, 1 );

    try {
      return await this.companyRepository.save( company );
    } catch (error) {
      throw new Error( 'Error saving changes' );
    }
  }

  async removeCompany(companyId: number): Promise<Company> {
    const company = await this.companyRepository.findOne( {
      where: {
        id: companyId,
      },
    });
    if (!company) {
      throw new Error( 'Company not found' );
    }
    try {
      return await this.companyRepository.remove( company );
    } catch (error) {
      throw new Error( 'Error delete company' );
    }
  }

  async getAllCompanies(): Promise<Company[]> {
    return await this.companyRepository.find();
  }

  // async createCompanyFromParser(data: any, source:string, category: string): Promise<Company> {
  //   const { name, description, address, affiliation, services, tags, schedule, categories } = data;
  //
  //   const company = await this.createCompany(name, description, address, source, affiliation, [], []);
  //
  //   company.tags = await this.saveTags( tags );
  //
  //   company.companymetadatums = await this.saveSchedule( schedule );
  //
  //   company.categories = await this.saveCategories( categories );
  //
  //   company.services = await this.saveServices( services );
  //
  //   return await this.companyRepository.save(company);
  // }

  // private async saveTags(tagsData: any[]): Promise<Tag[]> {
  // }
  //
  // private async saveSchedule(scheduleData: any[]): Promise<CompanyMetadatum[]> {
  //
  // }
  //
  // private async saveCategories(categoriesData: any[]): Promise<Category[]> {
  // }
  //
  // private async saveServices(servicesData: any[]): Promise<Service[]> {
  // }
}

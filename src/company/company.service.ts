import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Tag } from '../tag/entities/tag.entity';
import { Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';
import { User } from '../user/entities/user.entity';
import { TagService } from '../tag/tag.service';
import { CompanyMetadataService } from '../company-metadata/company-metadata.service';
import { CategoryService } from '../category/category.service';
import { Service } from '../service/entities/service.entity';
import { ServiceService } from '../service/service.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    private readonly tagService: TagService,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly serviceService: ServiceService,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly categoryService: CategoryService,
    @InjectRepository(CompanyMetadatum)
    private readonly companyMetadatumRepository: Repository<CompanyMetadatum>,
    private companyMetadataService: CompanyMetadataService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

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
    metadata.company = company;

    return await this.companyMetadatumRepository.save(metadata);
  }

  async getCompanyWithRelations(companyId: number): Promise<Company> {
    try {
      return await this.companyRepository.findOne({
        where: {
          id: companyId,
        },
        relations: [
          'tags',
          'companymetadatums',
          'categories',
          'users',
          'services',
        ],
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

  async removeCompany(companyId: number): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
    });
    if (!company) {
      throw new Error('Company not found');
    }
    try {
      return await this.companyRepository.remove(company);
    } catch (error) {
      throw new Error('Error delete company');
    }
  }

  async getAllCompanies(): Promise<Company[]> {
    return await this.companyRepository.find();
  }

  async createCompanyFromParser(
    data: any,
    source: string,
    category: string,
  ): Promise<Company[]> {
    const existingCategory =
      await this.categoryService.getCategoryByName(category);
    let categoryObject: Category;

    if (existingCategory) {
      categoryObject = existingCategory;
    } else {
      categoryObject = await this.categoryService.createCategory(
        category,
        category,
      );
    }

    const companies: Company[] = [];

    for (const companyData of data) {
      const {
        name,
        description,
        address,
        affiliation,
        specialTags,
        languages,
        servicesData,
        schedule,
        phones,
        socialMediaLinks,
        exampleWorks,
        email,
      } = companyData;

      let company = await this.companyRepository.findOne({
        where: { name },
        relations: ['categories', 'companymetadatums', 'services'],
      });

      if (!company) {
        const geoData = await this.getGeoData(address);
        company = await this.createCompany(
          name,
          description,
          address,
          source,
          affiliation,
          geoData,
        );
        company.categories = [categoryObject];
        companies.push(company);
      } else {
        const categoryExists = company.categories.some(
          (cat) => cat.id === categoryObject.id,
        );

        if (!categoryExists) {
          company.categories.push(categoryObject);
        }
      }

      const tags = await this.tagService.saveTags(specialTags);
      const languagesArray = await this.tagService.saveLanguages(languages);
      if (!company.tags) {
        company.tags = [];
      }
      company.tags = [...company.tags, ...tags, ...languagesArray];

      const savedCompany = await this.companyRepository.save(company);

      // Сохранение метаданных только если они отсутствуют у компании
      const metadataTypes = [
        'schedule',
        'phones',
        'email',
        'socialMediaLinks',
        'images',
      ];
      for (const metadataType of metadataTypes) {
        let metadataValue;
        switch (metadataType) {
          case 'schedule':
            metadataValue = schedule;
            break;
          case 'phones':
            metadataValue = phones;
            break;
          case 'email':
            metadataValue = email;
            break;
          case 'socialMediaLinks':
            metadataValue = socialMediaLinks;
            break;
          case 'images':
            metadataValue = exampleWorks;
            break;
          default:
            metadataValue = null;
        }

        if (metadataValue !== null) {
          const existingMetadata = company.companymetadatums.some(
            (metadata) => metadata.type === metadataType,
          );
          if (!existingMetadata) {
            await this.companyMetadataService.saveCompanyMetadata({
              type: metadataType,
              value: metadataValue,
              company: savedCompany,
            });
          }
        }
      }

      const existingServiceIds = company.services.map((service) => service.id);
      const newServices = servicesData.filter(
        (service) => !existingServiceIds.includes(service.id),
      );
      if (newServices.length > 0) {
        await this.serviceService.createServices(savedCompany, newServices);
      }

      companies.push(savedCompany);
    }

    return companies;
  }

  private async createCompany(
    name: string,
    description: string,
    address: string,
    source: string,
    affiliation: string,
    geoData: { latitude: number; longitude: number } | null,
  ): Promise<Company> {
    return this.companyRepository.create({
      name,
      description,
      address,
      source,
      affiliation,
      geodata: geoData,
    });
  }

  private async getGeoData(
    address: string,
  ): Promise<{ latitude: number; longitude: number } | null> {
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
      return { latitude: lat, longitude: lon };
    } else {
      return null;
    }
  }
}

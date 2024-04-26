import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities/company.entity';
import { Tag } from '../tag/entities/tag.entity';
import { Like, Repository } from 'typeorm';
import { Category } from '../category/entities/category.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';
import { User } from '../user/entities/user.entity';
import { TagService } from '../tag/tag.service';
import { CompanyMetadataService } from '../company-metadata/company-metadata.service';
import { CategoryService } from '../category/category.service';
import { Service } from '../service/entities/service.entity';
import { ServiceService } from '../service/service.service';
import { PaginationOptionsInterface } from './dto/PaginationOptionsInterface';
import { SubcategoryService } from '../subcategory/subcategory.service';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly tagService: TagService,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    private readonly serviceService: ServiceService,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly categoryService: CategoryService,
    private readonly subcategoryService: SubcategoryService,
    @InjectRepository(CompanyMetadatum)
    private readonly companyMetadatumRepository: Repository<CompanyMetadatum>,
    private companyMetadataService: CompanyMetadataService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getAllCompanies(
    options: PaginationOptionsInterface,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    const skip = (options.page - 1) * options.perPage;

    const totalCount = await this.companyRepository.count();

    let companies = await this.companyRepository.find({
      take: options.perPage,
      skip: skip,
      relations: ['tags', 'companymetadatums', 'categories'],
    });

    companies = await Promise.all(
      companies.map(async (company) => {
        if (company.subscription === 'None') {
          company.geodata = null;
          if (company.description != null) {
            company.description = company.description.slice(0, 220);
          }
          const imageMetadata = company.companymetadatums.find(
            (metadata: CompanyMetadatum) => metadata.type === 'images',
          );

          company.companymetadatums = company.companymetadatums.filter(
            (metadata: CompanyMetadatum) =>
              metadata.type !== 'socialMediaLinks',
          );

          company.tags = company.tags.filter(
            (tag: Tag) => tag.name === 'poland',
          );

          if (
            imageMetadata &&
            imageMetadata.value &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            imageMetadata.value.length > 0
          ) {
            const firstImage = imageMetadata.value[0];
            company.companymetadatums.forEach((metadata: CompanyMetadatum) => {
              if (metadata.type === 'images') {
                metadata.value = [firstImage];
              }
            });
          }
        }
        company.services = await this.serviceRepository.find({
          where: { companies: { id: company.id } },
          take: 3,
        });
        company.companymetadatums = company.companymetadatums.filter(
          (metadata) => metadata.type === 'images',
        );

        return company;
      }),
    );

    return { companies, totalCount };
  }

  async getCompaniesByCategory(
    categoryName: string,
    options: PaginationOptionsInterface,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    const skip = (options.page - 1) * options.perPage;

    const category = await this.categoryRepository.findOne({
      where: { name: categoryName },
    });

    if (!category) {
      return { companies: [], totalCount: 0 };
    }

    const query = this.companyRepository.createQueryBuilder('company');
    query.leftJoinAndSelect('company.categories', 'category');
    query.leftJoinAndSelect('company.tags', 'tag');
    query.leftJoinAndSelect('company.companymetadatums', 'metadata');
    query.where('category.id = :categoryId', { categoryId: category.id });
    query.take(options.perPage);
    query.skip(skip);

    const totalCount = await query.getCount();
    let companies = await query.getMany();

    companies = await Promise.all(
      companies.map(async (company) => {
        if (company.subscription === 'None') {
          company.geodata = null;
          if (company.description != null) {
            company.description = company.description.slice(0, 220);
          }
          const imageMetadata = company.companymetadatums.find(
            (metadata: CompanyMetadatum) => metadata.type === 'images',
          );

          company.companymetadatums = company.companymetadatums.filter(
            (metadata: CompanyMetadatum) =>
              metadata.type !== 'socialMediaLinks',
          );

          company.tags = company.tags.filter(
            (tag: Tag) => tag.name === 'poland',
          );

          if (
            imageMetadata &&
            imageMetadata.value &&
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            imageMetadata.value.length > 0
          ) {
            const firstImage = imageMetadata.value[0];
            company.companymetadatums.forEach((metadata: CompanyMetadatum) => {
              if (metadata.type === 'images') {
                metadata.value = [firstImage];
              }
            });
          }
        }
        company.services = await this.serviceRepository.find({
          where: { companies: { id: company.id } },
          take: 3,
        });
        company.companymetadatums = company.companymetadatums.filter(
          (metadata) => metadata.type === 'images',
        );

        return company;
      }),
    );

    return { companies, totalCount };
  }

  async getCompaniesByCategoryAndCity(
    categoryName: string | null,
    city: string | null,
    tags: string[] | null,
    options: PaginationOptionsInterface,
  ) {
    const skip = (options.page - 1) * options.perPage;

    let queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.categories', 'category')
      .leftJoinAndSelect('company.tags', 'tag')
      .leftJoinAndSelect('company.companymetadatums', 'metadata');

    if (categoryName) {
      queryBuilder = queryBuilder.where('category.name = :categoryName', {
        categoryName,
      });
    }

    if (city) {
      queryBuilder = queryBuilder.andWhere('company.address LIKE :city', {
        city: `%${city}%`,
      });
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.andWhere('tag.name IN (:...tags)', { tags });
    }

    queryBuilder = queryBuilder
      .select([
        'company.id',
        'company.name',
        'company.description',
        'company.address',
        'metadata',
      ])
      .take(options.perPage)
      .skip(skip);

    const [companies, totalCount] = await queryBuilder.getManyAndCount();

    return { companies, totalCount };
  }

  async findCompanyByName(name: string): Promise<Company> {
    try {
      const company = await this.companyRepository.findOne({
        where: {
          name: Like(`%${name}%`),
        },
        relations: [
          'tags',
          'companymetadatums',
          'categories',
          'users',
          'services',
          'services.parent',
        ],
      });
      if (company.subscription === 'None') {
        company.geodata = null;
        if (company.description != null) {
          company.description = company.description.slice(0, 220);
        }
        const imageMetadata = company.companymetadatums.find(
          (metadata: CompanyMetadatum) => metadata.type === 'images',
        );

        company.companymetadatums = company.companymetadatums.filter(
          (metadata: CompanyMetadatum) => metadata.type !== 'socialMediaLinks',
        );

        company.tags = company.tags.filter((tag: Tag) => tag.name === 'poland');

        if (
          imageMetadata &&
          imageMetadata.value &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          imageMetadata.value.length > 0
        ) {
          const firstImage = imageMetadata.value[0];
          company.companymetadatums.forEach((metadata: CompanyMetadatum) => {
            if (metadata.type === 'images') {
              metadata.value = [firstImage];
            }
          });
        }
      }

      return company;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async findCompaniesByName(
    name: string,
    options: PaginationOptionsInterface,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    try {
      const skip = (options.page - 1) * options.perPage;

      const totalCount = await this.companyRepository.count({
        where: {
          name: Like(`%${name}%`),
        },
      });

      let companies = await this.companyRepository.find({
        where: {
          name: Like(`%${name}%`),
        },
        take: options.perPage,
        skip: skip,
        relations: ['tags', 'companymetadatums', 'categories', 'subcategories'],
      });

      companies = await Promise.all(
        companies.map(async (company) => {
          if (company.subscription === 'None') {
            company.geodata = null;
            if (company.description != null) {
              company.description = company.description.slice(0, 220);
            }
            const imageMetadata = company.companymetadatums.find(
              (metadata: CompanyMetadatum) => metadata.type === 'images',
            );

            company.companymetadatums = company.companymetadatums.filter(
              (metadata: CompanyMetadatum) =>
                metadata.type !== 'socialMediaLinks',
            );

            company.tags = company.tags.filter(
              (tag: Tag) => tag.name === 'poland',
            );

            if (
              imageMetadata &&
              imageMetadata.value &&
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-expect-error
              imageMetadata.value.length > 0
            ) {
              const firstImage = imageMetadata.value[0];
              company.companymetadatums.forEach(
                (metadata: CompanyMetadatum) => {
                  if (metadata.type === 'images') {
                    metadata.value = [firstImage];
                  }
                },
              );
            }
          }
          company.services = await this.serviceRepository.find({
            where: { companies: { id: company.id } },
            take: 3,
          });
          company.companymetadatums = company.companymetadatums.filter(
            (metadata) => metadata.type === 'images',
          );

          return company;
        }),
      );

      return { companies, totalCount };
    } catch (e) {
      throw new Error(e.message);
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
    metadata.company = company;

    return await this.companyMetadatumRepository.save(metadata);
  }

  async changeSub(companyId: number, variant: string): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
    });
    if (!company) {
      throw new NotFoundException('Not found company');
    }
    company.subscription = variant;
    await this.companyRepository.save(company);
    return company;
  }

  async editCompany(
    companyId: number,
    data: Partial<Company>,
  ): Promise<Company> {
    const company = await this.companyRepository.findOne({
      where: {
        id: companyId,
      },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    Object.assign(company, data);

    await this.companyRepository.save(company);

    return company;
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

  async getCompanyById(companyId: number): Promise<Company> {
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
          'services.parent',
        ],
      });
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

  async createCompanyFromParser(
    data: any[],
    source: string,
    category: string,
    subcategories: string[],
  ): Promise<Company[]> {
    console.log('Received data:', data);
    console.log('Source:', source);
    console.log('Category:', category);
    console.log('Subcategories:', subcategories);

    const existingCategory =
      await this.categoryService.getCategoryByName(category);
    let categoryObject: Category;

    if (!existingCategory) {
      console.log('Creating new category...');
      categoryObject = await this.categoryService.createCategory(
        category,
        category,
      );
      console.log('New category created:', categoryObject);
    } else {
      categoryObject = existingCategory;
    }

    const companies: Company[] = [];

    for (const companyData of data) {
      console.log('Processing company data:', companyData);

      const {
        name,
        description,
        address,
        affiliation,
        specialTags,
        languages,
        services,
        schedule,
        phones,
        socialMediaLinks,
        exampleWorks,
        email,
        googleSchedule,
        subscription,
      } = companyData;

      console.log('Company name:', name);
      console.log('Company address:', address);

      let company = await this.companyRepository.findOne({
        where: { name },
        relations: ['categories', 'companymetadatums', 'subcategories'],
      });

      if (!company) {
        console.log('Company not found, creating new...');
        const geoData = await this.getGeoData(address);
        company = await this.createCompany(
          name,
          description,
          address,
          source,
          affiliation,
          subscription,
          geoData,
        );
        console.log('New company created:', company);

        company.categories = [categoryObject];
        console.log('Category added to the company:', categoryObject);

        const subcategoryObjects = await Promise.all(
          subcategories.map(async (subcategoryName) => {
            console.log('Processing subcategory:', subcategoryName);
            const existingSubcategory =
              await this.subcategoryService.getSubcategoryByName(
                subcategoryName,
              );
            if (existingSubcategory) {
              console.log('Existing subcategory found:', existingSubcategory);
              return existingSubcategory;
            } else {
              const newSubcategory =
                await this.subcategoryService.createSubcategory(
                  subcategoryName,
                );
              console.log('New subcategory created:', newSubcategory);
              return newSubcategory;
            }
          }),
        );

        company.subcategories = subcategoryObjects;

        if (!categoryObject.subcategories) {
          categoryObject.subcategories = [];
        }
        categoryObject.subcategories.push(...subcategoryObjects);

        await this.categoryRepository.save({
          ...categoryObject,
          subcategories: categoryObject.subcategories,
        });

        companies.push(company);
      } else {
        const categoryExists = company.categories.some(
          (cat) => cat.id === categoryObject.id,
        );
        if (!categoryExists) {
          company.categories.push(categoryObject);
          console.log('Category added to the company:', categoryObject);
        }

        const subcategoryObjects = await Promise.all(
          subcategories.map(async (subcategoryName) => {
            console.log('Processing subcategory:', subcategoryName);
            const existingSubcategory =
              await this.subcategoryService.getSubcategoryByName(
                subcategoryName,
              );
            console.log('Existing subcategory:', existingSubcategory);
            if (existingSubcategory) {
              return existingSubcategory;
            } else {
              const newSubcategory =
                await this.subcategoryService.createSubcategory(
                  subcategoryName,
                );
              console.log('New subcategory created:', newSubcategory);
              return newSubcategory;
            }
          }),
        );

        company.subcategories = [
          ...company.subcategories,
          ...subcategoryObjects,
        ];

        const existingSubcategories = categoryObject.subcategories || [];

        subcategoryObjects.forEach((subcatObj) => {
          console.log('Processing subcategory:', subcatObj);
          if (
            !company.subcategories.some((subcat) => subcat.id === subcatObj.id)
          ) {
            company.subcategories.push(subcatObj);
          }
        });

        // Добавляем новые подкатегории к объекту категории, если они отсутствуют
        subcategoryObjects.forEach((subcatObj) => {
          if (
            !existingSubcategories.some((subcat) => subcat.id === subcatObj.id)
          ) {
            existingSubcategories.push(subcatObj);
          }
        });

        // Сохраняем изменения в объекте категории
        categoryObject.subcategories = existingSubcategories;
        await this.categoryRepository.save(categoryObject);

        // Сохраняем компанию с обновленными подкатегориями
        await this.companyRepository.save(company);

        console.log('Company updated:', company);
      }

      if (company.companymetadatums === undefined) {
        const savedCompany = await this.companyRepository.save(company);

        await this.serviceService.createServices(savedCompany, services);
        if (schedule) {
          await this.companyMetadataService.saveCompanyMetadata({
            type: 'schedule',
            value: schedule,
            company: savedCompany,
          });
        }

        if (phones && phones.length > 0) {
          await this.companyMetadataService.saveCompanyMetadata({
            type: 'phones',
            value: phones,
            company: savedCompany,
          });
        }

        if (email && email.length > 0) {
          await this.companyMetadataService.saveCompanyMetadata({
            type: 'email',
            value: email,
            company: savedCompany,
          });
        }

        if (socialMediaLinks && socialMediaLinks.length > 0) {
          await this.companyMetadataService.saveCompanyMetadata({
            type: 'socialMediaLinks',
            value: socialMediaLinks,
            company: savedCompany,
          });
        }

        if (exampleWorks && exampleWorks.length > 0) {
          await this.companyMetadataService.saveCompanyMetadata({
            type: 'images',
            value: exampleWorks,
            company: savedCompany,
          });
        }

        if (googleSchedule && googleSchedule.length > 0) {
          await this.companyMetadataService.saveCompanyMetadata({
            type: 'googleSchedule',
            value: googleSchedule,
            company: savedCompany,
          });
        }
        const tags = await this.tagService.saveTags(specialTags);
        const languagesArray = await this.tagService.saveLanguages(languages);
        if (!company.tags) {
          company.tags = [];
        }
        company.tags = [...company.tags, ...tags, ...languagesArray];
        companies.push(savedCompany);
        if (!subscription) {
          company.subscription = 'None';
        }
        company.subscription = subscription;
        await this.companyRepository.save(company);
      } else {
        console.log('Обновлена только категория');
      }
    }

    return companies;
  }

  private async createCompany(
    name: string,
    description: string,
    address: string,
    source: string,
    affiliation: string,
    subscription: string,
    geoData: { latitude: number; longitude: number } | null,
  ): Promise<Company> {
    return this.companyRepository.create({
      name,
      description,
      address,
      source,
      affiliation,
      subscription,
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

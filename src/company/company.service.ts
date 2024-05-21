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
import { UpdateCompanyDto } from './dto/UpdateCompanyDto';
import Stripe from 'stripe';
import { CategoryTranslation } from '../category/entities/categoryTranslation.entity';
import { SubcategoryTranslation } from '../subcategory/entities/subcategoryTranslation.entity';
import { Subcategory } from '../subcategory/entities/subcategory.entity';

const stripe = new Stripe(
  'sk_test_51PHkSMH7KwidO226EzqE1oRuQBc1f8xkRfKfrTVyKurfBGDnwPmRwlKGruWxVKrRRe1b7yCsdHHLnULU7gW88hgU00ZKGwcsSL',
);
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
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
    private readonly subcategoryService: SubcategoryService,
    @InjectRepository(CompanyMetadatum)
    private readonly companyMetadatumRepository: Repository<CompanyMetadatum>,
    private companyMetadataService: CompanyMetadataService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(CategoryTranslation)
    private readonly categoryTranslationRepository: Repository<CategoryTranslation>,
    @InjectRepository(SubcategoryTranslation)
    private readonly subCategoryTranslationRepository: Repository<SubcategoryTranslation>,
  ) {}

  async getAllCompanies(
    options: PaginationOptionsInterface,
    languageCode: string,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    const skip = (options.page - 1) * options.perPage;

    const totalCount = await this.companyRepository.count();

    let companies = await this.companyRepository.find({
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
            Array.isArray(imageMetadata.value) &&
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

        company.subcategories = await Promise.all(
          company.subcategories.map(async (subCategory) => {
            const translation =
              await this.subCategoryTranslationRepository.findOne({
                where: {
                  subcategory: { id: subCategory.id },
                  languageCode: languageCode,
                },
              });

            if (translation) {
              return {
                ...subCategory,
                name: translation.name,
                description: translation.description,
              };
            } else {
              return subCategory;
            }
          }),
        );

        company.categories = await Promise.all(
          company.categories.map(async (category) => {
            const translation =
              await this.categoryTranslationRepository.findOne({
                where: {
                  category: { id: category.id },
                  languageCode: languageCode,
                },
              });

            if (translation) {
              return {
                ...category,
                name: translation.name,
                description: translation.description,
              };
            } else {
              return category;
            }
          }),
        );
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
    languageCode: string,
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
    query.leftJoinAndSelect('company.subcategories', 'subcategory');
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

        company.subcategories = await Promise.all(
          company.subcategories.map(async (subCategory) => {
            const translation =
              await this.subCategoryTranslationRepository.findOne({
                where: {
                  subcategory: { id: subCategory.id },
                  languageCode: languageCode,
                },
              });

            if (translation) {
              return {
                ...subCategory,
                name: translation.name,
                description: translation.description,
              };
            } else {
              return subCategory;
            }
          }),
        );

        company.categories = await Promise.all(
          company.categories.map(async (category) => {
            const translation =
              await this.categoryTranslationRepository.findOne({
                where: {
                  category: { id: category.id },
                  languageCode: languageCode,
                },
              });

            if (translation) {
              return {
                ...category,
                name: translation.name,
                description: translation.description,
              };
            } else {
              return category;
            }
          }),
        );
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

  async getCompaniesBySubCategory(
    subcategoryName: string,
    languageCode: string | undefined,
    options: PaginationOptionsInterface,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    const skip = (options.page - 1) * options.perPage;

    // Поиск подкатегории
    const subcategory = await this.subcategoryRepository.findOne({
      where: { name: subcategoryName },
    });

    if (!subcategory) {
      console.log('Subcategory not found');
      return { companies: [], totalCount: 0 };
    }

    let subCategoryId = subcategory.id;
    console.log('Found subcategory with ID:', subCategoryId);

    // Поиск перевода подкатегории, если язык указан
    if (languageCode) {
      const subcategoryTranslation =
        await this.subCategoryTranslationRepository.findOne({
          where: { subcategory: { id: subCategoryId }, languageCode },
        });

      if (subcategoryTranslation && subcategoryTranslation.subcategory) {
        console.log(
          'Found translation for subcategory with ID:',
          subCategoryId,
        );
        subCategoryId = subcategoryTranslation.subcategory.id;
      } else {
        console.log('Translation not found, using default subcategory');
      }
    }

    const query = this.companyRepository.createQueryBuilder('company');
    query.leftJoinAndSelect('company.categories', 'category');
    query.leftJoinAndSelect('company.subcategories', 'subcategory');
    query.leftJoinAndSelect('company.tags', 'tag');
    query.leftJoinAndSelect('company.companymetadatums', 'metadata');
    query.where('subcategory.id = :subCategoryId', { subCategoryId });
    query.take(options.perPage);
    query.skip(skip);

    console.log('Executing query with pagination:', options);

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

        company.subcategories = await Promise.all(
          company.subcategories.map(async (subCategory) => {
            const translation =
              await this.subCategoryTranslationRepository.findOne({
                where: {
                  subcategory: { id: subCategory.id },
                  languageCode: languageCode,
                },
              });

            if (translation) {
              return {
                ...subCategory,
                name: translation.name,
                description: translation.description,
              };
            } else {
              return subCategory;
            }
          }),
        );

        company.categories = await Promise.all(
          company.categories.map(async (category) => {
            const translation =
              await this.categoryTranslationRepository.findOne({
                where: {
                  category: { id: category.id },
                  languageCode: languageCode,
                },
              });

            if (translation) {
              return {
                ...category,
                name: translation.name,
                description: translation.description,
              };
            } else {
              return category;
            }
          }),
        );

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

    console.log('Found companies:', companies);

    return { companies, totalCount };
  }

  async getAllCompanyAddresses(): Promise<string[]> {
    // Получаем все компании из базы данных
    const companies = await this.companyRepository.find();

    // Массив для хранения адресов
    const addresses: string[] = [];

    // Проходимся по каждой компании и добавляем ее адрес в массив
    companies.forEach((company) => {
      addresses.push(company.address);
    });

    return addresses;
  }

  // async getAdressCompany(variant: string) {
  //   const companies = await this.companyRepository.find();
  // }

  async getCompaniesByCategoryAndCity(
    subcategoryName: string | null,
    city: string | null,
    tags: string[] | null,
    options: PaginationOptionsInterface,
  ) {
    const skip = (options.page - 1) * options.perPage;
    let queryBuilder = this.companyRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.subcategories', 'subcategory')
      .leftJoinAndSelect('company.tags', 'tag')
      .leftJoinAndSelect('company.companymetadatums', 'metadata');

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.where(
        'company.subscription != :subscription',
        { subscription: 'None' },
      );
    }

    if (subcategoryName) {
      queryBuilder = queryBuilder.andWhere(
        'subcategory.name = :subcategoryName',
        {
          subcategoryName,
        },
      );
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

  async findCompanyByName(
    name: string,
    languageCode: string,
  ): Promise<Company> {
    try {
      const company = await this.companyRepository.findOne({
        where: {
          name: Like(`%${name}%`),
        },
        relations: [
          'tags',
          'companymetadatums',
          'categories',
          'subcategories',
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

      company.subcategories = await Promise.all(
        company.subcategories.map(async (subCategory) => {
          const translation =
            await this.subCategoryTranslationRepository.findOne({
              where: {
                subcategory: { id: subCategory.id },
                languageCode: languageCode,
              },
            });

          if (translation) {
            return {
              ...subCategory,
              name: translation.name,
              description: translation.description,
            };
          } else {
            return subCategory;
          }
        }),
      );

      company.categories = await Promise.all(
        company.categories.map(async (category) => {
          const translation = await this.categoryTranslationRepository.findOne({
            where: {
              category: { id: category.id },
              languageCode: languageCode,
            },
          });

          if (translation) {
            return {
              ...category,
              name: translation.name,
              description: translation.description,
            };
          } else {
            return category;
          }
        }),
      );

      return company;
    } catch (e) {
      throw new Error(e.message);
    }
  }

  async findCompaniesByName(
    name: string,
    languageCode: string,
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

          company.categories = await Promise.all(
            company.categories.map(async (category) => {
              const translation =
                await this.categoryTranslationRepository.findOne({
                  where: {
                    category: { id: category.id },
                    languageCode: languageCode,
                  },
                });

              if (translation) {
                return {
                  ...category,
                  name: translation.name,
                  description: translation.description,
                };
              } else {
                return category;
              }
            }),
          );

          company.subcategories = await Promise.all(
            company.subcategories.map(async (subCategory) => {
              const translation =
                await this.subCategoryTranslationRepository.findOne({
                  where: {
                    subcategory: { id: subCategory.id },
                    languageCode: languageCode,
                  },
                });

              if (translation) {
                return {
                  ...subCategory,
                  name: translation.name,
                  description: translation.description,
                };
              } else {
                return subCategory;
              }
            }),
          );

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

  async payment() {
    // const company = await this.companyRepository.findOne({
    //   where: {
    //     id: companyId,
    //   },
    // });

    return await stripe.checkout.sessions.create({
      line_items: [{ price: 'price_1PHlaWH7KwidO226MeRPOH0R', quantity: 1 }],
      shipping_address_collection: { allowed_countries: ['BY'] },
      allow_promotion_codes: true,
      payment_method_types: ['card'],
      mode: 'subscription',
      success_url: 'http://localhost:3000' + `/success`,
      cancel_url: 'http://localhost:3000' + `/failed`,
    });
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

  async updateCompanyMetadata(
    companyId: number,
    metadata: any[],
  ): Promise<void> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['companymetadatums'],
    });
    console.log(company);
    // Если компания не найдена, выбрасываем ошибку или возвращаем null
    if (!company) {
      throw new Error('Company not found');
    }

    // Проходим по всем элементам метаданных и обновляем их
    for (const data of metadata) {
      // Проверяем, существует ли метаданные с данным типом
      const metadataToUpdate = company.companymetadatums.find(
        (meta) => meta.type === data.type,
      );

      // Если метаданные с данным типом найдены, обновляем их значение
      if (metadataToUpdate) {
        metadataToUpdate.value = data.value;
        await this.companyMetadataService.updateCompanyMetadata(
          metadataToUpdate,
        );
      }
    }
  }

  async updateService(
    companiesId: number,
    serviceId: number,
    newData: Partial<Service>,
  ): Promise<Service> {
    const company = await this.companyRepository.findOne({
      where: { id: companiesId },
      relations: ['services'],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const service = company.services.find((s) => s.id === Number(serviceId));
    if (!service) {
      throw new NotFoundException('Service not found in company');
    }

    return this.serviceService.updateService(serviceId, newData);
  }

  async addSubService(
    companyId: number,
    serviceId: number,
    subServiceData: Partial<Service>,
  ): Promise<Service> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['services'],
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const service = company.services.find((s) => s.id === Number(serviceId));
    if (!service) {
      throw new NotFoundException('Service not found in company');
    }

    return this.serviceService.addSubService(
      serviceId,
      companyId,
      subServiceData,
    );
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

  async updateCompany(data: UpdateCompanyDto): Promise<Company> {
    const { id, category, subcategories, tags, ...updateData } = data;
    let company = await this.companyRepository.findOne({
      where: { id },
      relations: ['categories', 'subcategories', 'tags'],
    });

    if (!company) {
      throw new Error(`Company with ID ${id} not found`);
    }

    Object.assign(company, updateData);

    let categoryObject: Category | undefined;

    if (category) {
      const existingCategory =
        await this.categoryService.getCategoryByName(category);

      if (!existingCategory) {
        categoryObject = await this.categoryService.createCategory(
          category,
          category,
        );
      } else {
        categoryObject = existingCategory;
      }

      company.categories = [categoryObject];
    }

    if (
      subcategories &&
      Array.isArray(subcategories) &&
      subcategories.length > 0
    ) {
      const subcategoryObjects = await Promise.all(
        subcategories.map(async (subcategoryName) => {
          const existingSubcategory =
            await this.subcategoryService.getSubcategoryByName(subcategoryName);
          if (existingSubcategory) {
            return existingSubcategory;
          } else {
            return await this.subcategoryService.createSubcategory(
              subcategoryName,
            );
          }
        }),
      );

      company.subcategories = subcategoryObjects;

      if (category && categoryObject) {
        if (!categoryObject.subcategories) {
          categoryObject.subcategories = [];
        }
        categoryObject.subcategories.push(...subcategoryObjects);
        await this.categoryRepository.save(categoryObject);
      }
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      const tagObjects = await Promise.all(
        tags.map(async (tagName) => {
          const existingTag = await this.tagService.getTagByName(tagName);
          if (existingTag) {
            return existingTag;
          } else {
            return await this.tagService.createTag(tagName);
          }
        }),
      );

      company.tags = tagObjects;
    }

    company = await this.companyRepository.save(company);

    return company;
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

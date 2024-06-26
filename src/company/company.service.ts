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
import { TagTranslation } from '../tag/entities/tagTranslation.entity';
import { ServiceTranslation } from '../service/entities/serviceTranslation.entity';
import axios from 'axios';
import { CreateServiceTranslationDto } from '../service/dto/CreateServiceTranslationDto';
import { DeleteServiceTranslationDto } from '../service/dto/DeleteServiceTranslationDto';
import { UpdateServiceTranslationDto } from '../service/dto/UpdateServiceTranslationDto';
import * as TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as process from 'node:process';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const stripe = new Stripe(process.env.STRIPE_KEY);
const token = process.env.TG_BOT;
@Injectable()
export class CompanyService {
  private bot: TelegramBot;
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
    @InjectRepository(TagTranslation)
    private readonly tagTranslationRepository: Repository<TagTranslation>,
    @InjectRepository(ServiceTranslation)
    private serviceTranslationRepository: Repository<ServiceTranslation>,
  ) {
    this.bot = new TelegramBot(token, { polling: true });

    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(
        chatId,
        'Привет! Это бот yooHiveBot для оповещения о поступлении регистрации.',
      );
    });
  }

  private async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto',
  ): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${sourceLanguage}&tl=${targetLanguage}&q=${encodeURIComponent(text)}`;

    try {
      const response = await axios.get(url);
      if (response.data && Array.isArray(response.data[0])) {
        const translations = response.data[0];
        const translatedText = translations.map((t: any) => t[0]).join('');
        return translatedText;
      } else {
        console.error('Unexpected response structure:', response.data);
        return text;
      }
    } catch (error) {
      console.error('Error translating text:', error);
      return text;
    }
  }

  async sendMessageToChannel(data: any[]) {
    try {
      for (const item of data) {
        const name = item.name;
        const phone = item.phones;
        const email = item.email;
        const text = `Nowa firma:\nNazwa: ${name}\nTelefon: ${phone}\nE-mail: ${email}`;

        await this.bot.sendMessage('-1002211989027', text);
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

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

        const translateEntity = async (
          entity,
          translationRepository,
          idField,
          languageCode,
        ) => {
          const translation = await translationRepository.findOne({
            where: {
              [idField]: { id: entity.id },
              languageCode: languageCode,
            },
          });

          if (translation) {
            return {
              ...entity,
              name: translation.name,
              description: translation.description,
            };
          } else {
            const translatedName = await this.translateText(
              entity.name,
              languageCode,
            );
            const translatedDescription = entity.description
              ? await this.translateText(entity.description, languageCode)
              : '';

            return {
              ...entity,
              name: translatedName,
              description: translatedDescription,
            };
          }
        };
        company.companymetadatums = company.companymetadatums.filter(
          (metadata) => metadata.type === 'images',
        );

        company.subcategories = company.subcategories
          ? await Promise.all(
              company.subcategories.map(async (subCategory) => {
                return translateEntity(
                  subCategory,
                  this.subCategoryTranslationRepository,
                  'subcategory',
                  languageCode,
                );
              }),
            )
          : [];

        company.categories = company.categories
          ? await Promise.all(
              company.categories.map(async (category) => {
                return translateEntity(
                  category,
                  this.categoryTranslationRepository,
                  'category',
                  languageCode,
                );
              }),
            )
          : [];

        company.tags = company.tags
          ? await Promise.all(
              company.tags.map(async (tag) => {
                return translateEntity(
                  tag,
                  this.tagTranslationRepository,
                  'tag',
                  languageCode,
                );
              }),
            )
          : [];

        company.services = await this.serviceRepository.find({
          where: { companies: { id: company.id } },
          take: 3,
        });

        company.services = company.services
          ? await Promise.all(
              company.services.map(async (service) => {
                service = await translateEntity(
                  service,
                  this.serviceTranslationRepository,
                  'service',
                  languageCode,
                );

                service.subServices = service.subServices
                  ? await Promise.all(
                      service.subServices.map(async (subService) => {
                        return translateEntity(
                          subService,
                          this.serviceTranslationRepository,
                          'service',
                          languageCode,
                        );
                      }),
                    )
                  : [];

                return service;
              }),
            )
          : [];

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

        const translateEntity = async (
          entity,
          translationRepository,
          idField,
          languageCode,
        ) => {
          const translation = await translationRepository.findOne({
            where: {
              [idField]: { id: entity.id },
              languageCode: languageCode,
            },
          });

          if (translation) {
            return {
              ...entity,
              name: translation.name,
              description: translation.description,
            };
          } else {
            const translatedName = await this.translateText(
              entity.name,
              languageCode,
            );
            const translatedDescription = entity.description
              ? await this.translateText(entity.description, languageCode)
              : '';

            return {
              ...entity,
              name: translatedName,
              description: translatedDescription,
            };
          }
        };
        company.companymetadatums = company.companymetadatums.filter(
          (metadata) => metadata.type === 'images',
        );

        company.subcategories = company.subcategories
          ? await Promise.all(
              company.subcategories.map(async (subCategory) => {
                return translateEntity(
                  subCategory,
                  this.subCategoryTranslationRepository,
                  'subcategory',
                  languageCode,
                );
              }),
            )
          : [];

        company.categories = company.categories
          ? await Promise.all(
              company.categories.map(async (category) => {
                return translateEntity(
                  category,
                  this.categoryTranslationRepository,
                  'category',
                  languageCode,
                );
              }),
            )
          : [];

        company.tags = company.tags
          ? await Promise.all(
              company.tags.map(async (tag) => {
                return translateEntity(
                  tag,
                  this.tagTranslationRepository,
                  'tag',
                  languageCode,
                );
              }),
            )
          : [];

        company.services = await this.serviceRepository.find({
          where: { companies: { id: company.id } },
          take: 3,
        });

        company.services = company.services
          ? await Promise.all(
              company.services.map(async (service) => {
                service = await translateEntity(
                  service,
                  this.serviceTranslationRepository,
                  'service',
                  languageCode,
                );

                service.subServices = service.subServices
                  ? await Promise.all(
                      service.subServices.map(async (subService) => {
                        return translateEntity(
                          subService,
                          this.serviceTranslationRepository,
                          'service',
                          languageCode,
                        );
                      }),
                    )
                  : [];

                return service;
              }),
            )
          : [];

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

    const subcategory = await this.subcategoryRepository.findOne({
      where: { name: subcategoryName },
    });

    if (!subcategory) {
      console.log('Subcategory not found');
      return { companies: [], totalCount: 0 };
    }

    let subCategoryId = subcategory.id;
    console.log('Found subcategory with ID:', subCategoryId);

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
          const imageMetadata = company.companymetadatums?.find(
            (metadata: CompanyMetadatum) => metadata.type === 'images',
          );

          company.companymetadatums = company.companymetadatums?.filter(
            (metadata: CompanyMetadatum) =>
              metadata.type !== 'socialMediaLinks',
          );

          company.tags = company.tags?.filter(
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
            company.companymetadatums?.forEach((metadata: CompanyMetadatum) => {
              if (metadata.type === 'images') {
                metadata.value = [firstImage];
              }
            });
          }
        }

        company.companymetadatums = company.companymetadatums?.filter(
          (metadata) => metadata.type === 'images',
        );

        const translateEntity = async (
          entity,
          translationRepository,
          idField,
          languageCode,
        ) => {
          const translation = await translationRepository.findOne({
            where: {
              [idField]: { id: entity.id },
              languageCode: languageCode,
            },
          });

          if (translation) {
            return {
              ...entity,
              name: translation.name,
              description: translation.description,
            };
          } else {
            const translatedName = await this.translateText(
              entity.name,
              languageCode,
            );
            const translatedDescription = entity.description
              ? await this.translateText(entity.description, languageCode)
              : '';

            return {
              ...entity,
              name: translatedName,
              description: translatedDescription,
            };
          }
        };

        company.subcategories = company.subcategories
          ? await Promise.all(
              company.subcategories.map(async (subCategory) => {
                return translateEntity(
                  subCategory,
                  this.subCategoryTranslationRepository,
                  'subcategory',
                  languageCode,
                );
              }),
            )
          : [];

        company.categories = company.categories
          ? await Promise.all(
              company.categories.map(async (category) => {
                return translateEntity(
                  category,
                  this.categoryTranslationRepository,
                  'category',
                  languageCode,
                );
              }),
            )
          : [];

        company.tags = company.tags
          ? await Promise.all(
              company.tags.map(async (tag) => {
                return translateEntity(
                  tag,
                  this.tagTranslationRepository,
                  'tag',
                  languageCode,
                );
              }),
            )
          : [];

        company.services = await this.serviceRepository.find({
          where: { companies: { id: company.id } },
          take: 3,
        });

        company.services = company.services
          ? await Promise.all(
              company.services.map(async (service) => {
                service = await translateEntity(
                  service,
                  this.serviceTranslationRepository,
                  'service',
                  languageCode,
                );

                service.subServices = service.subServices
                  ? await Promise.all(
                      service.subServices.map(async (subService) => {
                        return translateEntity(
                          subService,
                          this.serviceTranslationRepository,
                          'service',
                          languageCode,
                        );
                      }),
                    )
                  : [];

                return service;
              }),
            )
          : [];

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

  // async getAddressCompany(variant: string) {
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
          'services.subServices',
        ],
      });

      if (!company) {
        throw new Error('Company not found');
      }

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

      const translateEntity = async (
        entity,
        translationRepository,
        idField,
        languageCode,
      ) => {
        const translation = await translationRepository.findOne({
          where: {
            [idField]: { id: entity.id },
            languageCode: languageCode,
          },
        });

        if (translation) {
          return {
            ...entity,
            name: translation.name,
            description: translation.description,
          };
        } else {
          // Используем Google Translate API для перевода
          const translatedName = await this.translateText(
            entity.name,
            languageCode,
          );
          const translatedDescription = entity.description
            ? await this.translateText(entity.description, languageCode)
            : '';

          return {
            ...entity,
            name: translatedName,
            description: translatedDescription,
          };
        }
      };

      company.subcategories = await Promise.all(
        company.subcategories.map(async (subCategory) => {
          return translateEntity(
            subCategory,
            this.subCategoryTranslationRepository,
            'subcategory',
            languageCode,
          );
        }),
      );

      company.tags = company.tags
        ? await Promise.all(
            company.tags.map(async (tag) => {
              return translateEntity(
                tag,
                this.tagTranslationRepository,
                'tag',
                languageCode,
              );
            }),
          )
        : [];

      company.categories = await Promise.all(
        company.categories.map(async (category) => {
          return translateEntity(
            category,
            this.categoryTranslationRepository,
            'category',
            languageCode,
          );
        }),
      );

      company.services = await Promise.all(
        company.services.map(async (service) => {
          service = await translateEntity(
            service,
            this.serviceTranslationRepository,
            'service',
            languageCode,
          );

          service.subServices = await Promise.all(
            service.subServices.map(async (subService) => {
              return translateEntity(
                subService,
                this.serviceTranslationRepository,
                'service',
                languageCode,
              );
            }),
          );

          return service;
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

          const translateEntity = async (
            entity,
            translationRepository,
            idField,
            languageCode,
          ) => {
            const translation = await translationRepository.findOne({
              where: {
                [idField]: { id: entity.id },
                languageCode: languageCode,
              },
            });

            if (translation) {
              return {
                ...entity,
                name: translation.name,
                description: translation.description,
              };
            } else {
              const translatedName = await this.translateText(
                entity.name,
                languageCode,
              );
              const translatedDescription = entity.description
                ? await this.translateText(entity.description, languageCode)
                : '';

              return {
                ...entity,
                name: translatedName,
                description: translatedDescription,
              };
            }
          };
          company.companymetadatums = company.companymetadatums.filter(
            (metadata) => metadata.type === 'images',
          );

          company.subcategories = company.subcategories
            ? await Promise.all(
                company.subcategories.map(async (subCategory) => {
                  return translateEntity(
                    subCategory,
                    this.subCategoryTranslationRepository,
                    'subcategory',
                    languageCode,
                  );
                }),
              )
            : [];

          company.categories = company.categories
            ? await Promise.all(
                company.categories.map(async (category) => {
                  return translateEntity(
                    category,
                    this.categoryTranslationRepository,
                    'category',
                    languageCode,
                  );
                }),
              )
            : [];

          company.tags = company.tags
            ? await Promise.all(
                company.tags.map(async (tag) => {
                  return translateEntity(
                    tag,
                    this.tagTranslationRepository,
                    'tag',
                    languageCode,
                  );
                }),
              )
            : [];

          company.services = await this.serviceRepository.find({
            where: { companies: { id: company.id } },
            take: 3,
          });

          company.services = company.services
            ? await Promise.all(
                company.services.map(async (service) => {
                  service = await translateEntity(
                    service,
                    this.serviceTranslationRepository,
                    'service',
                    languageCode,
                  );

                  service.subServices = service.subServices
                    ? await Promise.all(
                        service.subServices.map(async (subService) => {
                          return translateEntity(
                            subService,
                            this.serviceTranslationRepository,
                            'service',
                            languageCode,
                          );
                        }),
                      )
                    : [];

                  return service;
                }),
              )
            : [];

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

        subcategoryObjects.forEach((subcatObj) => {
          if (
            !existingSubcategories.some((subcat) => subcat.id === subcatObj.id)
          ) {
            existingSubcategories.push(subcatObj);
          }
        });

        categoryObject.subcategories = existingSubcategories;
        await this.categoryRepository.save(categoryObject);

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

  async updateCompanyMetadata(
    companyId: number,
    metadata: any[],
  ): Promise<void> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      relations: ['companymetadatums'],
    });
    console.log(company);
    if (!company) {
      throw new Error('Company not found');
    }

    for (const data of metadata) {
      const metadataToUpdate = company.companymetadatums.find(
        (meta) => meta.type === data.type,
      );

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

  async addServiceTranslation(
    createServiceTranslationDto: CreateServiceTranslationDto,
  ) {
    const { serviceId, languageCode, name, description } =
      createServiceTranslationDto;

    // Проверяем, существует ли уже перевод для данной услуги и языка
    let serviceTranslation = await this.serviceTranslationRepository.findOne({
      where: {
        serviceId,
        languageCode,
      },
    });

    if (serviceTranslation) {
      // Обновляем существующий перевод
      serviceTranslation.name = name;
      serviceTranslation.description = description;
    } else {
      // Создаем новый перевод
      serviceTranslation = this.serviceTranslationRepository.create({
        serviceId,
        languageCode,
        name,
        description,
      });
    }

    return await this.serviceTranslationRepository.save(serviceTranslation);
  }

  async updateServiceTranslation(
    updateServiceTranslationDto: UpdateServiceTranslationDto,
  ) {
    const { serviceId, languageCode, name, description } =
      updateServiceTranslationDto;

    const serviceTranslation = await this.serviceTranslationRepository.findOne({
      where: { serviceId, languageCode },
    });

    if (!serviceTranslation) {
      throw new NotFoundException('Service translation not found');
    }

    if (name) {
      serviceTranslation.name = name;
    }
    if (description) {
      serviceTranslation.description = description;
    }

    return await this.serviceTranslationRepository.save(serviceTranslation);
  }

  async deleteServiceTranslation(
    deleteServiceTranslationDto: DeleteServiceTranslationDto,
  ) {
    const { serviceId, languageCode } = deleteServiceTranslationDto;

    const serviceTranslation = await this.serviceTranslationRepository.findOne({
      where: { serviceId, languageCode },
    });

    if (!serviceTranslation) {
      throw new NotFoundException('Service translation not found');
    }

    return await this.serviceTranslationRepository.remove(serviceTranslation);
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
}

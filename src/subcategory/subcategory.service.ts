import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Subcategory } from './entities/subcategory.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SubcategoryService {
  constructor(
    @InjectRepository(Subcategory)
    private readonly subcategoryRepository: Repository<Subcategory>,
  ) {}

  async getSubcategoryByName(name: string): Promise<Subcategory | undefined> {
    return this.subcategoryRepository.findOne({ where: { name } });
  }

  async createSubcategory(name: string): Promise<Subcategory> {
    const subcategory = this.subcategoryRepository.create({ name });
    return this.subcategoryRepository.save(subcategory);
  }

  async getAllSubcategories(): Promise<Subcategory[]> {
    return this.subcategoryRepository.find();
  }

  async findAllTranslatedSubCategory(languageCode: string): Promise<any[]> {
    const categories = await this.subcategoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.translations', 'translation')
      .where('translation.languageCode = :languageCode', { languageCode })
      .getMany();

    return categories.map((category) => ({
      id: category.id,
      name:
        category.translations.find((t) => t.languageCode === languageCode)
          ?.name || category.name,
      slug: category.slug,
    }));
  }

  async findSubcategoryWithTranslation(id: number, languageCode: string) {
    const subcategory = await this.subcategoryRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!subcategory) {
      return null;
    }

    const translation = subcategory.translations.find(
      (t) => t.languageCode === languageCode,
    );

    return {
      ...subcategory,
      name: translation ? translation.name : null,
      slug: translation ? translation.slug : null,
    };
  }
}

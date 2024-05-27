import { Injectable } from '@nestjs/common';
import { Category } from './entities/category.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags } from '@nestjs/swagger';

@Injectable()
@ApiTags('categories')
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async createCategory(name: string, slug: string): Promise<Category> {
    const category = this.categoryRepository.create({ name, slug });
    return await this.categoryRepository.save(category);
  }

  async updateCategory(id: number, name: string): Promise<Category> {
    const categoryToUpdate = await this.categoryRepository.findOne({
      where: { id },
    });

    if (!categoryToUpdate) {
      throw new Error(`Category with id ${id} not found`);
    }

    categoryToUpdate.name = name;
    categoryToUpdate.slug = name;

    return await this.categoryRepository.save(categoryToUpdate);
  }

  async removeCategory(id: number): Promise<Category> {
    const categoryToRemove = await this.categoryRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!categoryToRemove) {
      throw new Error(`Category with id ${id} not found`);
    }
    return this.categoryRepository.remove(categoryToRemove);
  }

  async getAllCategories(languageCode: string): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      relations: ['subcategories', 'translations'],
    });
    return categories.map((category) => {
      const translation = category.translations.find(
        (t) => t.languageCode === languageCode,
      );
      return {
        ...category,
        name: translation ? translation.name : category.name,
        description: translation ? translation.description : null,
      };
    });
  }

  async getCategoryByName(name: string, languageCode?: string): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { name },
      relations: ['subcategories', 'translations'],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    const translation = category.translations.find(
      (t) => t.languageCode === languageCode,
    );
    return {
      ...category,
      name: translation ? translation.name : category.name,
      description: translation ? translation.description : null,
    };
  }

  async getSubcategoryNamesByCategoryName(
    name: string,
    languageCode: string,
  ): Promise<{ name: string; slug: string | null }[]> {
    // Поиск категории с подкатегориями и переводами
    const category = await this.categoryRepository.findOne({
      where: { name },
      relations: ['subcategories', 'subcategories.translations'],
    });

    // Если категория не найдена, выбрасываем ошибку
    if (!category) {
      throw new Error('Category not found');
    }

    // Логируем найденную категорию и её подкатегории
    console.log('Category found:', category);

    // Преобразуем подкатегории, чтобы получить их имена с переводом и slug
    const subcategories = category.subcategories.map((subcategory) => {
      const translation = subcategory.translations.find(
        (t) => t.languageCode === languageCode,
      );
      console.log('Subcategory:', subcategory);
      console.log('Translation:', translation);

      // Если перевод найден, возвращаем имя перевода, иначе - оригинальное имя
      return {
        name: translation ? translation.name : subcategory.name,
        slug: subcategory.slug,
      };
    });

    // Логируем результат
    console.log('Subcategory names and slugs:', subcategories);

    return subcategories;
  }

  async findAllTranslatedCategory(languageCode: string): Promise<any[]> {
    const categories = await this.categoryRepository
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
      subcategories: category.subcategories,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async findCategoryWithTranslation(
    id: number,
    languageCode: string,
  ): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['translations'],
    });

    if (!category) {
      return null;
    }

    const translation = category.translations.find(
      (t) => t.languageCode === languageCode,
    );
    return {
      ...category,
      name: translation ? translation.name : category.name,
      description: translation ? translation.description : null,
    };
  }
}

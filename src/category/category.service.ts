import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getAllCategories(): Promise<Category[]> {
    return await this.categoryRepository.find();
  }

  // async getCategoryBySlug(slug: string): Promise<Category> {
  //   const category = await this.categoryRepository.findOne({ where: { slug } });
  //   if (!category) {
  //     throw new NotFoundException('Category not found');
  //   }
  //   return category;
  // }

  async getCategoriesBySlug(slug: string): Promise<Category[]> {
    const categories = await this.categoryRepository.find({ where: { slug } });
    if (categories.length === 0) {
      throw new NotFoundException('No categories found with the provided slug');
    }
    return categories;
  }

  async getCategoryByName(name: string): Promise<Category> {
    return await this.categoryRepository.findOne({ where: { name } });
  }
}

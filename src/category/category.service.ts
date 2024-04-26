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
    return await this.categoryRepository.find({ relations: ['subcategories'] });
  }

  async getCategoryByName(name: string): Promise<Category> {
    return await this.categoryRepository.findOne({
      where: { name },
      relations: ['subcategories'],
    });
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
}

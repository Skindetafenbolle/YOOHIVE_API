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
}

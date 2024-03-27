import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';
import { ApiTags } from '@nestjs/swagger';

@Controller('category')
@ApiTags('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const { name, slug } = createCategoryDto;
    return this.categoryService.createCategory(name, slug);
  }

  @Delete(':id')
  async removeCategory(@Param('id') id: number) {
    try {
      const deletedCategory = await this.categoryService.removeCategory(id);
      return {
        message: 'Category deleted successfully',
        category: deletedCategory,
      };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  @Get('/all')
  async getAllCategories(): Promise<Category[]> {
    return await this.categoryService.getAllCategories();
  }

  @Get(':slug')
  async getCategoryBySlug(@Param('slug') slug: string): Promise<Category[]> {
    return await this.categoryService.getCategoriesBySlug(slug);
  }
}

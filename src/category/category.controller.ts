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
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller('category')
@ApiTags('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CreateCategoryDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    const { name, slug } = createCategoryDto;
    return this.categoryService.createCategory(name, slug);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'The ID of the category to delete' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
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
  @ApiResponse({
    status: 200,
    description: 'All categories retrieved successfully',
    type: [CreateCategoryDto],
  })
  async getAllCategories(): Promise<Category[]> {
    return await this.categoryService.getAllCategories();
  }
}

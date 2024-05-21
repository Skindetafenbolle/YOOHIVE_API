import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  NotFoundException,
  Post,
  Put,
  SetMetadata,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

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
  @ApiResponse({ status: 404, description: 'Category not found' })
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

  @Put('/edit/:id')
  @ApiParam({ name: 'id', description: 'The ID of the category to update' })
  @ApiBody({ description: 'The new name of the category', type: String })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['superAdmin'])
  async updateCategory(
    @Param('id') id: number,
    @Body('name') name: string,
  ): Promise<Category> {
    try {
      return await this.categoryService.updateCategory(id, name);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get('/translate/:languageCode')
  @ApiParam({
    name: 'languageCode',
    description: 'The language code for translation',
  })
  @ApiResponse({
    status: 200,
    description: 'All translated categories retrieved successfully',
    type: [CreateCategoryDto],
  })
  async findAllTranslatedCategory(@Param('languageCode') languageCode: string) {
    return await this.categoryService.findAllTranslatedCategory(languageCode);
  }

  @Get('/all')
  @ApiResponse({
    status: 200,
    description: 'All categories retrieved successfully',
    type: [CreateCategoryDto],
  })
  async getAllCategories(@Query('lang') lang: string) {
    return this.categoryService.getAllCategories(lang);
  }

  @Get('/:name')
  @ApiParam({ name: 'name', description: 'The name of the category' })
  @ApiResponse({
    status: 200,
    description: 'Category retrieved successfully',
    type: [CreateCategoryDto],
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getCategoryByName(
    @Param('name') name: string,
    @Query('lang') lang: string,
  ) {
    return this.categoryService.getCategoryByName(name, lang);
  }

  @Get('/trans/:id')
  @ApiParam({ name: 'id', description: 'The ID of the category' })
  @ApiResponse({
    status: 200,
    description: 'Category with translations retrieved successfully',
    type: CreateCategoryDto,
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Param('id') id: number, @Query('lang') lang: string) {
    return this.categoryService.findCategoryWithTranslation(id, lang);
  }

  @Get('sub/:name')
  @ApiParam({ name: 'name', description: 'The name of the category' })
  @ApiResponse({
    status: 200,
    description: 'Subcategories retrieved successfully',
    type: [CreateCategoryDto],
  })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async getSubcategoryNamesByCategoryName(
    @Param('name') name: string,
    @Query('lang') lang: string,
  ) {
    return this.categoryService.getSubcategoryNamesByCategoryName(name, lang);
  }
}

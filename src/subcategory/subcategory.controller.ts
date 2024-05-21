import { Controller, Get, Param, Query } from '@nestjs/common';
import { SubcategoryService } from './subcategory.service';

@Controller('subcategory')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @Get('subcategories')
  async getSubcategory() {
    return this.subcategoryService.getAllSubcategories();
  }

  @Get('/translate/:languageCode')
  async findAllTranslatedCategory(@Param('languageCode') languageCode: string) {
    return await this.subcategoryService.findAllTranslatedSubCategory(
      languageCode,
    );
  }

  @Get('/trans/:id')
  async findOne(@Param('id') id: number, @Query('lang') lang: string) {
    return this.subcategoryService.findSubcategoryWithTranslation(id, lang);
  }
}

import { Controller, Get } from '@nestjs/common';
import { SubcategoryService } from './subcategory.service';

@Controller('subcategory')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}

  @Get('subcategories')
  async getSubcategory() {
    return this.subcategoryService.getAllSubcategorys();
  }
}

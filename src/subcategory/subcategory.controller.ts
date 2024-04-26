import { Controller } from '@nestjs/common';
import { SubcategoryService } from './subcategory.service';

@Controller('subcategory')
export class SubcategoryController {
  constructor(private readonly subcategoryService: SubcategoryService) {}
}

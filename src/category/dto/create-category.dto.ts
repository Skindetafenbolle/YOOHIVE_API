import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Category Name',
    description: 'The name of the category',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'category-name',
    description: 'The slug of the category',
  })
  @IsNotEmpty()
  slug: string;
}

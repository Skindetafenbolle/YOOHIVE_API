import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Company Name',
    description: 'The name of the company',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Description of the company',
    description: 'The description of the company',
    required: false,
  })
  @IsOptional()
  description: string;

  @ApiProperty({
    example: 'Company Address',
    description: 'The address of the company',
  })
  @IsNotEmpty()
  address: string;

  @ApiProperty({
    example: 'Source of the company',
    description: 'The source of the company',
    required: false,
  })
  @IsOptional()
  source: string;

  @ApiProperty({
    example: 'Affiliation of the company',
    description: 'The affiliation of the company',
    required: false,
  })
  @IsOptional()
  affiliation: string;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'An array of category IDs associated with the company',
    required: false,
  })
  @IsOptional()
  categoryIds: number[];

  @ApiProperty({
    example: [4, 5, 6],
    description: 'An array of tag IDs associated with the company',
    required: false,
  })
  @IsOptional()
  tagIds: number[];
}

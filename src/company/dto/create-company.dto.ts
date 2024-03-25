import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsNotEmpty()
  name: string;

  @IsOptional()
  description: string;

  @IsNotEmpty()
  address: string;

  @IsOptional()
  source: string;

  @IsOptional()
  affiliation: string;

  @IsOptional()
  categoryIds: number[];

  @IsOptional()
  tagIds: number[];
}

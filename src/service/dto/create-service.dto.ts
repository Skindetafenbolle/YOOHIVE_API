import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Service Name',
    description: 'The name of the service',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 100, description: 'The price of the service' })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({ example: 'USD', description: 'The currency of the service' })
  @IsNotEmpty()
  @IsString()
  currency: string;

  @ApiProperty({
    example: 60,
    description: 'The duration of the service in minutes',
  })
  @IsNotEmpty()
  @IsNumber()
  duration_minutes: number;

  @ApiProperty({
    example: true,
    description: 'Flag indicating if the service is main',
  })
  @IsOptional()
  @IsBoolean()
  isMain?: boolean;

  @ApiProperty({
    example: 'Description of the service',
    description: 'The description of the service',
    required: false,
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: 1,
    description: 'The ID of the parent service',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  parentId?: number;
}

import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTagDto {
  @ApiProperty({ example: 'Tag Name', description: 'The name of the tag' })
  @IsNotEmpty()
  name: string;
}

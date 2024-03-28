import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyMetadatumDto {
  @ApiProperty({ example: 'type', description: 'The type of the metadatum' })
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    example: { key: 'value' },
    description: 'The value of the metadatum',
  })
  @IsNotEmpty()
  value: object;
}

import { ApiProperty } from '@nestjs/swagger';

export class UpdateServiceTranslationDto {
  @ApiProperty({ example: 9, description: 'ID of the service' })
  serviceId: number;

  @ApiProperty({
    example: 'ru',
    description: 'Language code for the translation',
  })
  languageCode: string;

  @ApiProperty({
    example: 'новое имя услуги',
    description: 'Name of the service translation',
  })
  name?: string;

  @ApiProperty({
    example: 'новое описание услуги',
    description: 'Description of the service translation',
  })
  description?: string;
}

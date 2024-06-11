import { ApiProperty } from '@nestjs/swagger';

export class DeleteServiceTranslationDto {
  @ApiProperty({ example: 9, description: 'ID of the service' })
  serviceId: number;

  @ApiProperty({
    example: 'ru',
    description: 'Language code for the translation',
  })
  languageCode: string;
}

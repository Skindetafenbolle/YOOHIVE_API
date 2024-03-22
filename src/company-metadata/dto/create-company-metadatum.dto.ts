import { IsNotEmpty } from 'class-validator';

export class CreateCompanyMetadatumDto {
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  value: object;
}

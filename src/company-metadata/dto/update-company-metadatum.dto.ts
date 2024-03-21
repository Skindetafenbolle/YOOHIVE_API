import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyMetadatumDto } from './create-company-metadatum.dto';

export class UpdateCompanyMetadatumDto extends PartialType(CreateCompanyMetadatumDto) {}

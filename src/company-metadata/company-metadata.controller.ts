import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CompanyMetadataService } from './company-metadata.service';
import { CreateCompanyMetadatumDto } from './dto/create-company-metadatum.dto';
import { UpdateCompanyMetadatumDto } from './dto/update-company-metadatum.dto';

@Controller('company-metadata')
export class CompanyMetadataController {
  constructor(
    private readonly companyMetadataService: CompanyMetadataService,
  ) {}

  @Post()
  create(@Body() createCompanyMetadatumDto: CreateCompanyMetadatumDto) {
    return this.companyMetadataService.create(createCompanyMetadatumDto);
  }

  @Get()
  findAll() {
    return this.companyMetadataService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companyMetadataService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCompanyMetadatumDto: UpdateCompanyMetadatumDto,
  ) {
    return this.companyMetadataService.update(+id, updateCompanyMetadatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.companyMetadataService.remove(+id);
  }
}

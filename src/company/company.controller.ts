import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  // @Post()
  // async createCompany(@Body() body: any): Promise<Company> {
  //   const {
  //     name,
  //     description,
  //     address,
  //     source,
  //     affiliation,
  //     tagIds,
  //     categoryIds,
  //   } = body;
  //   return this.companyService.createCompany(
  //     name,
  //     description,
  //     address,
  //     source,
  //     affiliation,
  //     tagIds,
  //     categoryIds,
  //   );
  // }

  @Post(':id/metadatum')
  async addCompanyMetadatum(
    @Param('id') companyId: number,
    @Body() body: any,
  ): Promise<CompanyMetadatum> {
    const { type, value } = body;
    return this.companyService.addCompanyMetadatum(companyId, type, value);
  }

  @Get('/get/all')
  async getAllCompany(): Promise<Company[]> {
    return await this.companyService.getAllCompanies();
  }

  @Get(':id')
  async getCompanyWithRelations(
    @Param('id') companyId: number,
  ): Promise<Company> {
    return this.companyService.getCompanyWithRelations(companyId);
  }

  @Post(':companyId/users/:userId')
  async addUserToCompany(
    @Param('companyId') companyId: number,
    @Param('userId') userId: number,
  ): Promise<Company> {
    return this.companyService.addUserToCompany(userId, companyId);
  }

  @Delete('remove/:id')
  async removeCompany(@Param('id') id: number): Promise<Company> {
    return this.companyService.removeCompany(id);
  }

  @Delete(':companyId/users/:userId')
  async removeUserFromCompany(
    @Param('companyId') companyId: number,
    @Param('userId') userId: number,
  ): Promise<Company> {
    return this.companyService.removeUserFromCompany(companyId, userId);
  }

  @Post('/createCompany/:source/:category')
  async createCompanyFromParser(
    @Body() data: any,
    @Param('source') source: string,
    @Param('category') category: string,
  ): Promise<Company> {
    return await this.companyService.createCompanyFromParser(
      data,
      source,
      category,
    );
  }
}

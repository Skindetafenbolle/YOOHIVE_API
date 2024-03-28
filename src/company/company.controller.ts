import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';
import { ApiTags } from '@nestjs/swagger';
import { PaginationOptionsInterface } from './dto/PaginationOptionsInterface';

@Controller('company')
@ApiTags('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post(':id/metadatum')
  async addCompanyMetadatum(
    @Param('id') companyId: number,
    @Body() body: any,
  ): Promise<CompanyMetadatum> {
    const { type, value } = body;
    return this.companyService.addCompanyMetadatum(companyId, type, value);
  }

  @Get('/getAll/:page/:perPage')
  async getAllCompany(
    @Param('page') page: number = 1,
    @Param('perPage') perPage: number = 10,
  ): Promise<Company[]> {
    const options: PaginationOptionsInterface = {
      page: page,
      perPage: perPage,
    };

    return await this.companyService.getAllCompanies(options);
  }

  @Get('id/:id')
  async getCompanyById(@Param('id') companyId: number): Promise<Company> {
    return this.companyService.getCompanyById(companyId);
  }

  @Get('/name/:name')
  async getCompanyByName(@Param('name') name: string): Promise<Company> {
    return this.companyService.findCompanyByName(name);
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
  ): Promise<Company[]> {
    return await this.companyService.createCompanyFromParser(
      data,
      source,
      category,
    );
  }
}

import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';
import { ApiBody, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PaginationOptionsInterface } from './dto/PaginationOptionsInterface';
import { CreateCompanyMetadatumDto } from '../company-metadata/dto/create-company-metadatum.dto';
import { CreateCompanyDto } from './dto/create-company.dto';

@Controller('company')
@ApiTags('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Post(':id/metadatum')
  @ApiParam({ name: 'id', description: 'The ID of the company' })
  @ApiBody({
    description: 'Metadatum details',
    type: CreateCompanyMetadatumDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The created metadatum',
    type: CreateCompanyMetadatumDto,
  })
  async addCompanyMetadatum(
    @Param('id') companyId: number,
    @Body() body: CreateCompanyMetadatumDto,
  ): Promise<CompanyMetadatum> {
    const { type, value } = body;
    return this.companyService.addCompanyMetadatum(companyId, type, value);
  }

  @Get('/getAll/:page/:perPage')
  async getAllCompany(
    @Param('page') page: number = 1,
    @Param('perPage') perPage: number = 10,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    const options: PaginationOptionsInterface = {
      page: page,
      perPage: perPage,
    };
    return await this.companyService.getAllCompanies(options);
  }

  @Get('id/:id')
  @ApiParam({ name: 'id', description: 'The ID of the company' })
  @ApiResponse({
    status: 200,
    description: 'Company found',
    type: CreateCompanyDto,
  })
  async getCompanyById(@Param('id') companyId: number): Promise<Company> {
    return this.companyService.getCompanyById(companyId);
  }

  @Get('/name/:name')
  @ApiParam({ name: 'name', description: 'The name of the company' })
  @ApiResponse({
    status: 200,
    description: 'Company found',
    type: CreateCompanyDto,
  })
  async getCompanyByName(@Param('name') name: string): Promise<Company> {
    return this.companyService.findCompanyByName(name);
  }

  @Post(':companyId/users/:userId')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({
    status: 200,
    description: 'User added to company',
    type: CreateCompanyDto,
  })
  async addUserToCompany(
    @Param('companyId') companyId: number,
    @Param('userId') userId: number,
  ): Promise<Company> {
    return this.companyService.addUserToCompany(userId, companyId);
  }

  @Delete('remove/:id')
  @ApiParam({ name: 'id', description: 'The ID of the company' })
  @ApiResponse({
    status: 200,
    description: 'Company removed',
    type: CreateCompanyDto,
  })
  async removeCompany(@Param('id') id: number): Promise<Company> {
    return this.companyService.removeCompany(id);
  }

  @Delete(':companyId/users/:userId')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({
    status: 200,
    description: 'User removed from company',
    type: CreateCompanyDto,
  })
  async removeUserFromCompany(
    @Param('companyId') companyId: number,
    @Param('userId') userId: number,
  ): Promise<Company> {
    return this.companyService.removeUserFromCompany(companyId, userId);
  }

  @Post('/createCompany/:source/:category')
  @ApiBody({ description: 'Company data', type: CreateCompanyDto })
  @ApiParam({ name: 'source', description: 'The source of the company' })
  @ApiParam({ name: 'category', description: 'The category of the company' })
  @ApiResponse({
    status: 201,
    description: 'Company created',
    type: [CreateCompanyDto],
  })
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

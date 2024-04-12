import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';
import { CompanyMetadatum } from '../company-metadata/entities/company-metadatum.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationOptionsInterface } from './dto/PaginationOptionsInterface';
import { CreateCompanyMetadatumDto } from '../company-metadata/dto/create-company-metadatum.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('company')
@ApiTags('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
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
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async addCompanyMetadatum(
    @Param('id') companyId: number,
    @Body() body: CreateCompanyMetadatumDto,
  ): Promise<CompanyMetadatum> {
    const { type, value } = body;
    return this.companyService.addCompanyMetadatum(companyId, type, value);
  }

  @Get('/getAll/:page/:perPage')
  @ApiParam({ name: 'page', description: 'The page number', required: false })
  @ApiParam({
    name: 'perPage',
    description: 'The number of items per page',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of all companies with pagination',
    type: [CreateCompanyDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Companies not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
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

  @Get('/category/:categoryName/:page/:perPage')
  @ApiParam({ name: 'categoryName', description: 'The name of the category' })
  @ApiParam({ name: 'page', description: 'The page number', required: false })
  @ApiParam({
    name: 'perPage',
    description: 'The number of items per page',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of companies by category with pagination',
    type: [CreateCompanyDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Companies with category not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async getCompaniesByCategory(
    @Param('categoryName') categoryName: string,
    @Param('page') page: number,
    @Param('perPage') perPage: number,
  ) {
    return await this.companyService.getCompaniesByCategory(categoryName, {
      page,
      perPage,
    });
  }

  @Get('/search')
  @ApiParam({ name: 'categoryName', description: 'Название категории' })
  @ApiParam({ name: 'city', description: 'Название города' })
  @ApiParam({
    name: 'tags',
    description: 'Теги (необязательно, разделенные запятой)',
  })
  @ApiParam({ name: 'page', description: 'Номер страницы', required: false })
  @ApiParam({
    name: 'perPage',
    description: 'Количество элементов на странице',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Список компаний с пагинацией',
    type: CreateCompanyDto,
    isArray: true,
  })
  @ApiResponse({
    status: 404,
    description: 'Компании с указанной категорией и/или городом не найдены',
  })
  @ApiResponse({ status: 500, description: 'Ошибка сервера' })
  async getCompaniesByCategoryAndCity(
    @Query('categoryName') categoryName: string,
    @Query('city') city: string,
    @Query('tags') tags: string | undefined,
    @Query('page') page: number = 1,
    @Query('perPage') perPage: number = 10,
  ) {
    let tagsArray: string[] | null;

    if (tags) {
      tagsArray = tags.split(',');
    } else {
      tagsArray = [];
    }

    if (!city) {
      city = null;
    }

    if (!categoryName) {
      categoryName = null;
    }

    return await this.companyService.getCompaniesByCategoryAndCity(
      categoryName,
      city,
      tagsArray,
      { page, perPage },
    );
  }

  @Get('id/:id')
  @ApiParam({ name: 'id', description: 'The ID of the company' })
  @ApiResponse({
    status: 200,
    description: 'Company found',
    type: CreateCompanyDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
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
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async getCompanyByName(@Param('name') name: string): Promise<Company> {
    return this.companyService.findCompanyByName(name);
  }

  @Get('/name/:name/:page/:perPage')
  @ApiParam({ name: 'name', description: 'The name of the company' })
  @ApiParam({ name: 'page', description: 'Page number' })
  @ApiParam({ name: 'perPage', description: 'Items per page' })
  @ApiResponse({
    status: 200,
    description: 'Companies found',
    type: CreateCompanyDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Companies not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async getCompaniesByName(
    @Param('name') name: string,
    @Param('page') page: number,
    @Param('perPage') perPage: number,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    return this.companyService.findCompaniesByName(name, { page, perPage });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Post(':companyId/users/:userId')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({
    status: 200,
    description: 'User added to company',
    type: CreateCompanyDto,
  })
  @ApiResponse({
    status: 404,
    description: 'CompanyId or UserId not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async addUserToCompany(
    @Param('companyId') companyId: number,
    @Param('userId') userId: number,
  ): Promise<Company> {
    return this.companyService.addUserToCompany(userId, companyId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Delete('remove/:id')
  @ApiParam({ name: 'id', description: 'The ID of the company' })
  @ApiResponse({
    status: 200,
    description: 'Company removed',
    type: CreateCompanyDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async removeCompany(@Param('id') id: number): Promise<Company> {
    return this.companyService.removeCompany(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Delete(':companyId/users/:userId')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiParam({ name: 'userId', description: 'The ID of the user' })
  @ApiResponse({
    status: 200,
    description: 'User removed from company',
    type: CreateCompanyDto,
  })
  @ApiResponse({
    status: 404,
    description: 'CompanyId or userId not found',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async removeUserFromCompany(
    @Param('companyId') companyId: number,
    @Param('userId') userId: number,
  ): Promise<Company> {
    return this.companyService.removeUserFromCompany(companyId, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Post('edit/:companyId')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiBody({ type: CreateCompanyDto })
  @ApiResponse({
    status: 200,
    description: 'Company edited successfully',
    type: Company,
  })
  async editCompany(
    @Param('companyId') companyId: number,
    @Body() data: Partial<Company>,
  ): Promise<Company> {
    return this.companyService.editCompany(companyId, data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['superAdmin'])
  @ApiBearerAuth()
  @Post('changeSub/:companyId/:variant')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiParam({ name: 'variant', description: 'Variant of subs' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: CreateCompanyDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async changeSub(
    @Param('companyId') companyId: number,
    @Param('variant') variant: string,
  ): Promise<Company> {
    return this.companyService.changeSub(companyId, variant);
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
  @ApiResponse({
    status: 404,
    description: 'Company create failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
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

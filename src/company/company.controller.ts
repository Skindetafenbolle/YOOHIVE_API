import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationOptionsInterface } from './dto/PaginationOptionsInterface';
import { CreateCompanyMetadatumDto } from '../company-metadata/dto/create-company-metadatum.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Service } from '../service/entities/service.entity';
import { UpdateCompanyDto } from './dto/UpdateCompanyDto';
import { CreateServiceTranslationDto } from '../service/dto/CreateServiceTranslationDto';
import { DeleteServiceTranslationDto } from '../service/dto/DeleteServiceTranslationDto';
import { UpdateServiceTranslationDto } from '../service/dto/UpdateServiceTranslationDto';

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

  @Get('/getAll/:lang/:page/:perPage')
  @ApiParam({ name: 'lang', description: 'The lang of the data' })
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
  async getAllCompanies(
    @Param('lang') languageCode: string,
    @Param('page') page = 1,
    @Param('perPage') perPage = 10,
  ) {
    const options: PaginationOptionsInterface = {
      page,
      perPage,
    };

    return this.companyService.getAllCompanies(options, languageCode);
  }

  @Get('/category/:lang/:categoryName/:page/:perPage')
  @ApiParam({ name: 'lang', description: 'The lang of the data' })
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
    @Param('lang') lang: string,
    @Param('page') page: number,
    @Param('perPage') perPage: number,
  ) {
    return await this.companyService.getCompaniesByCategory(
      categoryName,
      lang,
      {
        page,
        perPage,
      },
    );
  }

  @Get('/category/sub/subs/:subcategoryName/:page/:perPage')
  @ApiParam({
    name: 'subcategoryName',
    description: 'The name of the category',
  })
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
  async getCompaniesBySubCategory(
    @Param('subcategoryName') subcategoryName: string,
    @Param('page') page: number,
    @Param('perPage') perPage: number,
    @Query('languageCode') languageCode?: string,
  ) {
    console.log('Subcategory Name:', subcategoryName);
    console.log('Language Code:', languageCode);
    return await this.companyService.getCompaniesBySubCategory(
      subcategoryName,
      languageCode,
      {
        page,
        perPage,
      },
    );
  }

  @Get('/search')
  @ApiParam({ name: 'subcategoryName', description: 'Название подкатегории' })
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
    description: 'Компании с указанной подкатегорией и/или городом не найдены',
  })
  @ApiResponse({ status: 500, description: 'Ошибка сервера' })
  async getCompaniesByCategoryAndCity(
    @Query('subcategoryName') subcategoryName: string,
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

    if (!subcategoryName) {
      subcategoryName = null;
    }

    return await this.companyService.getCompaniesByCategoryAndCity(
      subcategoryName,
      city,
      tagsArray,
      { page, perPage },
    );
  }

  @Get('address/unique')
  async getUniqueLocations() {
    const addresses = await this.companyService.getAllCompanyAddresses();

    const uniqueLocations: string[] = [];

    addresses.forEach((address) => {
      const words = address.split(', ');

      const cityRegion = words.slice(-2).join(', ');

      if (!uniqueLocations.includes(cityRegion)) {
        uniqueLocations.push(cityRegion);
      }
    });

    return uniqueLocations;
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
  async getCompanyByName(
    @Param('name') name: string,
    @Query('languageCode') languageCode: string,
  ): Promise<Company> {
    return this.companyService.findCompanyByName(name, languageCode);
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
    @Query('languageCode') languageCode: string,
    @Param('page') page: number,
    @Param('perPage') perPage: number,
  ): Promise<{ companies: Company[]; totalCount: number }> {
    return this.companyService.findCompaniesByName(name, languageCode, {
      page,
      perPage,
    });
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Patch('/editCompany/:companyId')
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Company,
  })
  @ApiResponse({
    status: 404,
    description: 'Failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async updateCompany(
    @Param('companyId') id: number,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    return await this.companyService.updateCompany({ ...updateCompanyDto, id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Put('/:companyId/metadata')
  @ApiResponse({
    status: 200,
    description: 'Success',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async updateCompanyMetadata(
    @Param('companyId') companyId: number,
    @Body() metadata: any[],
  ) {
    await this.companyService.updateCompanyMetadata(companyId, metadata);
    return { success: true, message: 'Company metadata updated successfully' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Put('/:companyId/services/:serviceId')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiParam({ name: 'serviceId', description: 'The ID of the service' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Service,
  })
  @ApiResponse({
    status: 404,
    description: 'Failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async updateService(
    @Param('companyId') companyId: number,
    @Param('serviceId') serviceId: number,
    @Body() newData: Partial<Service>,
  ): Promise<Service> {
    return this.companyService.updateService(companyId, serviceId, newData);
  }

  @Get('/payment')
  async payment() {
    return this.companyService.payment();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @ApiBearerAuth()
  @Put('/:companyId/services/:serviceId/subservices')
  @ApiParam({ name: 'companyId', description: 'The ID of the company' })
  @ApiParam({ name: 'serviceId', description: 'The ID of the service' })
  @ApiResponse({
    status: 200,
    description: 'Success',
    type: Service,
  })
  @ApiResponse({
    status: 404,
    description: 'Failed',
  })
  @ApiResponse({
    status: 500,
    description: 'Server error',
  })
  async addSubService(
    @Param('companyId') companyId: number,
    @Param('serviceId') serviceId: number,
    @Body() subServiceData: Partial<Service>,
  ): Promise<Service> {
    return this.companyService.addSubService(
      companyId,
      serviceId,
      subServiceData,
    );
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
    @Body() data: any[],
    @Param('source') source: string,
    @Param('category') category: string,
  ): Promise<Company[]> {
    const subcategories = data.reduce((acc, curr) => {
      acc.push(...curr.subcategories);
      return acc;
    }, []);
    return await this.companyService.createCompanyFromParser(
      data,
      source,
      category,
      subcategories,
    );
  }

  @Post('addServiceTranslation')
  @ApiOperation({ summary: 'Add a service translation' })
  @ApiResponse({
    status: 201,
    description: 'The translation has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async addServiceTranslation(
    @Body() createServiceTranslationDto: CreateServiceTranslationDto,
  ) {
    return this.companyService.addServiceTranslation(
      createServiceTranslationDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @Put('updateServiceTranslation')
  @ApiOperation({ summary: 'Update a service translation' })
  @ApiResponse({
    status: 200,
    description: 'The translation has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Service translation not found' })
  async updateServiceTranslation(
    @Body() updateServiceTranslationDto: UpdateServiceTranslationDto,
  ) {
    return this.companyService.updateServiceTranslation(
      updateServiceTranslationDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['companyAdmin', 'superAdmin'])
  @Delete('deleteServiceTranslation')
  @ApiOperation({ summary: 'Delete a service translation' })
  @ApiResponse({
    status: 200,
    description: 'The translation has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Service translation not found' })
  async deleteServiceTranslation(
    @Body() deleteServiceTranslationDto: DeleteServiceTranslationDto,
  ) {
    return this.companyService.deleteServiceTranslation(
      deleteServiceTranslationDto,
    );
  }
}

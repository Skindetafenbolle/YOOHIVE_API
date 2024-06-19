import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  NotFoundException,
  Put,
  UseGuards,
  SetMetadata, Query,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('tag')
@ApiTags('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiBody({ type: CreateTagDto })
  @ApiResponse({ status: 201, description: 'Tag created', type: CreateTagDto })
  async createTag(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;
    return this.tagService.createTag(name);
  }

  @Get('/all')
  @ApiResponse({
    status: 200,
    description: 'List of all tags',
    type: [CreateTagDto],
  })
  async getAllTagsWithTranslation(@Query('languageCode') languageCode: string) {
    return await this.tagService.getAllTagsWithTranslations(languageCode);
  }

  // @Get(':id')
  // @ApiParam({ name: 'id', description: 'The ID of the tag' })
  // @ApiResponse({ status: 200, description: 'Tag found', type: CreateTagDto })
  // async getTagById(@Param('id') id: number): Promise<Tag> {
  //   return await this.tagService.getTagById(id);
  // }

  @Put('edit/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @SetMetadata('roles', ['superAdmin'])
  @ApiParam({ name: 'id', description: 'The ID of the tag' })
  @ApiResponse({ status: 200, description: 'Tag found', type: CreateTagDto })
  @ApiBearerAuth()
  async updateTag(
    @Param('id') id: number,
    @Body('name') name: string,
  ): Promise<Tag> {
    try {
      return await this.tagService.updateTag(id, name);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Delete('remove/:id')
  @ApiParam({ name: 'id', description: 'The ID of the tag' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  async removeTag(@Param('id') id: number) {
    try {
      const deletedTag = await this.tagService.removeTag(id);
      return {
        message: 'Tag deleted successfully',
        tag: deletedTag,
      };
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }
}

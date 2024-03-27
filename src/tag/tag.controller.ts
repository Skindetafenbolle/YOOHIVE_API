import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  NotFoundException,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';
import { ApiTags } from '@nestjs/swagger';

@Controller('tag')
@ApiTags('tag')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  async createTag(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    const { name } = createTagDto;
    return this.tagService.createTag(name);
  }

  @Get('/all')
  async getAllTags(): Promise<Tag[]> {
    return await this.tagService.getAllTags();
  }

  @Get(':id')
  async getTagById(@Param('id') id: number): Promise<Tag> {
    return await this.tagService.getTagById(id);
  }

  @Delete('remove/:id')
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

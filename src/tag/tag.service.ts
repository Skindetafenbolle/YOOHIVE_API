import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { Repository } from 'typeorm';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async createTag(name: string, icon: string): Promise<Tag> {
    const tag = this.tagRepository.create({ name, icon });
    return await this.tagRepository.save(tag);
  }

  async removeTag(id: number): Promise<Tag> {
    const tagToRemove = await this.tagRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!tagToRemove) {
      throw new Error(`Tag with ${id} not found`);
    }
    return this.tagRepository.remove(tagToRemove);
  }

  async getAllTags(): Promise<Tag[]> {
    return await this.tagRepository.find();
  }

  async getTagById(id: number): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }
}

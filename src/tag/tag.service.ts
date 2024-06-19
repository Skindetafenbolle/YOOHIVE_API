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

  async createTag(name: string): Promise<Tag> {
    const tag = this.tagRepository.create({ name });
    return await this.tagRepository.save(tag);
  }
  async updateTag(id: number, newName: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Tag with id ${id} not found`);
    }
    if (tag.name !== newName) {
      tag.name = newName;
      await this.tagRepository.save(tag);
    }

    return tag;
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

  async getAllTagsWithTranslations(languageCode: string): Promise<any[]> {
    const tags = await this.tagRepository.find({
      relations: ['translations'],
    });
    return tags.map((tag) => {
      const translation = tag.translations.find(
          (t) => t.languageCode === languageCode,
      );
      return {
        ...tag,
        name: translation ? translation.name : tag.name,
        description: translation ? translation.description : null,
      };
    });
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

  async getTagByName(tagName: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: {
        name: tagName,
      },
    });
    if (!tag) {
      throw new NotFoundException('Tag not found');
    }
    return tag;
  }

  private async saveSpecialTags(specialTags: string[]): Promise<Tag[]> {
    if (!specialTags || specialTags.length === 0) {
      return [];
    }

    const tags: Tag[] = [];

    for (const tagName of specialTags) {
      let tag: Tag = await this.tagRepository.findOne({
        where: { name: tagName },
      });

      if (!tag) {
        tag = this.tagRepository.create({ name: tagName });
        tag = await this.tagRepository.save(tag);
      }

      tags.push(tag);
    }

    return tags;
  }

  private async saveSpecialLanguages(languageData: string[]): Promise<Tag[]> {
    if (!languageData || languageData.length === 0) {
      return [];
    }

    const savedLanguages: Tag[] = [];

    for (const languageName of languageData) {
      let language: Tag = await this.tagRepository.findOne({
        where: { name: languageName },
      });

      if (!language) {
        language = this.tagRepository.create({ name: languageName });
        language = await this.tagRepository.save(language);
      }

      savedLanguages.push(language);
    }

    return savedLanguages;
  }
  async saveTags(tagsData: any[]): Promise<Tag[]> {
    return await this.saveSpecialTags(tagsData);
  }
  async saveLanguages(langData: any[]): Promise<Tag[]> {
    return await this.saveSpecialLanguages(langData);
  }
}

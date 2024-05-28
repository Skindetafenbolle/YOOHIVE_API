import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Tag } from './tag.entity';

@Entity()
export class TagTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tag, (tag) => tag.translations, {
    onDelete: 'CASCADE',
  })
  tag: Tag;

  @Column()
  languageCode: string;

  @Column()
  name: string;

  @Column()
  description: string;
}

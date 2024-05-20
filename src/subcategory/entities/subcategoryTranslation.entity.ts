import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Subcategory } from './subcategory.entity';

@Entity()
export class SubcategoryTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Subcategory, (subcategory) => subcategory.translations, {
    onDelete: 'CASCADE',
  })
  subcategory: Subcategory;

  @Column()
  languageCode: string;

  @Column()
  name: string;

  @Column()
  description: string;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Category } from '../../category/entities/category.entity';
import { SubcategoryTranslation } from './subcategoryTranslation.entity';

@Entity()
export class Subcategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Company, (company) => company.subcategories)
  companies: Company[];

  @ManyToMany(() => Category, (category) => category.subcategories)
  categories: Category[];

  @OneToMany(
    () => SubcategoryTranslation,
    (translation) => translation.subcategory,
  )
  translations: SubcategoryTranslation[];
}

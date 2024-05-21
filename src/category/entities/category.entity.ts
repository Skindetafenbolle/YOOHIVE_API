import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Subcategory } from '../../subcategory/entities/subcategory.entity';
import { CategoryTranslation } from './categoryTranslation.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  slug: string;

  @ManyToMany(() => Company, (company) => company.categories)
  companies: Company[];

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.categories)
  @JoinTable()
  subcategories: Subcategory[];

  @OneToMany(() => CategoryTranslation, (translation) => translation.category)
  translations: CategoryTranslation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

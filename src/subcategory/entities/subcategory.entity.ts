import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Category } from '../../category/entities/category.entity';

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
}

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Subcategory } from '../../subcategory/entities/subcategory.entity';

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

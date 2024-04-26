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
import { Category } from '../../category/entities/category.entity';
import { User } from '../../user/entities/user.entity';
import { CompanyMetadatum } from '../../company-metadata/entities/company-metadatum.entity';
import { Tag } from '../../tag/entities/tag.entity';
import { Service } from '../../service/entities/service.entity';
import { Subcategory } from '../../subcategory/entities/subcategory.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  address: string;

  @Column({ type: 'json' })
  geodata: object;

  @Column({ nullable: true })
  source: string;

  @Column({ nullable: true })
  affiliation: string;

  @ManyToMany(() => Category, (category) => category.companies)
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Subcategory, (subcategory) => subcategory.companies)
  @JoinTable()
  subcategories: Subcategory[];

  @ManyToMany(() => Tag, (tag) => tag.companies)
  @JoinTable()
  tags: Tag[];

  @OneToMany(() => User, (user) => user.companies, { onDelete: 'CASCADE' })
  users: User[];

  @OneToMany(
    () => CompanyMetadatum,
    (companymetadatum) => companymetadatum.company,
    { onDelete: 'CASCADE' },
  )
  companymetadatums: CompanyMetadatum[];

  @OneToMany(() => Service, (service) => service.companies, {
    onDelete: 'CASCADE',
  })
  services: Service[];

  @Column({ nullable: true })
  subscription: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

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
import { metadata } from 'reflect-metadata/no-conflict';
import { Tag } from '../../tag/entities/tag.entity';
import { Service } from '../../service/entities/service.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  address: string;

  @Column()
  coordinates: string;

  @Column()
  source: string;

  @Column()
  affiliation: string;

  @ManyToMany(() => Category, (category) => category.companies)
  @JoinTable()
  categories: Category[];

  @ManyToMany(() => Tag, (tag) => tag.companies)
  @JoinTable()
  tags: Tag[];

  @OneToMany(() => User, (user) => user.companies, { onDelete: 'CASCADE' })
  users: User[];

  @OneToMany(
    () => CompanyMetadatum,
    (companymetadatum) => companymetadatum.companies,
    { onDelete: 'CASCADE' },
  )
  companymetadatums: CompanyMetadatum[];

  @OneToMany(() => Service, (service) => service.companies, {
    onDelete: 'CASCADE',
  })
  services: Service[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';

@Entity()
export class CompanyMetadatum {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column('json')
  value: object;

  @ManyToOne(() => Company, (company) => company.companymetadatums)
  company: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

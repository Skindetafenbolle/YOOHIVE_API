import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';

@Entity()
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  price: number;

  @Column()
  currency: string;

  @Column()
  duration_minutes: string;

  @Column()
  description: string;

  @ManyToOne(() => Service, (service) => service.sub_service)
  parent: Service;

  @OneToMany(() => Service, (service) => service.parent)
  sub_service: Service[];

  @ManyToOne(() => Company, (company) => company.services)
  companies: Company;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

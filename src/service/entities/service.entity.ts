import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { ServiceTranslation } from './serviceTranslation.entity';

@Entity()
export class Service {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  price: string;

  @Column({ nullable: true })
  currency: string;

  @Column({ nullable: true })
  duration_minutes: number;

  @Column({ default: true })
  isMain: boolean;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Company, (company) => company.services)
  companies: Company;

  @ManyToOne(() => Service, (service) => service.subServices, {
    nullable: true,
  })
  parent: Service;

  @OneToMany(() => Service, (subService) => subService.parent)
  subServices: Service[];

  @OneToMany(() => ServiceTranslation, (translation) => translation.service)
  translations: ServiceTranslation[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

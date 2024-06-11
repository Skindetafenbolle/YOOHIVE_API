import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Service } from './service.entity';

@Entity()
export class ServiceTranslation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  languageCode: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Service, (service) => service.translations, {
    onDelete: 'CASCADE',
  })
  service: Service;

  @Column()
  serviceId: number;
}

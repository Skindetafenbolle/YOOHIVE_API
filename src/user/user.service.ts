import {
  // BadRequestException,
  Injectable,
  // UnauthorizedException,
} from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
// import * as argon2 from 'argon2';
import { Company } from '../company/entities/company.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  // async create(createUserDto: CreateUserDto) {
  //   const existUser = await this.userRepository.findOne({
  //     where: {
  //       email: createUserDto.email,
  //     },
  //   });
  //
  //   if (existUser)
  //     throw new BadRequestException('This email is already registered');
  //
  //   const user = await this.userRepository.save({
  //     email: createUserDto.email,
  //     phone: createUserDto.phone,
  //     password: await argon2.hash(createUserDto.password),
  //     role: createUserDto.role || 'user',
  //   });
  //
  //   if (createUserDto.companiesId) {
  //     const companyId = parseInt(createUserDto.companiesId, 10);
  //     if (isNaN(companyId)) {
  //       throw new BadRequestException('Invalid companyId');
  //     }
  //     const company = await this.companyRepository.findOne({
  //       where: { id: companyId },
  //     });
  //
  //     if (!company) throw new BadRequestException('Company not found');
  //
  //     user.companies = company;
  //   }
  //
  //   await this.userRepository.save(user);
  //
  //   delete user.companies;
  //
  //   const token = this.jwtService.sign({
  //     email: createUserDto.email,
  //     role: createUserDto.role,
  //   });
  //
  //   return { user, token };
  // }
  //
  // async login(emailOrPhone: string, password: string) {
  //   let user: User;
  //
  //   if (emailOrPhone.includes('@')) {
  //     user = await this.userRepository.findOne({
  //       where: { email: emailOrPhone },
  //       relations: ['companies'],
  //     });
  //   } else {
  //     user = await this.userRepository.findOne({
  //       where: { phone: emailOrPhone },
  //       relations: ['companies'],
  //     });
  //   }
  //   if (!user || !(await argon2.verify(user.password, password))) {
  //     throw new UnauthorizedException('Invalid email/phone or password');
  //   }
  //
  //   const token = this.jwtService.sign({
  //     emailOrPhone: emailOrPhone,
  //     companyId: user.companies.id,
  //     role: user.role,
  //     sub: user.companies.subscription,
  //   });
  //   delete user.companies;
  //   return { user, token };
  // }

  findAll() {
    return `This action returns all user`;
  }

  async findOne(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async getById(id: number) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['companies'],
    });
  }
}

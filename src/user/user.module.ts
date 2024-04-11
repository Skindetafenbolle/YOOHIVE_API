import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Company } from '../company/entities/company.entity';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from '../auth/auth.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Company]),
    CompanyModule,
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard, RolesGuard],
  exports: [UserService],
})
export class UserModule {}

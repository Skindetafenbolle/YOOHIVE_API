import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(emailOrPhone: string, password: string): Promise<any> {
    const user = await this.userService.findOne(emailOrPhone);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!password) {
      throw new UnauthorizedException('Password is required');
    }
    if (!(await argon2.verify(user.password, password))) {
      throw new UnauthorizedException('Invalid password');
    }
    const { ...rest } = user;
    return rest;
  }

  async login(user: any) {
    const payload = {
      id: user.id,
      email: user.email,
      company: user.companies.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

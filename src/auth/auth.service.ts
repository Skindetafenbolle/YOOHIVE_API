import { Injectable } from '@nestjs/common';
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
      throw new Error('User not found'); // Возвращаем ошибку, если пользователь не найден
    }
    if (!(await argon2.verify(user.password, password))) {
      throw new Error('Invalid password'); // Возвращаем ошибку, если пароль неверный
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

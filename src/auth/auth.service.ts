import { BadRequestException, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { IUser } from '../types/types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findOne(email);
    const passwordIsMatch = await argon2.verify(user.password, password);

    if (user && passwordIsMatch) {
      return user;
    }
    throw new BadRequestException('Почта или пароль не верны');
  }

  async login(user: IUser) {
    const { id, email, phone } = user;
    return {
      id,
      email,
      phone,
      token: this.jwtService.sign({
        id: user.id,
        email: user.email,
        phone: user.phone,
      }),
    };
  }
}

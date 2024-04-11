import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(email, password);
      return user;
    } catch (error) {
      if (error.message === 'User not found') {
        throw new UnauthorizedException('User not found');
      } else if (error.message === 'Invalid password') {
        throw new UnauthorizedException('Invalid password');
      }
      throw error;
    }
  }
}

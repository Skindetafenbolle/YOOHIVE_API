import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'SECREET',
    });
  }

  async validate(payload: any) {
    const user = await this.userService.getById(payload.id);
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      company: user.companies.id,
      email: user.email,
      role: user.role,
    };
  }
}

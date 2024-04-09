import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import * as process from 'process';

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
    const user = await this.userService.getById(payload.sub);
    return {
      id: payload.sub,
      company: user.companies.id,
      email: user.email,
      role: user.role,
    };
  }
}

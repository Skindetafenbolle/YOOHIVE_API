import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './local.strategy';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule,
    JwtModule.register({
      secret: 'SECREET',
      signOptions: { expiresIn: '60h' },
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtService],
  exports: [AuthService, JwtService],
})
export class AuthModule {}

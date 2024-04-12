import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log(user);

    const companyIdFromRoute = +request.params.companyId;
    if (isNaN(companyIdFromRoute)) {
      throw new UnauthorizedException('Invalid company ID');
    }
    if (user.role === 'superAdmin') {
      return true;
    }
    if (user.role === 'companyAdmin') {
      const companyIdFromToken = user.company;
      return companyIdFromToken === companyIdFromRoute;
    }

    return false;
  }
}

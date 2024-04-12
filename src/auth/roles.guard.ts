import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (roles.includes('superAdmin') && user.role === 'superAdmin') {
      return true;
    }

    if (
      (roles.includes('companyAdmin') || roles.includes('companyManager')) &&
      (user.role === 'companyAdmin' || user.role === 'companyManager')
    ) {
      const companyIdFromToken = user.company;
      const companyIdFromRoute = +request.params.companyId;
      if (companyIdFromToken === companyIdFromRoute) {
        return true;
      }
      throw new UnauthorizedException('You do not have access to this company');
    }

    return false;
  }
}

import { Injectable, CanActivate, ExecutionContext, ForbiddenException,Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from 'src/services/web_terminal/entity/wt.entity';

@Injectable()
export class RolesGuard implements CanActivate{
    constructor(private reflector:Reflector){}

    canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('ROLES_KEY', context.getHandler());
    if (!requiredRoles) {
      return true;
    }

    // Get the logged-in user from the request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have permission to access this resource');
    }

    return true;
  }


}
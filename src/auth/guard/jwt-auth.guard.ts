// src/auth/guard/jwt-auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const currentTime = Math.floor(Date.now() / 1000);

    if (user && user.exp && user.exp < currentTime) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }

    return true;
  }
}

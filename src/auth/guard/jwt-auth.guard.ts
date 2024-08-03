import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 먼저 기본 AuthGuard 로직을 수행
    const canActivate = super.canActivate(context);
    if (!canActivate) {
      return false;
    }

    // 토큰의 만료 시간을 검증
    const currentTime = Math.floor(Date.now() / 1000);
    if (user && user.exp && user.exp < currentTime) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }

    return true;
  }
}

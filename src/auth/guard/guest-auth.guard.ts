import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GuestAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (request.headers.authorization) {
      // JWT 인증이 있을 경우, AuthGuard의 canActivate 호출
      return (await super.canActivate(context)) as boolean;
    }

    // JWT 인증이 없는 경우에도 요청을 허용
    return true;
  }
}

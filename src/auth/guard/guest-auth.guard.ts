// import {
//   Injectable,
//   ExecutionContext,
//   UnauthorizedException,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';

// @Injectable()
// export class GuestAuthGuard extends AuthGuard('jwt') {
//   async canActivate(context: ExecutionContext): Promise<boolean> {
//     const request = context.switchToHttp().getRequest();

//     console.log('GuestAuthGuard', request);
//     if (request.headers.authorization) {
//       // JWT 인증이 있을 경우, AuthGuard의 canActivate 호출
//       return (await super.canActivate(context)) as boolean;
//     }

//     // JWT 인증이 없는 경우에도 요청을 허용
//     return true;
//   }
// }
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
    const { authorization } = request.headers;

    console.log('GuestAuthGuard', authorization);
    if (authorization) {
      return (await super.canActivate(context)) as boolean;
    }

    return true;
  }

  handleRequest(err, user, info) {
    // JWT 인증이 실패한 경우, 인증 예외를 무시하고 요청을 허용
    if (err || !user) {
      return true;
    }

    // JWT 인증이 성공한 경우, 요청 객체에 사용자 정보를 추가
    return user;
  }
}

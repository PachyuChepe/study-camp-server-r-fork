import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // 만료된 토큰을 허용하지 않음
      secretOrKey: configService.get('JWT_SECRET_KEY'),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOne(payload.email);

    if (!user) {
      throw new UnauthorizedException('로그인이 필요합니다.');
    }

    // 현재 시간과 비교하여 토큰이 만료되었는지 확인
    const currentTime = Math.floor(Date.now() / 1000); // 현재 시간을 초 단위로 변환
    if (payload.exp < currentTime) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }

    return { ...user, exp: payload.exp }; // 사용자와 만료 시간을 반환
  }
}

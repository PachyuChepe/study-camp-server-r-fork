import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-kakao';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class KakaoStrategy extends PassportStrategy(Strategy, 'kakao') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('KAKAO_CLIENT_ID'),
      // clientSecret: configService.get('KAKAO_CLIENT_SECRET'),
      callbackURL: `${configService.get('SERVER')}/auth/kakao/callback`,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, username, _json } = profile;
    console.log('어떻게 들어오니?', profile);

    let firstName = '';
    let lastName = '';

    if (username.includes(' ')) {
      // 이름에 공백이 있는 경우, 공백을 기준으로 분리
      const nameParts = username.split(' ');
      lastName = nameParts[0];
      firstName = nameParts.slice(1).join(' ');
    } else {
      // 이름에 공백이 없는 경우, 첫 글자를 성으로 나머지를 이름으로 설정
      lastName = username.charAt(0);
      firstName = username.slice(1);
    }

    const user = {
      email: _json.kakao_account.email,
      firstName,
      lastName,
    };

    const validatedUser = await this.authService.validateOAuthLogin(user);
    done(null, validatedUser);
  }
}

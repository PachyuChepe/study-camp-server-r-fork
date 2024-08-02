// src/auth/auth.service.ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { User } from 'src/user/entities/user.entity';
import { SpaceService } from 'src/space/space.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private spaceService: SpaceService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(email);
    if (!user) {
      throw new UnauthorizedException(
        '존재하지 않는 회원이거나 비밀번호가 틀립니다.',
      );
    }
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.userService.comparePassword(email, password);

    const accessToken = await this.generateAccessToken(user);
    await this.generateRefreshToken(user);

    return {
      message: '로그인 완료',
      access_token: accessToken,
      member_search: {
        id: user.id,
        email: user.email,
        nick_name: user.nick_name,
        skin: user.skin,
        hair: user.hair,
        face: user.face,
        clothes: user.clothes,
        hair_color: user.hair_color,
        clothes_color: user.clothes_color,
      },
    };
  }

  async sendVerificationCode(email: string): Promise<void> {
    // const code = Math.random().toString(36).substring(2, 8);
    const existingUser = await this.userService.findByEmailGoogle(email);
    if (existingUser) {
      throw new ConflictException('이미 가입된 이메일입니다.');
    }

    const code = Math.floor(Math.random() * (999999 - 100000)) + 100000;
    await this.redisService.setVerificationCode(email, code.toString());
  }

  async verifyEmail(email: string, code: string): Promise<boolean> {
    const storedCode = await this.redisService.getVerificationCode(email);
    return storedCode === code;
  }

  async validateOAuthLogin(userProfile: any): Promise<User> {
    let user = await this.userService.findByEmailGoogle(userProfile.email);
    if (!user) {
      const newUser = new CreateUserDto();
      newUser.email = userProfile.email;
      newUser.nick_name = `${userProfile.lastName}${userProfile.firstName}`;
      newUser.password = `${uuidv4()}`;
      // ... 추가적인 사용자 정보 설정 ...
      user = await this.userService.create(newUser);
    }
    return user;
  }

  async generateAccessToken(user: any): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    await this.redisService.setAccessToken(user.email, accessToken);
    return accessToken;
  }

  async generateRefreshToken(user: any): Promise<string> {
    const payload = { email: user.email, sub: user.id };
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    await this.redisService.setRefreshToken(user.email, refreshToken);
    return refreshToken;
  }
}

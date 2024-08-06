import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { RedisModule } from '../redis/redis.module';
import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { JwtStrategy } from './strategy/jwt.strategy';
import { LocalStrategy } from './strategy/local.strategy';
import { GoogleStrategy } from './strategy/google.strategy';
import { SpaceModule } from 'src/space/space.module';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { GuestAuthGuard } from './guard/guest-auth.guard';
import { KakaoStrategy } from './strategy/kakao.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    UserModule,
    RedisModule,
    SpaceModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    LocalStrategy,
    LocalAuthGuard,
    GuestAuthGuard,
    GoogleStrategy,
    KakaoStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

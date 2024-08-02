import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType; // redis DB와 상호작용 시 사용

  constructor(private configService: ConfigService) {}

  // redis 연결
  async onModuleInit() {
    this.client = createClient({
      // redis URL
      url: `redis://${this.configService.get('REDIS_USERNAME')}:${this.configService.get('REDIS_PASSWORD')}@${this.configService.get('REDIS_HOST')}:${this.configService.get('REDIS_PORT')}/0`,
    });

    this.client.on('error', (error) => console.error(`Redis Error: ${error}`));

    await this.client.connect();
    console.log('Connected to Redis');
  }

  // redis 연결 종료
  async onModuleDestroy() {
    await this.client.quit();
  }

  // access token 생성
  async setAccessToken(userId: string, token: string): Promise<void> {
    await this.client.set(`access_token:${userId}`, token, {
      EX: 60 * 60 * 24 * 1, // 1일 유효기간
    });
  }

  // access token 조회
  async getAccessToken(userId: string): Promise<string | null> {
    return await this.client.get(`access_token:${userId}`);
  }

  // access token 삭제
  async removeAccessToken(userId: string): Promise<void> {
    await this.client.del(`access_token:${userId}`);
  }

  // refresh token 생성
  async setRefreshToken(userId: string, token: string): Promise<void> {
    await this.client.set(`refresh_token:${userId}`, token, {
      EX: 60 * 60 * 24 * 7, // 7일 유효기간
    });
  }

  // refresh token 조회
  async getRefreshToken(userId: string): Promise<string | null> {
    return await this.client.get(`refresh_token:${userId}`);
  }

  // refresh token 삭제
  async removeRefreshToken(userId: string): Promise<void> {
    await this.client.del(`refresh_token:${userId}`);
  }

  // 인증번호 전송
  async setVerificationCode(email: string, code: string): Promise<void> {
    await this.client.set(`verification_code:${email}`, code, {
      EX: 60 * 3,
    });
  }

  // 인증번호 검증
  async getVerificationCode(email: string): Promise<string | null> {
    return await this.client.get(`verification_code:${email}`);
  }

  // Google OAuth 인증 데이터 저장
  async saveAuthData(userId: string, data: any): Promise<void> {
    await this.client.set(`auth_data:${userId}`, JSON.stringify(data), {
      EX: 60 * 5, // 5분 유효기간
    });
  }

  // Google OAuth 인증 데이터 검색
  async getAuthData(userId: string): Promise<any> {
    const data = await this.client.get(`auth_data:${userId}`);
    return data ? JSON.parse(data) : null;
  }

  // Google OAuth 인증 데이터 삭제
  async removeAuthData(userId: string): Promise<void> {
    await this.client.del(`auth_data:${userId}`);
  }

  // 초대 코드 저장
  async saveInvitingCode(spaceId: number, code: string): Promise<void> {
    await this.client.set(`inviting_code:${code}`, spaceId, {
      EX: 60 * 30,
    });
  }

  // 초대 코드 조회
  async getInvitingCode(code: string): Promise<string | null> {
    return await this.client.get(`inviting_code:${code}`);
  }
}

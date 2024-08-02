import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { RedisService } from 'src/redis/redis.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  @Post()
  async register(@Body() createUserDto: CreateUserDto) {
    await this.userService.create(createUserDto);
    return { message: '회원가입이 완료되었습니다.' };
  }

  @Get('/profile')
  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  async getProfile(@Req() req) {
    return this.userService.findOne(req.user.email);
  }

  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return { message: '전체 회원 조회 성공', users };
  }

  @Get(':id')
  findOne(@Param('email') email: string) {
    return this.userService.findOne(email);
  }

  @Patch()
  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  async updateProfile(@Req() req, @Body() updateUserDto: UpdateUserDto) {
    await this.userService.update(req.user.id, updateUserDto);
    return { message: '회원 정보가 업데이트되었습니다.' };
  }

  @Delete()
  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  async removeProfile(@Req() req) {
    await this.userService.remove(req.user.id);
    await this.redisService.removeAccessToken(req.user.email);
    await this.redisService.removeRefreshToken(req.user.email);
    return { message: '회원 탈퇴가 완료되었습니다.' };
  }
}

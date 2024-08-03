import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ValidationPipe,
  Req,
  UsePipes,
} from '@nestjs/common';
import { SpaceService } from './space.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { GuestAuthGuard } from 'src/auth/guard/guest-auth.guard';

@Controller('space')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Post()
  @UsePipes(ValidationPipe)
  async createSpace(@Req() req, @Body() createSpaceDto: CreateSpaceDto) {
    const userId = req.user.id;

    return await this.spaceService.createSpace(
      createSpaceDto.name,
      createSpaceDto.content,
      createSpaceDto.password,
      createSpaceDto.image_url,
      userId,
    );
  }

  @Get()
  async findAll() {
    return await this.spaceService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.spaceService.findOne(+id);
  }

  @Get(':id/members')
  async findMembers(@Param('id') id: string) {
    return await this.spaceService.findMemebers(+id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSpaceDto: UpdateSpaceDto,
  ) {
    return await this.spaceService.update(+id, updateSpaceDto);
  }

  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return await this.spaceService.remove(+id, userId);
  }

  // 초대 코드 생성
  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Get('/invitation/:spaceId')
  async createInvitngCode(@Param('spaceId') spaceId: string, @Req() req) {
    const data = await this.spaceService.createInvitngCode(
      +spaceId,
      req.user.id,
    );
    return { code: data };
  }

  // 초대 코드 검증
  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Post('/invitation/check')
  async checkInvitingCode(@Body('code') code: string, @Req() req) {
    return await this.spaceService.checkInvitingCode(req.user.id, code);
  }

  @UseGuards(AuthGuard('jwt'), GuestAuthGuard)
  @Post('/enter')
  async enterSpace(@Body() body, @Req() req) {
    const spaceId = body.spaceId;
    const password = body.password;
    // 로그인 상태 확인
    const userId = req.user ? req.user.id : 0;
    return await this.spaceService.checkPassword(userId, spaceId, password);
  }
}

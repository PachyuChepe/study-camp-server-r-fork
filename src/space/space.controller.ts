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

@Controller('space')
export class SpaceController {
  constructor(private readonly spaceService: SpaceService) {}

  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Post()
  @UsePipes(ValidationPipe)
  async createSpace(@Req() req, @Body() createSpaceDto: CreateSpaceDto) {
    // 요청 객체에서 사용자 ID 추출
    const userId = req.user.id;

    return await this.spaceService.createSpace(
      createSpaceDto.name,
      createSpaceDto.content,
      createSpaceDto.password,
      userId,
    );
  }

  @Get()
  async findAll() {
    return await this.spaceService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spaceService.findOne(+id);
  }

  @Get()
  async findMemberSpaces(@Req() req) {
    return await this.spaceService.findSpacesByMember(req.user.id);
  }

  @Get('/:spaceId')
  async getAllMemberBySpaceId(@Param('spaceId') spaceId: number) {
    const result: any = await this.spaceService.getAllMemberBySpaceId(spaceId);
    result.spaceMembers.forEach((spaceMember) => {
      spaceMember.user = {
        id: spaceMember.user.id,
        nick_name: spaceMember.user.nick_name,
      };
    });
    return result;
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSpaceDto: UpdateSpaceDto) {
    return this.spaceService.update(+id, updateSpaceDto);
  }

  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.spaceService.remove(+id, userId);
  }

  // 초대 코드 생성
  @Get('/invitation/:spaceId')
  async createInvitngCode(@Param('spaceId') spaceId: string, @Req() req) {
    const data = await this.spaceService.createInvitngCode(
      +spaceId,
      req.user.id,
    );
    return { code: data };
  }

  // 초대 코드 검증
  @Post('/invitation/check')
  async checkInvitingCode(@Body('code') code: string, @Req() req) {
    return await this.spaceService.checkInvitingCode(req.user.id, code);
  }

  // 스페이스 비밀번호 검증
  @Post('/enter')
  async checkInvitingPassword(@Body() body, @Req() req) {
    const spaceId = body.spaceId;
    const password = body.password;
    return await this.spaceService.checkPassword(
      req.user.id,
      spaceId,
      password,
    );
  }
}

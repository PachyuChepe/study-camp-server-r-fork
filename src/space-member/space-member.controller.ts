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
import { SpaceMemberService } from './space-member.service';
import { CreateSpaceMemberDto } from './dto/create-space-member.dto';
import { UpdateSpaceMemberDto } from './dto/update-space-member.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@Controller('space-member')
export class SpaceMemberController {
  constructor(private readonly spaceMemberService: SpaceMemberService) {}

  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Post()
  async create(@Body() createSpaceMemberDto: CreateSpaceMemberDto) {
    return this.spaceMemberService.create(
      createSpaceMemberDto.user_id,
      createSpaceMemberDto.space_id,
    );
  }

  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Get('/user')
  async findAllByUser(@Req() req) {
    const userId = req.user.id;
    return await this.spaceMemberService.findAllMemberSpaceByUserId(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.spaceMemberService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'), JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.spaceMemberService.remove(+id);
  }
}

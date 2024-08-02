import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { SpaceMemberService } from './space-member.service';
import { CreateSpaceMemberDto } from './dto/create-space-member.dto';
import { UpdateSpaceMemberDto } from './dto/update-space-member.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';

@UseGuards(AuthGuard('jwt'), JwtAuthGuard)
@Controller('space-member')
export class SpaceMemberController {
  constructor(private readonly spaceMemberService: SpaceMemberService) {}

  @Post()
  async create(@Body() createSpaceMemberDto: CreateSpaceMemberDto) {
    return this.spaceMemberService.create(
      createSpaceMemberDto.user_id,
      createSpaceMemberDto.space_id,
    );
  }

  @Get('/space/:spaceId')
  findAllBySpace(@Param('spaceId') spaceId: string) {
    return this.spaceMemberService.findAllBySpace(+spaceId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spaceMemberService.findOne(+id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateSpaceMemberDto: UpdateSpaceMemberDto,
  // ) {
  //   return this.spaceMemberService.update(+id, updateSpaceMemberDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spaceMemberService.remove(+id);
  }
}

// space.controller.ts
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
  UploadedFile,
  UseInterceptors,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SpaceService } from './space.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { JwtAuthGuard } from 'src/auth/guard/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { GuestAuthGuard } from 'src/auth/guard/guest-auth.guard';
import { ObjectStorageService } from './object-storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@Controller('space')
export class SpaceController {
  private readonly logger = new Logger(SpaceController.name);

  constructor(
    private readonly spaceService: SpaceService,
    private readonly objectStorageService: ObjectStorageService, // ObjectStorageService 주입
  ) {}
  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UsePipes(ValidationPipe)
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 파일 크기 제한 (5MB)
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
          return cb(
            new BadRequestException('이미지 파일만 업로드할 수 있습니다.'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async createSpace(
    @Req() req,
    @Body() createSpaceDto: CreateSpaceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const userId = req.user.id;

    let imageUrl = '';
    if (file) {
      this.logger.log(`Uploading image: ${file.originalname}`);
      const objectName = await this.objectStorageService.uploadFile(file);

      imageUrl = await this.objectStorageService.createPAR(objectName);
    }

    if (typeof imageUrl !== 'string') {
      throw new BadRequestException('PAR URL 생성에 실패했습니다.');
    }

    const newSpaceDto = {
      ...createSpaceDto,
      image_url: imageUrl,
    };

    this.logger.log(`Final image_url: ${newSpaceDto.image_url}`);

    return await this.spaceService.createSpace(
      newSpaceDto.name,
      newSpaceDto.content,
      newSpaceDto.password,
      newSpaceDto.image_url,
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
  @UseGuards(GuestAuthGuard)
  @Post('/invitation/check')
  async checkInvitingCode(@Body('code') code: string, @Req() req) {
    // 로그인 상태 확인
    const userId = req.user ? req.user.id : 0;
    return await this.spaceService.checkInvitingCode(userId, code);
  }

  @UseGuards(GuestAuthGuard)
  @Post('/enter')
  async enterSpace(@Body() body, @Req() req) {
    const spaceId = body.spaceId;
    const password = body.password;
    // 로그인 상태 확인
    const userId = req.user ? req.user.id : 0;
    return await this.spaceService.checkPassword(userId, spaceId, password);
  }

  @UseGuards(GuestAuthGuard)
  @Get('/url/:url')
  async checkURL(@Param('url') url: string, @Req() req) {
    // const spaceId = body.spaceId;
    // const password = body.password;
    // 로그인 상태 확인
    // const userId = req.user ? req.user.id : 0;
    return await this.spaceService.findOneURL(url);
  }
}

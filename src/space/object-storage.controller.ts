import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ObjectStorageService } from './object-storage.service';
import { Express } from 'express';

@Controller('object-storage')
export class ObjectStorageController {
  private readonly logger = new Logger(ObjectStorageController.name);

  constructor(private readonly objectStorageService: ObjectStorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('image')) // 여기서 'file'을 'image'로 변경
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      this.logger.log(`Received file: ${file.originalname}`);
      const response = await this.objectStorageService.uploadFile(file);
      return {
        message: 'File uploaded successfully',
        data: response,
      };
    } catch (error) {
      this.logger.error('File upload failed', error);
      throw error;
    }
  }
}

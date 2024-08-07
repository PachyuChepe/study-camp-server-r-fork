import { Module } from '@nestjs/common';
import { SpaceService } from './space.service';
import { SpaceController } from './space.controller';
import { ObjectStorageController } from './object-storage.controller';
import { ObjectStorageService } from './object-storage.service';
import { Space } from './entities/space.entity';
import { SpaceMember } from 'src/space-member/entities/space-member.entity';
import { SpaceMemberModule } from 'src/space-member/space-member.module';
import { RedisModule } from 'src/redis/redis.module';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Space, SpaceMember]),
    SpaceMemberModule,
    RedisModule,
  ],
  controllers: [SpaceController, ObjectStorageController],
  providers: [SpaceService, ObjectStorageService],
  exports: [SpaceService, ObjectStorageService],
})
export class SpaceModule {}

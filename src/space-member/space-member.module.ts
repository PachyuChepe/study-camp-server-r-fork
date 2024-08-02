import { Module } from '@nestjs/common';
import { SpaceMemberService } from './space-member.service';
import { SpaceMemberController } from './space-member.controller';
import { SpaceMember } from './entities/space-member.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SpaceMember])],
  controllers: [SpaceMemberController],
  providers: [SpaceMemberService],
  exports: [SpaceMemberService],
})
export class SpaceMemberModule {}

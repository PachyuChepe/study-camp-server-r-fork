import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpaceMemberDto } from './dto/create-space-member.dto';
import { UpdateSpaceMemberDto } from './dto/update-space-member.dto';
import { SpaceMember } from './entities/space-member.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { promises } from 'dns';

@Injectable()
export class SpaceMemberService {
  constructor(
    @InjectRepository(SpaceMember)
    private spaceMemberRepository: Repository<SpaceMember>,
  ) {}

  async create(userId: number, spaceId: number): Promise<SpaceMember> {
    try {
      const exMember = await this.findExistSpaceMember(userId, spaceId);

      if (exMember) {
        throw new BadRequestException('이미 스페이스 멤버입니다.');
      }

      let newMember = this.spaceMemberRepository.create({
        user_id: userId,
        space_id: spaceId,
      });
      newMember = await this.spaceMemberRepository.save(newMember);

      return newMember;
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생 create member');
    }
  }

  async findAllMemberSpaceByUserId(userId: number) {
    try {
      const members = await this.spaceMemberRepository.find({
        where: { user_id: userId },
        relations: ['space', 'space.spaceMembers'],
      });

      if (!members || members.length == 0) {
        return [];
      }

      return members.map((member) => ({
        id: member.space_id,
        image_url: member.space.image_url,
        name: member.space.name,
        membersCount: member.space.spaceMembers.length,
        isPublic: member.space.password.length > 0,
      }));
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }

  async findOne(id: number) {
    try {
      const member = await this.spaceMemberRepository.findOne({
        where: { id },
      });
      return {
        code: 201,
        message: 'This action adds a new spaceMember',
        member,
      };
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }

  async findExistSpaceMember(
    userId: number,
    spaceId: number,
  ): Promise<SpaceMember> {
    try {
      const exMember = await this.spaceMemberRepository.findOne({
        where: { user_id: userId, space_id: spaceId },
      });

      return exMember;
    } catch (error) {
      throw new ConflictException('서버 에러');
    }
  }

  async remove(id: number) {
    try {
      const exSpace = await this.spaceMemberRepository.findOne({
        where: { id },
      });
      if (!exSpace) {
        throw new NotFoundException('해당하는 스페이스 멤버가 없습니다.');
      }
      await this.spaceMemberRepository.delete({ id });
      return { code: 200, message: 'You successfully delete the spaceMember' };
    } catch (error) {
      throw error;
    }
  }
}

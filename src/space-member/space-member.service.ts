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
      // await this.spaceMemberRepository.findOne({
      //   where: { user_id: userId, space_id: spaceId },
      // });

      if (exMember) {
        throw new BadRequestException('이미 스페이스 멤버입니다.');
      }

      let newMember = this.spaceMemberRepository.create({
        user_id: userId,
        space_id: spaceId,
      });
      newMember = await this.spaceMemberRepository.save(newMember);

      return newMember;
      // return {
      //   code: 201,
      //   message: 'This action adds a new spaceMember',
      //   newMember,
      // };
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }

  async findAllBySpace(spaceId: number) {
    try {
      const members = await this.spaceMemberRepository.find({
        where: { space_id: spaceId },
      });

      return members.map((member) => ({
        id: member.id,
        user_id: member.user_id,
        nick_name: member.user.nick_name,
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

  // update(id: number, updateSpaceMemberDto: UpdateSpaceMemberDto) {
  //   return `This action updates a #${id} spaceMember`;
  // }

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

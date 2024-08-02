import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { Space } from './entities/space.entity';
import { SpaceMember } from '../space-member/entities/space-member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceMemberService } from 'src/space-member/space-member.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SpaceService {
  constructor(
    @InjectRepository(Space) private spacesRepository: Repository<Space>,
    private spaceMemberService: SpaceMemberService,

    @InjectRepository(SpaceMember)
    private spaceMemberRepository: Repository<SpaceMember>,

    private redisService: RedisService,
  ) {}

  async createSpace(
    name: string,
    content: string,
    password: string,
    userId: number,
  ) {
    try {
      const exSpace: Space = await this.findSpaceByName(name);
      if (exSpace) {
        throw new BadRequestException('해당하는 방이 이미 존재합니다.');
      }

      let newSpace = this.spacesRepository.create({
        name: name,
        content: content,
        password: password,
        user_id: userId,
      });
      newSpace = await this.spacesRepository.save(newSpace);

      // 스페이스 멤버 등록
      await this.spaceMemberService.create(newSpace.user_id, newSpace.id);

      return { code: 201, message: 'You succesfully make a space', newSpace };
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }

  async findAll() {
    try {
      const spaces = await this.spacesRepository.find({
        select: ['id', 'user_id', 'content', 'name', 'image_url'],
        relations: ['spaceMembers'],
      });

      return spaces.map((space) => ({
        ...space,
        membersCount: space.spaceMembers.length,
      }));
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} space`;
  }

  private async findSpaceByName(name: string): Promise<any> {
    try {
      const result = await this.spacesRepository.findOne({
        where: { name },
        select: ['id', 'user_id', 'content', 'name', 'image_url'],
        relations: ['spaceMembers'],
      });

      const membersCount = result.spaceMembers.length;
      return { ...result, membersCount };
    } catch (error) {
      throw new ConflictException('서버 에러');
    }
  }

  async getAllMemberBySpaceId(spaceId: number) {
    try {
      const result = await this.spacesRepository.findOne({
        where: { id: spaceId },
        relations: ['spaceMembers', 'spaceMembers.user'],
      });
      return result;
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }
  // 사용자가 멤버로 있는 스페이스 조회
  async findSpacesByMember(userId: number): Promise<any> {
    try {
      const memberSpaces = await this.spaceMemberRepository.find({
        where: { user_id: userId },
        relations: ['space'],
      });

      // 각 스페이스와 해당 스페이스에서의 사용자 역할을 포함한 객체 반환
      return memberSpaces.map((member) => ({
        id: member.space.id,
        name: member.space.name,
        user_id: member.space.user_id,
        image_url: member.space.image_url,
        content: member.space.content,
        membersCount: member.space.spaceMembers.length,
      }));
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }

  update(id: number, updateSpaceDto: UpdateSpaceDto) {
    return `This action updates a #${id} space`;
  }

  async remove(id: number, userId: number) {
    try {
      const exSpace = await this.spacesRepository.findOne({
        where: { id: id, user_id: userId },
      });
      if (!exSpace) {
        throw new NotFoundException(
          '해당하는 스페이스가 없거나 접근 권한이 없습니다.',
        );
      }
      await this.spacesRepository.delete({ id });
      return { code: 200, message: 'You successfully delete the space' };
    } catch (error) {
      throw error;
    }
  }
  // 초대 코드 생성
  async createInvitngCode(spaceId: number, userId: number) {
    // const isSpaceMember = await this.spaceMemberRepository.findOne({
    //   where: { space_id: spaceId, user_id: userId },
    // });

    // if (isSpaceMember.role !== SpaceMemberRole.Admin) {
    //   throw new UnauthorizedException('권한이 없습니다.');
    // }

    const numbers = '0123456789';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';

    for (let i = 0; i < 3; i++) {
      result += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    for (let i = 3; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }

    result = result
      .split('')
      .sort(() => {
        return 0.5 - Math.random();
      })
      .join('');

    await this.redisService.saveInvitingCode(spaceId, result);
    return result;
  }

  // 초대 코드 검증
  async checkInvitingCode(userId: number, code: string) {
    const spaceId = await this.redisService.getInvitingCode(code);

    const space = await this.spacesRepository.findOne({
      where: { id: +spaceId },
      relations: ['spaceMembers'],
    });

    let member = await this.spaceMemberService.findExistSpaceMember(
      userId,
      +spaceId,
    );
    if (!member) {
      // 스페이스 멤버 등록
      member = await this.spaceMemberService.create(userId, +spaceId);
    }

    return member;
  }

  // 비밀번호 입장 검증
  async checkPassword(userId: number, spaceId: number, password: string) {
    const space = await this.spacesRepository.findOne({
      where: { id: spaceId },
    });
    if (space.password !== password) {
      throw new BadRequestException('비밀번호가 일치하지 않습니다.');
    }

    // // 해당 스페이스의 멤버인지 확인
    // const checkUserInSpace = await this.spacesRepository.findOne({
    //   where: { id: spaceId, user_id: userId },
    // });

    // if (checkUserInSpace) {
    //   // throw new BadRequestException('이미 해당 스페이스의 멤버 입니다.');
    // } else {
    // }

    // // 스페이스 멤버 등록
    // const signUpSpaceMember = await this.spaceMemberRepository.save({
    //   user_id: userId,
    //   space_id: +spaceId,
    // });

    return {
      id: space.id,
      name: space.name,
      user_id: space.user_id,
    };
  }
}

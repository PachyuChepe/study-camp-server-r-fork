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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SpaceMemberService } from 'src/space-member/space-member.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SpaceService {
  constructor(
    @InjectRepository(Space) private spaceRepository: Repository<Space>,
    private spaceMemberService: SpaceMemberService,

    private redisService: RedisService,
  ) {}

  async createSpace(
    name: string,
    content: string,
    password: string,
    image_url: string,
    userId: number,
  ) {
    try {
      const exSpace: Space = await this.findSpaceByName(name);
      if (exSpace) {
        throw new BadRequestException('해당하는 방이 이미 존재합니다.');
      }

      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let url = '';
      for (let i = 0; i < 20; i++) {
        url += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      let newSpace = this.spaceRepository.create({
        name,
        content,
        password,
        image_url,
        user_id: userId,
        url,
      });
      newSpace = await this.spaceRepository.save(newSpace);

      // 스페이스 멤버 등록
      await this.spaceMemberService.create(newSpace.user_id, newSpace.id);

      return { code: 201, message: 'You succesfully make a space', newSpace };
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생 createSpace');
    }
  }

  async findAll(userId: number) {
    try {
      // console.log('findAll', userId);
      const spaces = await this.spaceRepository.find({
        // select: ['id', 'user_id', 'content', 'name', 'image_url'],
        relations: ['spaceMembers'],
      });
      const filteredSpaces = !!userId
        ? spaces.filter((space) => {
            // console.log('findAll space m', space.spaceMembers);

            space.spaceMembers.some((member) => {
              // console.log('findAll m', member.user_id);
              member.user_id == userId;
            });
          })
        : spaces;

      return filteredSpaces.map((space) => ({
        id: space.id,
        user_id: space.user_id,
        name: space.name,
        content: space.content,
        image_url: space.image_url,
        membersCount: space.spaceMembers.length,
        isPublic: space.password.length == 0,
      }));
    } catch (error) {
      throw new InternalServerErrorException('서버 오류 발생');
    }
  }

  async findOne(id: number) {
    try {
      const result = await this.spaceRepository.findOne({
        where: { id },
        // select: ['id', 'user_id', 'content', 'name', 'image_url'],
        relations: ['spaceMembers'],
      });

      if (!result) {
        return null;
      }

      const membersCount = result ? result.spaceMembers.length : 0;
      return {
        id: result.id,
        user_id: result.user_id,
        name: result.name,
        content: result.content,
        image_url: result.image_url,
        membersCount,
        isPublic: result.password.length == 0,
      };
    } catch (error) {
      console.error('Error in findOne:', error); // 에러 로그 출력
      throw new ConflictException('서버 에러 findOne');
    }
  }

  async findOneURL(url: string) {
    try {
      const result = await this.spaceRepository.findOne({
        where: { url },
      });

      if (!result) {
        return false;
        return new BadRequestException('없는방');
      }
      return result.id;
    } catch (error) {
      return false;
      console.error('Error in findOne:', error); // 에러 로그 출력
      throw new ConflictException('서버 에러 findOne');
    }
  }

  async findMemebers(id: number) {
    try {
      const result = await this.spaceRepository.findOne({
        where: { id },
        // select: ['id', 'user_id', 'content', 'name', 'image_url','password'],
        relations: ['spaceMembers'],
      });

      if (!result) {
        return [];
      }

      const spaceMembers = result.spaceMembers.map((member) => ({
        id: member.id,
        user_id: member.user_id,
      }));
      return spaceMembers;
    } catch (error) {
      console.error('Error in findOne:', error); // 에러 로그 출력
      throw new ConflictException('서버 에러 findOne');
    }
  }

  private async findSpaceByName(name: string): Promise<any> {
    try {
      const result = await this.spaceRepository.findOne({
        where: { name },
        // select: ['id', 'user_id', 'content', 'name', 'image_url','password'],
        relations: ['spaceMembers'],
      });

      if (!result) {
        return null;
      }
      const membersCount = result ? result.spaceMembers.length : 0;
      return {
        id: result.id,
        user_id: result.user_id,
        name: result.name,
        content: result.content,
        image_url: result.image_url,
        membersCount,
        isPublic: result.password.length == 0,
      };
    } catch (error) {
      throw new ConflictException('서버 에러 findSpaceByName');
    }
  }

  update(id: number, updateSpaceDto: UpdateSpaceDto) {
    return `This action updates a #${id} space`;
  }

  async remove(id: number, userId: number) {
    try {
      const exSpace = await this.spaceRepository.findOne({
        where: { id: id, user_id: userId },
      });
      if (!exSpace) {
        throw new NotFoundException(
          '해당하는 스페이스가 없거나 접근 권한이 없습니다.',
        );
      }
      await this.spaceRepository.delete({ id });
      return { code: 200, message: 'You successfully delete the space' };
    } catch (error) {
      throw error;
    }
  }
  // 초대 코드 생성
  async createInvitngCode(spaceId: number, userId: number) {
    try {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';

      for (let i = 0; i < 6; i++) {
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
    } catch (error) {
      throw error;
    }
  }

  // 초대 코드 검증
  async checkInvitingCode(userId: number, code: string) {
    try {
      const spaceId = await this.redisService.getInvitingCode(code);

      const space = await this.spaceRepository.findOne({
        where: { id: +spaceId },
        relations: ['spaceMembers'],
      });

      return { id: space.id, url: space.url };
    } catch (error) {
      throw error;
    }
  }

  // 비밀번호 입장 검증
  async checkPassword(userId: number, spaceId: number, password: string) {
    try {
      const space = await this.spaceRepository.findOne({
        where: { id: spaceId },
      });

      if (!space) {
        throw new NotFoundException('해당 스페이스가 없음');
      }

      // 유저가 이미 멤버이면 입장
      if (!!userId) {
        let member = await this.spaceMemberService.findExistSpaceMember(
          +userId,
          +spaceId,
        );
        if (member) return { url: space.url };
      }

      if (space.password == password) {
        return { url: space.url };
      } else {
        throw new BadRequestException('비밀번호가 맞지 않습니다.');
      }
    } catch (error) {
      throw new ConflictException('서버 에러 checkPassword');
      return false;
    }
  }
}

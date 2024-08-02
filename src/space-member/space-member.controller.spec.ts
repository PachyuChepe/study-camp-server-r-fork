import { Test, TestingModule } from '@nestjs/testing';
import { SpaceMemberController } from './space-member.controller';
import { SpaceMemberService } from './space-member.service';

describe('SpaceMemberController', () => {
  let controller: SpaceMemberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpaceMemberController],
      providers: [SpaceMemberService],
    }).compile();

    controller = module.get<SpaceMemberController>(SpaceMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

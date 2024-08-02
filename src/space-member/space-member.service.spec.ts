import { Test, TestingModule } from '@nestjs/testing';
import { SpaceMemberService } from './space-member.service';

describe('SpaceMemberService', () => {
  let service: SpaceMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpaceMemberService],
    }).compile();

    service = module.get<SpaceMemberService>(SpaceMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

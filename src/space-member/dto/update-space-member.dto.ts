import { PartialType } from '@nestjs/swagger';
import { CreateSpaceMemberDto } from './create-space-member.dto';

export class UpdateSpaceMemberDto extends PartialType(CreateSpaceMemberDto) {}

import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateSpaceMemberDto {
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @IsNotEmpty()
  @IsNumber()
  space_id: number;
}

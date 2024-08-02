import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsNumber } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsNumber()
  skin: number;
  @IsNumber()
  hair: number;
  @IsNumber()
  face: number;
  @IsNumber()
  clothes: number;
  @IsNumber()
  hair_color: number;
  @IsNumber()
  clothes_color: number;
}

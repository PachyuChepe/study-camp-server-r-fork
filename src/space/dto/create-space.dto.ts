import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSpaceDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsString()
  readonly password: string;

  @IsString()
  readonly content: string;
}

import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CreateSpaceDto {
  @IsNotEmpty()
  @IsString()
  readonly name: string;

  @IsString()
  readonly password: string;

  @IsString()
  readonly content: string;

  @IsOptional()
  @IsString()
  image_url?: string;
}

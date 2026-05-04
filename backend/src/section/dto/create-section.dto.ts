import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;
}

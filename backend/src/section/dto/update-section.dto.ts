import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;
}

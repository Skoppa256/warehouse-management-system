import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { LocationType } from '@prisma/client';

export class UpdateLocationDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsEnum(LocationType)
  type?: LocationType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LocationType } from '@prisma/client';

export class CreateLocationDto {
  @IsString()
  code: string;

  @IsEnum(LocationType)
  type: LocationType;
}

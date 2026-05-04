import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { MovementType, ReferenceType } from '@prisma/client';

export class CreateMovementDto {
  @IsEnum(MovementType)
  type: MovementType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsEnum(ReferenceType)
  referenceType?: ReferenceType;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsString()
  productId: string;

  @IsString()
  batchId: string;

  @IsOptional()
  @IsString()
  inventoryId?: string;

  @IsOptional()
  @IsString()
  fromLocationId?: string;

  @IsOptional()
  @IsString()
  toLocationId?: string;
}

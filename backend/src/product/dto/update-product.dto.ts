import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { UOM } from '@prisma/client';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsEnum(UOM)
  uom?: UOM;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  sku?: string;
}

import { IsString, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { UOM } from '@prisma/client';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  sku: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsEnum(UOM)
  uom: UOM;

  @IsOptional()
  @IsString()
  imagePath?: string;

  @IsInt()
  @Min(0)
  lowStockThreshold: number;
}

import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { MovementType } from '@prisma/client';

export class StockMovementReportQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsEnum(MovementType)
  type?: MovementType;

  @IsOptional()
  @IsString()
  fromLocationId?: string;

  @IsOptional()
  @IsString()
  toLocationId?: string;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize: number = 50;
}

export class LowStockReportQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class ExpiryReportQueryDto {
  @IsOptional()
  @IsDateString()
  beforeDate?: string;

  @IsOptional()
  @IsDateString()
  afterDate?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}

export class BatchReportQueryDto {
  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}

export class ProductReportQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

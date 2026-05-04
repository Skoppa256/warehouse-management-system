import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

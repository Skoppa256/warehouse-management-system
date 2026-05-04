import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  batchNumber: string;

  @IsString()
  productId: string;

  @IsDateString()
  expiryDate: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

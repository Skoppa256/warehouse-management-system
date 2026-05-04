import { IsOptional, IsString } from 'class-validator';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  expectedDate?: string;

  @IsOptional()
  @IsString()
  supplierId?: string;
}

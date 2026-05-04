import { IsString, IsOptional } from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsString()
  supplierId: string;

  @IsOptional()
  @IsString()
  expectedDate?: string;
}

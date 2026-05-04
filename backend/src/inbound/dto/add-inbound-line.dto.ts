import { IsString, IsInt, Min, IsDateString } from 'class-validator';

export class AddInboundLineDto {
  @IsString()
  purchaseOrderItemId: string;

  @IsString()
  productId: string;

  @IsString()
  batchNumber: string;

  @IsString()
  locationId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsDateString()
  expiryDate: string;
}

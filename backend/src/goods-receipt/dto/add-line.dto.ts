import { IsString, IsInt, Min } from 'class-validator';

export class AddGRLineDto {
  @IsString()
  purchaseOrderItemId: string;

  @IsString()
  productId: string;

  @IsString()
  batchId: string; // inbound guarantees this exists

  @IsString()
  locationId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}

import { IsString } from 'class-validator';

export class CreateGoodsReceiptDto {
  @IsString()
  purchaseOrderId: string;
}

import { IsBoolean } from 'class-validator';

export class FinalizeGoodsReceiptDto {
  @IsBoolean()
  autoPostStock: boolean;
}

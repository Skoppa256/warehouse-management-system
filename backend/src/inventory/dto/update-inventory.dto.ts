import { IsInt, Min } from 'class-validator';

export class UpdateInventoryDto {
  @IsInt()
  @Min(0)
  quantity: number;

  @IsInt()
  @Min(0)
  reservedQty: number;
}

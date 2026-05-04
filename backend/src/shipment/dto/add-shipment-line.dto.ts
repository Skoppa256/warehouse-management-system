import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddShipmentLineDto {
  @IsString()
  salesOrderItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsUUID()
  fromLocationId: string;
}

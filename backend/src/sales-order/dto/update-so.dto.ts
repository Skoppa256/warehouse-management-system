import { IsOptional, IsString } from 'class-validator';

export class UpdateSalesOrderDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  orderDate?: string;
}

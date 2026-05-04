import { IsString, IsOptional } from 'class-validator';

export class CreateSalesOrderDto {
  @IsString()
  customerId: string;

  @IsOptional()
  @IsString()
  orderDate?: string;
}

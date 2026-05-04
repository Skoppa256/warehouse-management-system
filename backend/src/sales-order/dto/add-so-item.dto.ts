import { IsString, IsInt, Min } from 'class-validator';

export class AddSOItemDto {
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsInt()
  @Min(0)
  unitPrice: number;
}

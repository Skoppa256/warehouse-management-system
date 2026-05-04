import { IsNumber, Min, IsOptional } from 'class-validator';

export class UpdatePOItemDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;
}

import { IsString, IsOptional } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  contact?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  imagePath?: string;
}

import { IsBoolean } from 'class-validator';

export class FinalizeInboundDto {
  @IsBoolean()
  autoPostStock: boolean;
}

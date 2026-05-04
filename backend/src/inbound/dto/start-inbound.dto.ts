import { IsString } from 'class-validator';

export class StartInboundDto {
  @IsString()
  purchaseOrderId: string;
}

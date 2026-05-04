import { Module } from '@nestjs/common';
import { ShipmentService } from './shipment.service';
import { ShipmentController } from './shipment.controller';
import { PrismaModule } from '../prisma.module';
import { OutboundModule } from '../outbound/outbound.module';

@Module({
  imports: [PrismaModule, OutboundModule],
  controllers: [ShipmentController],
  providers: [ShipmentService],
  exports: [ShipmentService],
})
export class ShipmentModule {}

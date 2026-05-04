import { Module } from '@nestjs/common';
import { InboundController } from './inbound.controller';
import { InboundService } from './inbound.service';
import { GoodsReceiptModule } from '../goods-receipt/goods-receipt.module';
import { BatchModule } from '../batch/batch.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [GoodsReceiptModule, BatchModule],
  controllers: [InboundController],
  providers: [InboundService, PrismaService],
})
export class InboundModule {}

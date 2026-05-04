import { Module } from '@nestjs/common';
import { SalesOrderService } from './sales-order.service';
import { SalesOrderController } from './sales-order.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SalesOrderController],
  providers: [SalesOrderService],
  exports: [SalesOrderService],
})
export class SalesOrderModule {}

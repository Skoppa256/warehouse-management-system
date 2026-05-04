import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ShipmentService } from './shipment/shipment.service';
import { ShipmentModule } from './shipment/shipment.module';
import { SalesOrderController } from './sales-order/sales-order.controller';
import { SalesOrderModule } from './sales-order/sales-order.module';
import { GoodsReceiptService } from './goods-receipt/goods-receipt.service';
import { GoodsReceiptModule } from './goods-receipt/goods-receipt.module';
import { PurchaseOrderController } from './purchase-order/purchase-order.controller';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { MovementService } from './movement/movement.service';
import { MovementController } from './movement/movement.controller';
import { MovementModule } from './movement/movement.module';
import { InventoryModule } from './inventory/inventory.module';
import { LocationController } from './location/location.controller';
import { LocationModule } from './location/location.module';
import { SectionService } from './section/section.service';
import { SectionModule } from './section/section.module';
import { BatchController } from './batch/batch.controller';
import { BatchModule } from './batch/batch.module';
import { ProductService } from './product/product.service';
import { ProductController } from './product/product.controller';
import { ProductModule } from './product/product.module';
import { PrismaModule } from './prisma.module';
import { OutboundService } from './outbound/outbound.service';
import { OutboundModule } from './outbound/outbound.module';
import { InboundModule } from './inbound/inbound.module';
import { SupplierController } from './supplier/supplier.controller';
import { SupplierService } from './supplier/supplier.service';
import { CustomerService } from './customer/customer.service';
import { CustomerController } from './customer/customer.controller';
import { UploadController } from './upload/upload.controller';
import { UploadModule } from './upload/upload.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    ProductModule,
    SectionModule,
    BatchModule,
    MovementModule,

    ShipmentModule,
    SalesOrderModule,
    GoodsReceiptModule,
    PurchaseOrderModule,
    InventoryModule,
    LocationModule,
    OutboundModule,
    InboundModule,
    UploadModule,
    ReportsModule,
  ],
  controllers: [
    AppController,
    SalesOrderController,
    PurchaseOrderController,
    MovementController,
    LocationController,
    BatchController,
    ProductController,
    SupplierController,
    CustomerController,
  ],
  providers: [
    AppService,
    ShipmentService,
    GoodsReceiptService,
    MovementService,
    SectionService,
    ProductService,
    OutboundService,
    SupplierService,
    CustomerService,
  ],
})
export class AppModule {}

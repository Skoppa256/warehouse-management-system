import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSalesOrderDto } from './dto/create-so.dto';
import { AddSOItemDto } from './dto/add-so-item.dto';
import { UpdateSalesOrderDto } from './dto/update-so.dto';
import { SalesOrderStatus } from '@prisma/client';

@Injectable()
export class SalesOrderService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSalesOrderDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const orderNumber = `SO-${Date.now()}`;

    return this.prisma.salesOrder.create({
      data: {
        orderNumber,
        customerId: dto.customerId,
        status: SalesOrderStatus.DRAFT,
        ...(dto.orderDate && { orderDate: new Date(dto.orderDate) }),
      },
    });
  }

  async addItem(salesOrderId: string, dto: AddSOItemDto) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
    });
    if (!so) throw new NotFoundException('Sales order not found');

    const locked = new Set<SalesOrderStatus>([
      SalesOrderStatus.PENDING,
      SalesOrderStatus.PARTIALLY_SHIPPED,
      SalesOrderStatus.SHIPPED,
      SalesOrderStatus.CANCELLED,
    ]);

    if (locked.has(so.status)) {
      throw new ForbiddenException('Cannot modify this sales order');
    }

    const duplicate = await this.prisma.salesOrderItem.findFirst({
      where: { salesOrderId, productId: dto.productId },
    });
    if (duplicate) {
      throw new BadRequestException(
        'Product already exists in this Sales Order',
      );
    }

    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    return this.prisma.salesOrderItem.create({
      data: {
        salesOrderId,
        productId: dto.productId,
        quantity: dto.quantity,
        unitPrice: dto.unitPrice,
      },
    });
  }

  async findAll() {
    return this.prisma.salesOrder.findMany({
      include: {
        customer: true,
        items: { include: { product: true } },
        shipments: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: true,
        items: { include: { product: true } },
        shipments: true,
        user: true,
      },
    });

    if (!so) throw new NotFoundException('Sales order not found');
    return so;
  }

  async update(id: string, dto: UpdateSalesOrderDto) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
    });

    if (!so) throw new NotFoundException('Sales order not found');

    const locked = new Set<SalesOrderStatus>([
      SalesOrderStatus.PENDING,
      SalesOrderStatus.PARTIALLY_SHIPPED,
      SalesOrderStatus.SHIPPED,
      SalesOrderStatus.CANCELLED,
    ]);

    if (locked.has(so.status)) {
      throw new ForbiddenException('Cannot modify this sales order');
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        customerId: dto.customerId ?? so.customerId,
        ...(dto.orderDate && { orderDate: new Date(dto.orderDate) }),
      },
    });
  }

  async approve(id: string, userId: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!so) throw new NotFoundException('Sales order not found');

    if (so.status === SalesOrderStatus.CANCELLED)
      throw new ForbiddenException('Cannot approve cancelled SO');

    if (so.status === SalesOrderStatus.PENDING)
      throw new ForbiddenException('SO already approved');

    if (so.items.length === 0)
      throw new ForbiddenException('Cannot approve SO without items');

    return this.prisma.salesOrder.update({
      where: { id },
      data: {
        userId,
        status: SalesOrderStatus.PENDING,
      },
    });
  }

  async cancel(id: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id },
    });

    if (!so) throw new NotFoundException('Sales order not found');

    if (
      so.status === SalesOrderStatus.SHIPPED ||
      so.status === SalesOrderStatus.PARTIALLY_SHIPPED
    ) {
      throw new ForbiddenException(
        'Cannot cancel a Sales Order that has shipped items',
      );
    }

    return this.prisma.salesOrder.update({
      where: { id },
      data: { status: SalesOrderStatus.CANCELLED },
    });
  }
}

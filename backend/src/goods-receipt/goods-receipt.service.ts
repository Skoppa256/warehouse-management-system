import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateGoodsReceiptDto } from './dto/create-gr.dto';
import { AddGRLineDto } from './dto/add-line.dto';
import { GoodsReceiptStatus, OrderStatus } from '@prisma/client';

@Injectable()
export class GoodsReceiptService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGoodsReceiptDto, userId: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: dto.purchaseOrderId },
    });

    if (!po) throw new NotFoundException('Purchase order not found');

    if (po.status === OrderStatus.CANCELLED)
      throw new ForbiddenException('Cannot receive a cancelled PO');

    const receiptNumber = `GRN-${Date.now()}`;

    return this.prisma.goodsReceipt.create({
      data: {
        receiptNumber,
        purchaseOrderId: dto.purchaseOrderId,
        receivedById: userId,
        status: GoodsReceiptStatus.PENDING,
      },
    });
  }

  async addLine(grId: string, dto: AddGRLineDto) {
    const gr = await this.prisma.goodsReceipt.findUnique({
      where: { id: grId },
      include: { purchaseOrder: true },
    });

    if (!gr) throw new NotFoundException('Goods receipt not found');
    if (gr.status !== GoodsReceiptStatus.PENDING)
      throw new ForbiddenException('Cannot modify finalized GR');

    const poItem = await this.prisma.purchaseOrderItem.findUnique({
      where: { id: dto.purchaseOrderItemId },
    });

    if (!poItem || poItem.purchaseOrderId !== gr.purchaseOrderId) {
      throw new BadRequestException(
        'purchaseOrderItemId does not belong to this PO',
      );
    }

    if (poItem.productId !== dto.productId) {
      throw new BadRequestException(
        'productId does not match the purchase order item',
      );
    }

    const loc = await this.prisma.location.findUnique({
      where: { id: dto.locationId },
    });

    if (!loc || !loc.isActive)
      throw new BadRequestException('Invalid or inactive location');

    if (dto.quantity <= 0)
      throw new BadRequestException('Quantity must be greater than zero');

    const receivedSum = await this.prisma.goodsReceiptLine.aggregate({
      where: { purchaseOrderItemId: dto.purchaseOrderItemId },
      _sum: { quantity: true },
    });

    const receivedQty = receivedSum._sum.quantity ?? 0;
    const remaining = poItem.quantity - receivedQty;

    if (dto.quantity > remaining) {
      throw new BadRequestException(
        `Cannot receive more than remaining quantity. Remaining: ${remaining}`,
      );
    }

    const line = await this.prisma.goodsReceiptLine.create({
      data: {
        goodsReceiptId: grId,
        purchaseOrderItemId: dto.purchaseOrderItemId,
        productId: dto.productId,
        batchId: dto.batchId,
        locationId: dto.locationId,
        quantity: dto.quantity,
      },
    });

    await this.updatePOStatus(gr.purchaseOrderId);

    return line;
  }

  async finalize(grId: string, userId: string) {
    const gr = await this.prisma.goodsReceipt.findUnique({
      where: { id: grId },
      include: { lines: true, purchaseOrder: true },
    });

    if (!gr) throw new NotFoundException('GR not found');
    if (gr.status === GoodsReceiptStatus.RECEIVED)
      throw new ForbiddenException('GR already finalized');
    if (gr.lines.length === 0)
      throw new BadRequestException('Cannot finalize an empty GR');

    const finalized = await this.prisma.goodsReceipt.update({
      where: { id: grId },
      data: {
        status: GoodsReceiptStatus.RECEIVED,
        finalizedById: userId,
        finalizedAt: new Date(),
      },
    });

    await this.updatePOStatus(gr.purchaseOrderId);

    return finalized;
  }

  private async updatePOStatus(poId: string) {
    const poItems = await this.prisma.purchaseOrderItem.findMany({
      where: { purchaseOrderId: poId },
    });

    if (poItems.length === 0) return;

    const received = await this.prisma.goodsReceiptLine.groupBy({
      by: ['purchaseOrderItemId'],
      where: { purchaseOrderItem: { purchaseOrderId: poId } },
      _sum: { quantity: true },
    });

    let anyReceived = false;
    let fullyReceived = true;

    for (const item of poItems) {
      const rec = received.find((r) => r.purchaseOrderItemId === item.id);
      const recQty = rec?._sum?.quantity ?? 0;

      if (recQty > 0) anyReceived = true;
      if (recQty < item.quantity) fullyReceived = false;
    }

    const newStatus = fullyReceived
      ? OrderStatus.RECEIVED
      : anyReceived
        ? OrderStatus.PARTIALLY_RECEIVED
        : OrderStatus.PENDING;

    await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: newStatus },
    });
  }
}

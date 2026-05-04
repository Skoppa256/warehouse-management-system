import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  MovementType,
  ReferenceType,
  SalesOrderStatus,
  ShipmentStatus,
  ShipmentLine,
} from '@prisma/client';

@Injectable()
export class OutboundService {
  constructor(private prisma: PrismaService) {}

  async updateSalesOrderStatusFromShipments(salesOrderId: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { items: true },
    });

    if (!so) return;

    const ordered = so.items.reduce((acc, item) => acc + item.quantity, 0);

    const shippedLines = await this.prisma.shipmentLine.findMany({
      where: { salesOrderItem: { salesOrderId } },
    });

    const shipped = shippedLines.reduce((acc, line) => acc + line.quantity, 0);

    if (shipped === 0) {
      return;
    }

    if (shipped < ordered) {
      await this.prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: SalesOrderStatus.PARTIALLY_SHIPPED },
      });
    } else {
      await this.prisma.salesOrder.update({
        where: { id: salesOrderId },
        data: { status: SalesOrderStatus.SHIPPED },
      });
    }
  }

  async createShipmentForSalesOrder(salesOrderId: string, userId: string) {
    const so = await this.prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { items: true },
    });

    if (!so) throw new NotFoundException('Sales order not found');

    const allowedStatuses = new Set<SalesOrderStatus>([
      SalesOrderStatus.PENDING,
      SalesOrderStatus.PARTIALLY_SHIPPED,
    ]);

    if (!allowedStatuses.has(so.status)) {
      throw new ForbiddenException(
        'Cannot create shipment for this Sales Order. It must be approved (PENDING) first.',
      );
    }

    if (so.items.length === 0) {
      throw new BadRequestException(
        'Cannot create shipment for Sales Order with no items',
      );
    }

    const shipmentNumber = `SHIP-${Date.now()}`;

    return this.prisma.shipment.create({
      data: {
        shipmentNumber,
        salesOrderId,
        status: ShipmentStatus.DRAFT,
        userId,
      },
    });
  }

  async addShipmentLinesAutoAllocate(
    shipmentId: string,
    salesOrderItemId: string,
    quantity: number,
    fromLocationId: string,
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (!fromLocationId) {
      throw new BadRequestException('fromLocationId is required');
    }

    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { salesOrder: true },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    const blockedStatuses = new Set<ShipmentStatus>([
      ShipmentStatus.CANCELLED,
      ShipmentStatus.IN_TRANSIT,
      ShipmentStatus.DELIVERED,
    ]);

    if (blockedStatuses.has(shipment.status)) {
      throw new ForbiddenException('Cannot add lines to this shipment');
    }

    const soItem = await this.prisma.salesOrderItem.findUnique({
      where: { id: salesOrderItemId },
      include: { salesOrder: true },
    });

    if (!soItem) throw new NotFoundException('Sales order item not found');

    if (soItem.salesOrderId !== shipment.salesOrderId) {
      throw new BadRequestException(
        "Sales order item does not belong to this shipment's Sales Order",
      );
    }

    const existingLinesForItem = await this.prisma.shipmentLine.findMany({
      where: { salesOrderItemId },
    });

    const alreadyPlanned = existingLinesForItem.reduce(
      (acc, line) => acc + line.quantity,
      0,
    );

    if (alreadyPlanned + quantity > soItem.quantity) {
      throw new BadRequestException(
        `Cannot ship more than ordered for this item. Ordered=${soItem.quantity}, Already planned=${alreadyPlanned}`,
      );
    }

    // 🔥 ONLY look at the selected location
    const inventories = await this.prisma.inventory.findMany({
      where: {
        productId: soItem.productId,
        locationId: fromLocationId,
      },
      include: {
        batch: true,
        location: true,
      },
      orderBy: [{ batch: { expiryDate: 'asc' } }, { createdAt: 'asc' }],
    });

    if (inventories.length === 0) {
      throw new BadRequestException(
        'Selected location has no inventory for this product',
      );
    }

    let remaining = quantity;
    const createdLines: ShipmentLine[] = [];

    for (const inv of inventories) {
      const available = inv.quantity - inv.reservedQty;
      if (available <= 0) continue;

      const take = Math.min(available, remaining);
      if (take <= 0) continue;

      await this.prisma.inventory.update({
        where: { id: inv.id },
        data: {
          reservedQty: inv.reservedQty + take,
        },
      });

      const line = await this.prisma.shipmentLine.create({
        data: {
          shipmentId,
          salesOrderItemId,
          productId: soItem.productId,
          batchId: inv.batchId,
          fromLocationId: inv.locationId, // ✅ strictly the filtered location
          quantity: take,
        },
      });

      createdLines.push(line);
      remaining -= take;

      if (remaining === 0) break;
    }

    if (remaining > 0) {
      // rollback reservations & lines
      for (const line of createdLines) {
        const inv = await this.prisma.inventory.findUnique({
          where: {
            productId_batchId_locationId: {
              productId: line.productId,
              batchId: line.batchId,
              locationId: line.fromLocationId,
            },
          },
        });

        if (inv) {
          await this.prisma.inventory.update({
            where: { id: inv.id },
            data: {
              reservedQty: Math.max(inv.reservedQty - line.quantity, 0),
            },
          });
        }

        await this.prisma.shipmentLine.delete({ where: { id: line.id } });
      }

      throw new BadRequestException(
        'Insufficient available inventory at the selected location to fulfill this shipment',
      );
    }

    return createdLines;
  }

  async shipShipment(shipmentId: string, userId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { lines: true, salesOrder: true },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    if (shipment.status === ShipmentStatus.CANCELLED)
      throw new ForbiddenException('Cannot ship a cancelled shipment');

    if (shipment.status === ShipmentStatus.IN_TRANSIT)
      throw new ForbiddenException('Shipment already in transit');

    if (shipment.status === ShipmentStatus.DELIVERED)
      throw new ForbiddenException('Shipment already delivered');

    if (shipment.lines.length === 0)
      throw new BadRequestException('Cannot ship an empty shipment');

    for (const line of shipment.lines) {
      const inv = await this.prisma.inventory.findUnique({
        where: {
          productId_batchId_locationId: {
            productId: line.productId,
            batchId: line.batchId,
            locationId: line.fromLocationId,
          },
        },
      });

      if (!inv)
        throw new NotFoundException(
          'Inventory not found for product/batch/location during shipment',
        );

      if (inv.reservedQty < line.quantity)
        throw new BadRequestException(
          `Reserved quantity insufficient for shipment line ${line.id}`,
        );

      if (inv.quantity < line.quantity)
        throw new BadRequestException(
          `Physical quantity insufficient for shipment line ${line.id}`,
        );

      await this.prisma.inventory.update({
        where: { id: inv.id },
        data: {
          reservedQty: inv.reservedQty - line.quantity,
          quantity: inv.quantity - line.quantity,
        },
      });

      await this.prisma.stockMovement.create({
        data: {
          type: MovementType.OUT,
          quantity: line.quantity,
          productId: line.productId,
          batchId: line.batchId,
          fromLocationId: line.fromLocationId,
          referenceType: ReferenceType.SHIPMENT,
          referenceId: shipmentId,
          userId,
        },
      });
    }

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: ShipmentStatus.IN_TRANSIT,
        shippedAt: new Date(),
      },
    });

    await this.updateSalesOrderStatusFromShipments(shipment.salesOrderId);

    return { message: 'Shipment marked as IN_TRANSIT' };
  }

  async deliverShipment(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    if (shipment.status !== ShipmentStatus.IN_TRANSIT)
      throw new ForbiddenException(
        'Only IN_TRANSIT shipments can be delivered',
      );

    const updated = await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: {
        status: ShipmentStatus.DELIVERED,
        deliveredAt: new Date(),
      },
    });

    await this.updateSalesOrderStatusFromShipments(shipment.salesOrderId);

    return updated;
  }

  async cancelShipment(shipmentId: string) {
    const shipment = await this.prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { lines: true, salesOrder: true },
    });

    if (!shipment) throw new NotFoundException('Shipment not found');

    if (
      shipment.status === ShipmentStatus.IN_TRANSIT ||
      shipment.status === ShipmentStatus.DELIVERED
    ) {
      throw new ForbiddenException(
        'Cannot cancel a shipment that is already shipped/delivered',
      );
    }

    for (const line of shipment.lines) {
      const inv = await this.prisma.inventory.findUnique({
        where: {
          productId_batchId_locationId: {
            productId: line.productId,
            batchId: line.batchId,
            locationId: line.fromLocationId,
          },
        },
      });

      if (inv) {
        await this.prisma.inventory.update({
          where: { id: inv.id },
          data: {
            reservedQty: Math.max(inv.reservedQty - line.quantity, 0),
          },
        });
      }
    }

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: ShipmentStatus.CANCELLED },
    });

    await this.updateSalesOrderStatusFromShipments(shipment.salesOrderId);

    return { message: 'Shipment cancelled and reservations released' };
  }
}

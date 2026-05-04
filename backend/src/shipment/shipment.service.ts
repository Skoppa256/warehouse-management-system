import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateShipmentDto } from './dto/create-shipment.dto';
import { AddShipmentLineDto } from './dto/add-shipment-line.dto';
import { OutboundService } from '../outbound/outbound.service';

@Injectable()
export class ShipmentService {
  constructor(
    private prisma: PrismaService,
    private outbound: OutboundService,
  ) {}

  async create(dto: CreateShipmentDto, userId: string) {
    return this.outbound.createShipmentForSalesOrder(dto.salesOrderId, userId);
  }

  async addLine(shipmentId: string, dto: AddShipmentLineDto) {
    return this.outbound.addShipmentLinesAutoAllocate(
      shipmentId,
      dto.salesOrderItemId,
      dto.quantity,
      dto.fromLocationId,
    );
  }

  async findAll() {
    return this.prisma.shipment.findMany({
      include: {
        salesOrder: true,
        lines: {
          include: {
            product: true,
            batch: true,
            fromLocation: true,
            salesOrderItem: true,
          },
        },
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ship = await this.prisma.shipment.findUnique({
      where: { id },
      include: {
        salesOrder: true,
        lines: {
          include: {
            product: true,
            batch: true,
            fromLocation: true,
            salesOrderItem: true,
          },
        },
        user: true,
      },
    });

    if (!ship) throw new NotFoundException('Shipment not found');
    return ship;
  }

  async ship(id: string, userId: string) {
    return this.outbound.shipShipment(id, userId);
  }

  async deliver(id: string) {
    return this.outbound.deliverShipment(id);
  }

  async cancel(id: string) {
    return this.outbound.cancelShipment(id);
  }
}

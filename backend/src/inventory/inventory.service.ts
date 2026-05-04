import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const items = await this.prisma.inventory.findMany({
      include: {
        product: true,
        batch: true,
        location: true,
      },
    });

    // Group by productId + batchId + locationId
    const groupedMap = new Map();

    for (const inv of items) {
      const key = `${inv.productId}::${inv.batchId ?? 'NO_BATCH'}::${inv.locationId}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          // This is the merged row returned to FE
          id: inv.id, // ✔ preserve a REAL inventory ID for detail page
          productId: inv.productId,
          batchId: inv.batchId,
          locationId: inv.locationId,

          product: inv.product,
          batch: inv.batch,
          location: inv.location,

          quantity: 0,
          reservedQty: 0,

          // Track all real inventory row IDs
          inventoryIds: [],
        });
      }

      const entry = groupedMap.get(key);

      entry.quantity += inv.quantity ?? 0;
      entry.reservedQty += inv.reservedQty ?? 0;
      entry.inventoryIds.push(inv.id);
    }

    return Array.from(groupedMap.values());
  }

  async findOne(id: string) {
    const inv = await this.prisma.inventory.findUnique({
      where: { id },
      include: {
        product: true,
        batch: true,
        location: true,
      },
    });

    if (!inv) throw new NotFoundException('Inventory not found');
    return inv;
  }

  async update(id: string, dto: { quantity: number; reservedQty: number }) {
    const inv = await this.prisma.inventory.findUnique({ where: { id } });

    if (!inv) throw new NotFoundException('Inventory not found');

    return this.prisma.inventory.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        reservedQty: dto.reservedQty,
      },
    });
  }

  async getMovements(id: string) {
    const inv = await this.prisma.inventory.findUnique({
      where: { id },
    });

    if (!inv) throw new NotFoundException('Inventory not found');

    const movements = await this.prisma.stockMovement.findMany({
      where: { inventoryId: id },
      orderBy: { createdAt: 'desc' },

      include: {
        product: true,
        batch: true,
        fromLocation: true,
        toLocation: true,
        user: true,
      },
    });

    const enriched = await Promise.all(
      movements.map(async (m) => {
        let reference: any = null;

        if (m.referenceType === 'PURCHASE_ORDER') {
          reference = await this.prisma.purchaseOrder.findUnique({
            where: { id: m.referenceId! },
            select: { orderNumber: true, supplier: true },
          });
        }

        if (m.referenceType === 'SALES_ORDER') {
          reference = await this.prisma.salesOrder.findUnique({
            where: { id: m.referenceId! },
            select: { orderNumber: true, customer: true },
          });
        }

        return {
          ...m,
          reference,
        };
      }),
    );

    return enriched;
  }
}

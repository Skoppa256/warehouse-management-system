// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma.service';
// import { CreateCycleCountDto } from './dto/create-cycle-count.dto';
// import { SubmitCountDto } from './dto/submit-count.dto';
// import { AdjustmentType, MovementType } from '@prisma/client';

// @Injectable()
// export class CycleCountService {
//   constructor(private prisma: PrismaService) {}

//   // ============================================================
//   // 1. CREATE CYCLE COUNT + AUTO-GENERATE LINES
//   // ============================================================
//   async create(dto: CreateCycleCountDto) {
//     const cc = await this.prisma.cycleCount.create({
//       data: {
//         scheduledAt: new Date(),
//         createdById: dto.createdById ?? null,
//       },
//     });

//     // Load all inventory rows to generate lines
//     const inventories = await this.prisma.inventory.findMany({
//       include: { product: true, batch: true, location: true },
//     });

//     const linesData = inventories.map((inv) => ({
//       cycleCountId: cc.id,
//       inventoryId: inv.id,
//       productId: inv.productId,
//       batchId: inv.batchId,
//       locationId: inv.locationId,
//       expectedQty: inv.quantity,
//     }));

//     await this.prisma.cycleCountLine.createMany({ data: linesData });

//     return {
//       message: 'Cycle count created and lines generated',
//       cycleCountId: cc.id,
//       totalLines: linesData.length,
//     };
//   }

//   // ============================================================
//   // 2. LIST + GET
//   // ============================================================
//   async findAll() {
//     return this.prisma.cycleCount.findMany({
//       include: {
//         lines: true,
//         createdBy: true,
//       },
//       orderBy: { scheduledAt: 'desc' },
//     });
//   }

//   async findOne(id: string) {
//     const cc = await this.prisma.cycleCount.findUnique({
//       where: { id },
//       include: { lines: true, createdBy: true },
//     });
//     if (!cc) throw new NotFoundException('Cycle count not found');
//     return cc;
//   }

//   // ============================================================
//   // 3. SUBMIT COUNT FOR A SINGLE LINE
//   // ============================================================
//   async submitCount(lineId: string, dto: SubmitCountDto) {
//     const line = await this.prisma.cycleCountLine.findUnique({
//       where: { id: lineId },
//     });

//     if (!line) throw new NotFoundException('Cycle count line not found');

//     if (line.countedQty !== null) {
//       throw new BadRequestException('Count already submitted for this line');
//     }

//     const difference = dto.countedQty - line.expectedQty;

//     return this.prisma.cycleCountLine.update({
//       where: { id: lineId },
//       data: {
//         countedQty: dto.countedQty,
//         difference,
//       },
//     });
//   }

//   // ============================================================
//   // 4. COMPLETE CYCLE COUNT (AUTO ADJUST ALL DIFFERENCES)
//   // ============================================================
//   async complete(id: string, completedById?: string) {
//     const cc = await this.prisma.cycleCount.findUnique({
//       where: { id },
//       include: { lines: true },
//     });

//     if (!cc) throw new NotFoundException('Cycle count not found');

//     // Validate all lines have countedQty
//     const uncounted = cc.lines.filter((l) => l.countedQty === null);
//     if (uncounted.length > 0) {
//       throw new BadRequestException('Not all lines have counted quantities');
//     }

//     // Process each line
//     for (const line of cc.lines) {
//       if (line.difference === 0) continue;

//       const qtyDelta = line.difference ?? 0; // positive or negative

//       const inventory = await this.prisma.inventory.findUnique({
//         where: { id: line.inventoryId },
//       });

//       if (!inventory)
//         throw new NotFoundException(
//           'Inventory row disappeared — database integrity error',
//         );

//       const newQty = inventory.quantity + qtyDelta;
//       if (newQty < 0) {
//         throw new BadRequestException(
//           `Negative final stock prevented for product=${line.productId}`,
//         );
//       }

//       // Update inventory
//       await this.prisma.inventory.update({
//         where: { id: inventory.id },
//         data: { quantity: newQty },
//       });

//       // Create StockAdjustment
//       const adj = await this.prisma.stockAdjustment.create({
//         data: {
//           adjustmentType: AdjustmentType.COUNT_CORRECTION,
//           reason: 'Cycle count correction',
//           productId: line.productId,
//           batchId: line.batchId,
//           locationId: line.locationId,
//           quantityDelta: qtyDelta,
//           createdById: completedById ?? null,
//         },
//       });

//       // Create Movement
//       await this.prisma.stockMovement.create({
//         data: {
//           type: MovementType.ADJUSTMENT,
//           quantity: Math.abs(qtyDelta),
//           reason: 'Cycle count correction',
//           productId: line.productId,
//           batchId: line.batchId,
//           fromLocationId: qtyDelta < 0 ? line.locationId : null,
//           toLocationId: qtyDelta > 0 ? line.locationId : null,
//           referenceType: 'CYCLE_COUNT',
//           userId: completedById ?? null,
//         },
//       });

//       // Update line with adjustment reference
//       await this.prisma.cycleCountLine.update({
//         where: { id: line.id },
//         data: { stockAdjustmentId: adj.id },
//       });
//     }

//     // Mark cycle count completed
//     return this.prisma.cycleCount.update({
//       where: { id },
//       data: { completedAt: new Date() },
//     });
//   }
// }

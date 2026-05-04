// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma.service';
// import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
// import { MovementType } from '@prisma/client';

// @Injectable()
// export class AdjustmentService {
//   constructor(private prisma: PrismaService) {}

//   async create(dto: CreateAdjustmentDto) {
//     const { productId, batchId, locationId, quantityDelta } = dto;

//     // Validate batch & product
//     const batch = await this.prisma.productBatch.findUnique({
//       where: { id: batchId },
//     });

//     if (!batch || batch.productId !== productId) {
//       throw new BadRequestException('Batch does not belong to product');
//     }

//     // Validate location
//     const location = await this.prisma.location.findUnique({
//       where: { id: locationId },
//     });

//     if (!location) throw new NotFoundException('Location not found');

//     // Get inventory row
//     const inventory = await this.prisma.inventory.findUnique({
//       where: {
//         productId_batchId_locationId: {
//           productId,
//           batchId,
//           locationId,
//         },
//       },
//     });

//     if (!inventory) {
//       throw new NotFoundException(
//         'Inventory record not found for this product/batch/location',
//       );
//     }

//     // Validate quantity
//     const newQty = inventory.quantity + quantityDelta;
//     if (newQty < 0) {
//       throw new BadRequestException(
//         `Adjustment would result in negative stock. Current=${inventory.quantity}, change=${quantityDelta}`,
//       );
//     }

//     // Update inventory
//     const updatedInv = await this.prisma.inventory.update({
//       where: { id: inventory.id },
//       data: { quantity: newQty },
//     });

//     // Log movement
//     await this.prisma.stockMovement.create({
//       data: {
//         type: MovementType.ADJUSTMENT,
//         quantity: Math.abs(quantityDelta),
//         reason: dto.reason ?? null,
//         productId,
//         batchId,
//         toLocationId: quantityDelta > 0 ? locationId : null,
//         fromLocationId: quantityDelta < 0 ? locationId : null,
//         userId: dto.createdById ?? null,
//         referenceType: 'STOCK_ADJUSTMENT',
//       },
//     });

//     // Create adjustment record
//     const adjustment = await this.prisma.stockAdjustment.create({
//       data: {
//         adjustmentType: dto.adjustmentType,
//         reason: dto.reason,
//         productId,
//         batchId,
//         locationId,
//         quantityDelta,
//         createdById: dto.createdById ?? null,
//       },
//     });

//     return {
//       message: 'Stock adjustment applied',
//       adjustment,
//       updatedInventory: updatedInv,
//     };
//   }

//   async findAll() {
//     return this.prisma.stockAdjustment.findMany({
//       orderBy: { createdAt: 'desc' },
//       include: {
//         product: true,
//         batch: true,
//         location: true,
//         createdBy: true,
//       },
//     });
//   }

//   async findOne(id: string) {
//     const res = await this.prisma.stockAdjustment.findUnique({
//       where: { id },
//       include: {
//         product: true,
//         batch: true,
//         location: true,
//         createdBy: true,
//       },
//     });

//     if (!res) throw new NotFoundException('Adjustment not found');
//     return res;
//   }
// }

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Injectable()
export class BatchService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBatchDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const exists = await this.prisma.productBatch.findFirst({
      where: {
        batchNumber: dto.batchNumber,
        productId: dto.productId,
        isDeleted: false,
      },
    });

    if (exists)
      throw new ConflictException(
        'Batch number already exists for this product',
      );

    return this.prisma.productBatch.create({
      data: {
        batchNumber: dto.batchNumber,
        productId: dto.productId,
        expiryDate: new Date(dto.expiryDate),
        notes: dto.notes,
      },
    });
  }

  async findAll() {
    return this.prisma.productBatch.findMany({
      where: { isDeleted: false },
      orderBy: [{ expiryDate: 'asc' }],
      include: {
        product: true,
      },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.productBatch.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!batch || batch.isDeleted)
      throw new NotFoundException('Batch not found');

    return batch;
  }

  async update(id: string, dto: UpdateBatchDto) {
    const batch = await this.prisma.productBatch.findUnique({
      where: { id },
    });

    if (!batch || batch.isDeleted)
      throw new NotFoundException('Batch not found');

    if (dto.batchNumber && dto.batchNumber !== batch.batchNumber) {
      const duplicate = await this.prisma.productBatch.findFirst({
        where: {
          productId: batch.productId,
          batchNumber: dto.batchNumber,
          isDeleted: false,
        },
      });

      if (duplicate)
        throw new ConflictException(
          'Another batch with this number already exists for the same product',
        );
    }

    return this.prisma.productBatch.update({
      where: { id },
      data: {
        batchNumber: dto.batchNumber ?? batch.batchNumber,
        expiryDate: dto.expiryDate
          ? new Date(dto.expiryDate)
          : batch.expiryDate,
        notes: dto.notes ?? batch.notes,
      },
    });
  }

  async softDelete(id: string) {
    const batch = await this.prisma.productBatch.findUnique({ where: { id } });

    if (!batch || batch.isDeleted)
      throw new NotFoundException('Batch not found');

    return this.prisma.productBatch.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async ensureBatchExists(
    batchNumber: string,
    productId: string,
    expiryDate?: string | Date,
  ) {
    const existing = await this.prisma.productBatch.findFirst({
      where: { batchNumber, productId, isDeleted: false },
    });

    const expiry =
      expiryDate instanceof Date
        ? expiryDate
        : expiryDate
          ? new Date(expiryDate)
          : undefined;

    if (existing) {
      if (expiry && existing.expiryDate.getTime() !== expiry.getTime()) {
        throw new BadRequestException(
          'Expiry date does not match existing batch for this product.',
        );
      }

      return existing;
    }

    if (!expiry) {
      throw new BadRequestException(
        'Expiry date is required when creating a new batch.',
      );
    }

    return this.prisma.productBatch.create({
      data: {
        batchNumber,
        productId,
        expiryDate: expiry,
      },
    });
  }
}

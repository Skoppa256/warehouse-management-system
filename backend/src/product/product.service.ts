import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const exists = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });

    if (exists) throw new ConflictException('SKU already exists');

    return this.prisma.product.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, role: UserRole) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (
      product.isDeleted &&
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER
    ) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product || product.isDeleted)
      throw new NotFoundException('Product not found');

    if (dto.sku && dto.sku !== product.sku) {
      const exists = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (exists) throw new ConflictException('SKU already exists');
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product || product.isDeleted)
      throw new NotFoundException('Product not found');

    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async restore(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) throw new NotFoundException('Product not found');

    if (!product.isDeleted)
      throw new BadRequestException('Product is not deleted');

    return this.prisma.product.update({
      where: { id },
      data: { isDeleted: false },
    });
  }
}

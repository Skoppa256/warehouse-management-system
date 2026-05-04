import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class SupplierService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupplierDto) {
    return this.prisma.supplier.create({
      data: {
        code: dto.code,
        name: dto.name,
        contact: dto.contact,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        imagePath: dto.imagePath ?? null,
      },
    });
  }

  async findAll() {
    return this.prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, role: UserRole) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
    });

    if (!supplier) {
      throw new NotFoundException('Supplier not found');
    }

    if (
      !supplier.isActive &&
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER
    ) {
      throw new NotFoundException('Supplier not found');
    }

    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.prisma.supplier.update({
      where: { id },
      data: {
        code: dto.code ?? supplier.code,
        name: dto.name ?? supplier.name,
        contact: dto.contact ?? supplier.contact,
        email: dto.email ?? supplier.email,
        phone: dto.phone ?? supplier.phone,
        address: dto.address ?? supplier.address,

        imagePath:
          dto.imagePath !== undefined ? dto.imagePath : supplier.imagePath,
      },
    });
  }

  async softDelete(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async restore(id: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id } });

    if (!supplier) throw new NotFoundException('Supplier not found');

    if (supplier.isActive) {
      throw new BadRequestException('Supplier is already active');
    }

    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: true },
    });
  }
}

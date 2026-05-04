import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({
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
    return this.prisma.customer.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, role: UserRole) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!customer) throw new NotFoundException('Customer not found');

    if (
      role !== UserRole.ADMIN &&
      !customer.isActive &&
      role !== UserRole.MANAGER
    ) {
      throw new NotFoundException('Costumer not found');
    }

    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.customer.update({
      where: { id },
      data: {
        code: dto.code ?? customer.code,
        name: dto.name ?? customer.name,
        contact: dto.contact ?? customer.contact,
        email: dto.email ?? customer.email,
        phone: dto.phone ?? customer.phone,
        address: dto.address ?? customer.address,

        imagePath:
          dto.imagePath !== undefined ? dto.imagePath : customer.imagePath,
      },
    });
  }

  async softDelete(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async restore(id: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundException('Customer not found');

    return this.prisma.customer.update({
      where: { id },
      data: { isActive: true },
    });
  }
}

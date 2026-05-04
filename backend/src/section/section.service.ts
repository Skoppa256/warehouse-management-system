import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { UserRole } from '@prisma/client';
@Injectable()
export class SectionService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSectionDto) {
    const exists = await this.prisma.section.findFirst({
      where: { code: dto.code, isDeleted: false },
    });

    if (exists) {
      throw new ConflictException(`Section code "${dto.code}" already exists`);
    }

    return this.prisma.section.create({
      data: {
        code: dto.code,
        description: dto.description,
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.section.findMany({
        where: { isDeleted: false },
        include: {
          // _count: { select: { locations: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.section.count({
        where: { isDeleted: false },
      }),
    ]);

    return {
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, role: UserRole) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      // include: { locations: true },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (
      section.isDeleted &&
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER
    ) {
      throw new NotFoundException('Section not found');
    }

    return section;
  }

  async update(id: string, dto: UpdateSectionDto) {
    const section = await this.prisma.section.findUnique({ where: { id } });

    if (!section || section.isDeleted) {
      throw new NotFoundException('Section not found');
    }

    if (dto.code && dto.code !== section.code) {
      const exists = await this.prisma.section.findFirst({
        where: { code: dto.code, isDeleted: false },
      });

      if (exists) {
        throw new ConflictException(
          `Section code "${dto.code}" already exists`,
        );
      }
    }

    return this.prisma.section.update({
      where: { id },
      data: { ...dto },
    });
  }

  async softDelete(id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
      include: { locations: true },
    });

    if (!section || section.isDeleted) {
      throw new NotFoundException('Section not found');
    }

    if (section.locations.length > 0) {
      throw new ConflictException(
        'Cannot delete section while it has locations',
      );
    }

    return this.prisma.section.update({
      where: { id },
      data: { isDeleted: true },
    });
  }
}

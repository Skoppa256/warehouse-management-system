import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class LocationService {
  constructor(private prisma: PrismaService) {}

  async create(sectionId: string, dto: CreateLocationDto) {
    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section || section.isDeleted) {
      throw new NotFoundException('Section not found');
    }

    const exists = await this.prisma.location.findFirst({
      where: { code: dto.code, sectionId },
    });

    if (exists) {
      throw new ConflictException(
        `Location code "${dto.code}" already exists in this section`,
      );
    }

    return this.prisma.location.create({
      data: {
        code: dto.code,
        type: dto.type,
        sectionId,
      },
    });
  }

  async findAll(sectionId: string, page = 1, limit = 20, role: UserRole) {
    const skip = (page - 1) * limit;

    const section = await this.prisma.section.findUnique({
      where: { id: sectionId },
    });

    if (!section) throw new NotFoundException('Section not found');

    const where: any = { sectionId, isActive: true };

    const [data, total] = await Promise.all([
      this.prisma.location.findMany({
        where,
        include: {
          _count: { select: { inventory: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.location.count({ where }),
    ]);

    return {
      data,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(sectionId: string, locationId: string, role: UserRole) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      include: { section: true },
    });

    if (!location || location.sectionId !== sectionId) {
      throw new NotFoundException('Location not found');
    }

    if (
      !location.isActive &&
      role !== UserRole.ADMIN &&
      role !== UserRole.MANAGER
    ) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async update(sectionId: string, locationId: string, dto: UpdateLocationDto) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
    });

    if (!location || location.sectionId !== sectionId) {
      throw new NotFoundException('Location not found');
    }

    if (!location.isActive) {
      throw new ConflictException('Cannot update an inactive location');
    }

    if (dto.code && dto.code !== location.code) {
      const exists = await this.prisma.location.findFirst({
        where: { code: dto.code, sectionId },
      });

      if (exists) {
        throw new ConflictException(
          `Location code "${dto.code}" already exists in this section`,
        );
      }
    }

    return this.prisma.location.update({
      where: { id: locationId },
      data: { ...dto },
    });
  }

  async deactivate(sectionId: string, locationId: string) {
    const location = await this.prisma.location.findUnique({
      where: { id: locationId },
      include: { inventory: true },
    });

    if (!location || location.sectionId !== sectionId) {
      throw new NotFoundException('Location not found');
    }

    if (!location.isActive) {
      throw new ConflictException('Location already inactive');
    }

    if (location.inventory.length > 0) {
      throw new ConflictException(
        'Cannot deactivate location while inventory exists',
      );
    }

    return this.prisma.location.update({
      where: { id: locationId },
      data: { isActive: false },
    });
  }
}

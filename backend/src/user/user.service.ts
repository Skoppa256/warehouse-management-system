import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { handlePrismaError } from '../common/prisma-error.handler';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    try {
      const hashed = await bcrypt.hash(dto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashed,
          role: dto.role ?? 'STAFF',
        },
      });

      return this.sanitize(user);
    } catch (error) {
      handlePrismaError(error, 'create user');
    }
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      const data: any = { ...dto };

      if (dto.password) {
        data.password = await bcrypt.hash(dto.password, 10);
      }

      if (dto.role) {
        delete data.role;
      }

      const updated = await this.prisma.user.update({
        where: { id },
        data,
      });

      return this.sanitize(updated);
    } catch (error) {
      handlePrismaError(error, 'update user');
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.user.delete({ where: { id } });
      return { message: 'User deleted successfully' };
    } catch (error) {
      handlePrismaError(error, 'delete user');
    }
  }

  private sanitize(user: any) {
    const { password, ...rest } = user;
    return rest;
  }
}

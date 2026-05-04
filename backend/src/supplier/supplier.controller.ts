import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('supplier')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierController {
  constructor(private readonly service: SupplierService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateSupplierDto) {
    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER, UserRole.VIEWER)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER, UserRole.VIEWER)
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  softDelete(@Param('id') id: string) {
    return this.service.softDelete(id);
  }

  @Patch(':id/restore')
  @Roles(UserRole.ADMIN)
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }
}

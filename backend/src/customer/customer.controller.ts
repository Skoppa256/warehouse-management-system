import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('customer')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerController {
  constructor(private readonly service: CustomerService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateCustomerDto) {
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
    return this.service.findOne(id, req.user.role as UserRole);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
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

import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateProductDto,
    @Req() req,
  ) {
    if (file) {
      dto.imagePath = `/uploads/${file.filename}`;
    }

    return this.service.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.role as UserRole);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
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

  @Patch(':id/image')
  async updateImage(
    @Param('id') id: string,
    @Body('imagePath') imagePath: string,
  ) {
    if (!imagePath) {
      throw new BadRequestException('imagePath is required');
    }

    return this.service.update(id, { imagePath });
  }
}

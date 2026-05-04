import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { MovementService } from './movement.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('movement')
@UseGuards(JwtAuthGuard)
export class MovementController {
  constructor(private readonly service: MovementService) {}

  @Post()
  create(@Body() dto: CreateMovementDto, @Req() req) {
    return this.service.create(dto, req.user.id);
  }
}

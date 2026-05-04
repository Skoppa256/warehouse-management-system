import {
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';

import { LocationService } from './location.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('sections/:sectionId/locations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @Param('sectionId') sectionId: string,
    @Body() dto: CreateLocationDto,
  ) {
    return this.locationService.create(sectionId, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  findAll(
    @Param('sectionId') sectionId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Req() req,
  ) {
    return this.locationService.findAll(
      sectionId,
      +page,
      +limit,
      req.user.role,
    );
  }

  @Get(':locationId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.VIEWER)
  findOne(
    @Param('sectionId') sectionId: string,
    @Param('locationId') locationId: string,
    @Req() req,
  ) {
    return this.locationService.findOne(sectionId, locationId, req.user.role);
  }

  @Patch(':locationId')
  @Roles(UserRole.ADMIN)
  update(
    @Param('sectionId') sectionId: string,
    @Param('locationId') locationId: string,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.locationService.update(sectionId, locationId, dto);
  }

  @Delete(':locationId')
  @Roles(UserRole.ADMIN)
  deactivate(
    @Param('sectionId') sectionId: string,
    @Param('locationId') locationId: string,
  ) {
    return this.locationService.deactivate(sectionId, locationId);
  }
}

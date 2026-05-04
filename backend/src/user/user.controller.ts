import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../common/roles.decorator';
import { RolesGuard } from '../common/roles.guard';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

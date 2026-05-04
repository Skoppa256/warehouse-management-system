// import { Controller, Post, Body, Get, Param } from '@nestjs/common';
// import { AdjustmentService } from './adjustment.service';
// import { CreateAdjustmentDto } from './dto/create-adjustment.dto';

// @Controller('adjustment')
// export class AdjustmentController {
//   constructor(private readonly service: AdjustmentService) {}

//   @Post()
//   create(@Body() dto: CreateAdjustmentDto) {
//     return this.service.create(dto);
//   }

//   @Get()
//   findAll() {
//     return this.service.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.service.findOne(id);
//   }
// }

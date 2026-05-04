// import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
// import { CycleCountService } from './cycle-count.service';
// import { CreateCycleCountDto } from './dto/create-cycle-count.dto';
// import { SubmitCountDto } from './dto/submit-count.dto';

// @Controller('cycle-count')
// export class CycleCountController {
//   constructor(private readonly service: CycleCountService) {}

//   @Post()
//   create(@Body() dto: CreateCycleCountDto) {
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

//   @Patch('submit/:lineId')
//   submit(@Param('lineId') lineId: string, @Body() dto: SubmitCountDto) {
//     return this.service.submitCount(lineId, dto);
//   }

//   @Patch('complete/:id')
//   complete(
//     @Param('id') id: string,
//     @Body('completedById') completedById?: string,
//   ) {
//     return this.service.complete(id, completedById);
//   }
// }

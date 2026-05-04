import { Module } from '@nestjs/common';
import { MovementService } from './movement.service';
import { MovementController } from './movement.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MovementController],
  providers: [MovementService],
  exports: [MovementService],
})
export class MovementModule {}

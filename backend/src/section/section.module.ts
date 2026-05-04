import { Module } from '@nestjs/common';
import { SectionService } from './section.service';
import { SectionController } from './section.controller';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SectionController],
  providers: [SectionService],
  exports: [SectionService],
})
export class SectionModule {}

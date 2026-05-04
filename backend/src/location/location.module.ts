import { Module } from '@nestjs/common';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { PrismaModule } from '../prisma.module';
import { SectionModule } from '../section/section.module';

@Module({
  imports: [PrismaModule, SectionModule],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService],
})
export class LocationModule {}

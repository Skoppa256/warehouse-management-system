import { Module } from '@nestjs/common';
import { OutboundService } from './outbound.service';
import { PrismaModule } from '../prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OutboundService],
  exports: [OutboundService],
})
export class OutboundModule {}

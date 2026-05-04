import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  BadRequestException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async acquireBatchLock(batchId: string): Promise<void> {
    try {
      await this.movementLock.create({
        data: { batchId },
      });
    } catch (err) {
      throw new BadRequestException(
        'Batch is being updated by another operation. Please try again.',
      );
    }
  }

  async releaseBatchLock(batchId: string): Promise<void> {
    try {
      await this.movementLock.delete({
        where: { batchId },
      });
    } catch {}
  }
}

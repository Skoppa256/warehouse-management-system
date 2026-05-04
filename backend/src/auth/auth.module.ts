import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../common/roles.guard';
import { RedisModule } from '../redis/redis.module';
import { EmailModule } from '../email/email.module';
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
    RedisModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, PrismaService],
  exports: [AuthService],
})
export class AuthModule {}

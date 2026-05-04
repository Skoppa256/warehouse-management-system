import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserRole } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private redis: RedisService,
    private email: EmailService,
  ) {}

  private generateTokens(userId: string, email: string, role: UserRole) {
    const accessToken = this.jwt.sign(
      { sub: userId, email, role, type: 'access' },
      { expiresIn: '7d' },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, email, role, type: 'refresh' },
      { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) throw new BadRequestException('Email already registered');

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await this.redis.saveTempUser(dto.email, dto);
    await this.redis.saveVerificationCode(dto.email, code);
    await this.email.sendVerificationEmail(dto.email, code);
    return { message: 'Verification code sent to email' };
  }

  async verify(email: string, code: string) {
    const storedCode = await this.redis.getVerificationCode(email);
    if (!storedCode) throw new NotFoundException('Verification code expired');

    if (storedCode !== code)
      throw new BadRequestException('Invalid verification code');

    const tempUser = await this.redis.getTempUser(email);
    if (!tempUser) throw new NotFoundException('Registration session expired');

    const hashed = await bcrypt.hash(tempUser.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: tempUser.name,
        email: tempUser.email,
        password: hashed,
        role: UserRole.STAFF,
      },
    });

    await this.redis.deleteTempUser(email);
    await this.redis.deleteVerificationCode(email);

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      message: 'Email verified & user registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto) {
    const { refreshToken } = dto;

    try {
      const payload = await this.jwt.verifyAsync(refreshToken);

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) throw new UnauthorizedException('User not found');

      return this.generateTokens(user.id, user.email, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async logout(userId: string) {
    return { message: 'Logged out successfully' };
  }
}

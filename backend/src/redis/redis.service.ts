import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

  async saveTempUser(email: string, data: any) {
    await this.redis.setex(`temp_user:${email}`, 600, JSON.stringify(data)); // 10 MIN
  }

  async getTempUser(email: string) {
    const data = await this.redis.get(`temp_user:${email}`);
    return data ? JSON.parse(data) : null;
  }

  async deleteTempUser(email: string) {
    await this.redis.del(`temp_user:${email}`);
  }

  async saveVerificationCode(email: string, code: string) {
    await this.redis.setex(`verify_code:${email}`, 600, code);
  }

  async getVerificationCode(email: string) {
    return this.redis.get(`verify_code:${email}`);
  }

  async deleteVerificationCode(email: string) {
    await this.redis.del(`verify_code:${email}`);
  }
}

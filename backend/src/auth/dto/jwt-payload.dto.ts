import { IsString, IsNotEmpty } from 'class-validator';

export class JwtPayloadDto {
  sub: string;
  email: string;
  role: string;
  type?: 'access' | 'refresh';
}

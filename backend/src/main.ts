import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join, resolve } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();

  // TODO
  app.useStaticAssets(resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: false,
      stopAtFirstError: false,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();

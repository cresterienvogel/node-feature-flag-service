import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { requestIdMiddleware } from './common/request-id.middleware';
import { LoggingInterceptor } from './common/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(helmet());
  app.use(requestIdMiddleware);
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor());

  const evaluateLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_EVALUATE_WINDOW_MS || 10000),
    max: Number(process.env.RATE_LIMIT_EVALUATE_MAX || 200),
    standardHeaders: true,
    legacyHeaders: false,
  });

  const adminLimiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_ADMIN_WINDOW_MS || 60000),
    max: Number(process.env.RATE_LIMIT_ADMIN_MAX || 60),
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/v1/evaluate', evaluateLimiter);
  app.use('/v1/features', adminLimiter);
  app.use('/v1/api-keys', adminLimiter);
  app.use('/v1/audit', adminLimiter);

  const config = new DocumentBuilder()
    .setTitle('Feature Flag Service')
    .setDescription('Backend API for deterministic feature flags')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'X-API-Key', in: 'header' }, 'apiKey')
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc);

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
}

bootstrap();

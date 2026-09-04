import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser');
import { AppModule } from './app.module';
import { join } from 'path';
import { static as serveStatic } from 'express';

async function bootstrap() {
  // Preserve original bytes for signed payment-provider webhooks.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.use('/media', serveStatic(join(process.cwd(), process.env.ASSET_STORAGE_DIR || 'storage')));

  // ── Security headers (Helmet) ────────────────────────────────────────────
  // Must be applied before CORS so headers are always present
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      // Force HTTPS in production; no-op in dev
      hsts: process.env.NODE_ENV === 'production'
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: true }
        : false,
      // Prevent clickjacking
      frameguard: { action: 'deny' },
      // Disable X-Powered-By: Express
      hidePoweredBy: true,
      // Prevent MIME-type sniffing
      noSniff: true,
      // XSS filter for older browsers
      xssFilter: true,
      // Disable DNS prefetching
      dnsPrefetchControl: { allow: false },
      // Don't send referrer across origins
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    }),
  );

  // ── Cookie parser ────────────────────────────────────────────────────────
  app.use(cookieParser());

  // ── CORS ─────────────────────────────────────────────────────────────────
  // Credentials mode requires an explicit origin (no wildcard)
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With', // used as a lightweight CSRF mitigation signal
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    maxAge: 86_400, // cache preflight for 24 h
  });

  // ── Global validation ────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown properties
      forbidNonWhitelisted: true, // 400 if unknown properties are sent
      transform: true,           // auto-cast primitives (string → number etc.)
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Swagger (dev / staging only) ─────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Jekofit API')
      .setDescription('API documentation for Jekofit shopping platform')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('profile', 'User profile management')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
    console.log(`Swagger documentation available at: http://localhost:${process.env.PORT || 3001}/api-docs`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * Application Entry Point
 *
 * Initializes and configures the NestJS application with:
 * - Fastify adapter for high performance
 * - Global validation pipes with DTO validation
 * - CORS configuration
 * - Error handling middleware
 * - WebSocket/Socket.io support
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create Fastify-based NestJS application
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      bodyLimit: 10485760, // 10MB
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error on non-whitelisted properties
      transform: true, // Transform payloads to DTO class instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      errorHttpStatusCode: 400,
    }),
  );

  // Enable WebSocket support
  app.useWebSocketAdapter(require('socket.io'));

  // Health check endpoint
  app.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));

  // API version endpoint
  app.get('/api/version', () => ({
    version: '1.0.0',
    name: 'Contact Center Training Platform',
    environment: process.env.NODE_ENV || 'development',
  }));

  const port = process.env.PORT || 3001;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  logger.log(
    `Application running on http://${host}:${port}`,
  );
  logger.log(
    `Environment: ${process.env.NODE_ENV || 'development'}`,
  );
  logger.log('WebSocket Gateway: Enabled');
  logger.log('CORS enabled for:', process.env.CORS_ORIGIN);
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});

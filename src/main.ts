import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { Logger as NestLogger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger as PinoLogger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { validateEnv, type Env } from './config/env.schema';
import { setupSwagger } from './shared/presentation/swagger/setup-swagger';

const env: Env = validateEnv(process.env);

const bootstrapLogger = new NestLogger('Bootstrap');

async function bootstrapApi(): Promise<void> {
  const adapter = new FastifyAdapter({ genReqId: () => randomUUID() });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });
  app.useLogger(app.get(PinoLogger));

  app.useGlobalPipes(new ZodValidationPipe());
  app.enableShutdownHooks();

  if (env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  await app.listen(env.PORT, '0.0.0.0');
  bootstrapLogger.log(`api listening on :${env.PORT}`);
}

async function bootstrapWorker(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  bootstrapLogger.warn(
    'worker mode started with no queue processors registered yet — see docs/social-assistant-design-v2.md §12 for build order.',
  );
}

async function bootstrapScheduler(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  app.enableShutdownHooks();
  bootstrapLogger.warn(
    'scheduler mode started with no scheduled jobs registered yet — see docs/social-assistant-design-v2.md §12 for build order.',
  );
}

async function bootstrap(): Promise<void> {
  switch (env.APP_MODE) {
    case 'api':
      await bootstrapApi();
      return;
    case 'worker':
      await bootstrapWorker();
      return;
    case 'scheduler':
      await bootstrapScheduler();
      return;
  }
}

bootstrap().catch((error: unknown) => {
  bootstrapLogger.error(
    'Fatal error during bootstrap',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});

import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

const BULLMQ_REQUIRED_CONNECTION_OPTIONS = { maxRetriesPerRequest: null, lazyConnect: true };

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: new Redis(
          config.getOrThrow<string>('REDIS_URL'),
          BULLMQ_REQUIRED_CONNECTION_OPTIONS,
        ),
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

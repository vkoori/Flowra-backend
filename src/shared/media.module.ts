import { Module } from '@nestjs/common';
import { STORAGE_GATEWAY } from './application/ports/storage-gateway.port';
import { S3StorageGateway } from './infrastructure/adapters/s3-storage-gateway';

@Module({
  providers: [{ provide: STORAGE_GATEWAY, useClass: S3StorageGateway }],
  exports: [STORAGE_GATEWAY],
})
export class MediaModule {}

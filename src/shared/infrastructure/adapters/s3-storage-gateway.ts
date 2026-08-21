import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PresignedDownloadUrlParams,
  PresignedUploadUrlParams,
  StorageGateway,
} from '../../application/ports/storage-gateway.port';

const DEFAULT_EXPIRES_IN_SECONDS = 900;

@Injectable()
export class S3StorageGateway implements StorageGateway {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    this.bucket = configService.getOrThrow<string>('S3_BUCKET');
    this.client = new S3Client({
      endpoint: configService.getOrThrow<string>('S3_ENDPOINT'),
      region: configService.getOrThrow<string>('S3_REGION'),
      forcePathStyle: true,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('S3_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
      },
    });
  }

  async createPresignedUploadUrl(params: PresignedUploadUrlParams): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: params.key,
      ContentType: params.contentType,
    });
    return getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS,
    });
  }

  async createPresignedDownloadUrl(params: PresignedDownloadUrlParams): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: params.key });
    return getSignedUrl(this.client, command, {
      expiresIn: params.expiresInSeconds ?? DEFAULT_EXPIRES_IN_SECONDS,
    });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

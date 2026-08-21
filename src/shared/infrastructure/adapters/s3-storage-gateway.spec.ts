import type { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { S3StorageGateway } from './s3-storage-gateway';

const TEST_CONFIG: Record<string, string> = {
  S3_BUCKET: 'flowra-media-test',
  S3_ENDPOINT: 'http://localhost:8333',
  S3_REGION: 'us-east-1',
  S3_ACCESS_KEY_ID: 'guest',
  S3_SECRET_ACCESS_KEY: 'guest',
};

function makeGateway(): S3StorageGateway {
  const configService = {
    getOrThrow: (key: string) => TEST_CONFIG[key],
  } as unknown as ConfigService;
  return new S3StorageGateway(configService);
}

describe('S3StorageGateway', () => {
  it('creates a presigned upload URL scoped to the configured bucket and key', async () => {
    const gateway = makeGateway();
    const url = await gateway.createPresignedUploadUrl({
      key: 'posts/abc.jpg',
      contentType: 'image/jpeg',
    });

    expect(url).toContain('http://localhost:8333/flowra-media-test/posts/abc.jpg');
    expect(url).toContain('X-Amz-Signature');
  });

  it('creates a presigned download URL scoped to the configured bucket and key', async () => {
    const gateway = makeGateway();
    const url = await gateway.createPresignedDownloadUrl({ key: 'posts/abc.jpg' });

    expect(url).toContain('http://localhost:8333/flowra-media-test/posts/abc.jpg');
    expect(url).toContain('X-Amz-Signature');
  });

  it('respects a custom expiry', async () => {
    const gateway = makeGateway();
    const url = await gateway.createPresignedUploadUrl({
      key: 'posts/abc.jpg',
      contentType: 'image/jpeg',
      expiresInSeconds: 60,
    });

    expect(url).toContain('X-Amz-Expires=60');
  });

  it('sends a DeleteObjectCommand for the configured bucket and key', async () => {
    const gateway = makeGateway();
    const sendSpy = jest.spyOn(S3Client.prototype, 'send').mockResolvedValue({} as never);

    await gateway.deleteObject('posts/abc.jpg');

    expect(sendSpy).toHaveBeenCalledTimes(1);
    const command = sendSpy.mock.calls[0][0] as { input: { Bucket: string; Key: string } };
    expect(command.input).toEqual({ Bucket: 'flowra-media-test', Key: 'posts/abc.jpg' });

    sendSpy.mockRestore();
  });
});

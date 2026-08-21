import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Encryptor } from '../../application/ports/encryptor.port';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

@Injectable()
export class AesGcmEncryptor implements Encryptor {
  private readonly key: Buffer;

  constructor(configService: ConfigService) {
    this.key = Buffer.from(configService.getOrThrow<string>('ENCRYPTION_KEY'), 'hex');
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(
      ':',
    );
  }

  decrypt(ciphertext: string): string {
    const [ivB64, authTagB64, dataB64] = ciphertext.split(':');
    if (!ivB64 || !authTagB64 || !dataB64) {
      throw new Error('Malformed ciphertext.');
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}

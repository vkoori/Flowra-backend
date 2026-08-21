import type { ConfigService } from '@nestjs/config';
import { AesGcmEncryptor } from './aes-gcm-encryptor';

const TEST_KEY = 'a'.repeat(64);

function makeEncryptor(key = TEST_KEY): AesGcmEncryptor {
  const configService = { getOrThrow: () => key } as unknown as ConfigService;
  return new AesGcmEncryptor(configService);
}

describe('AesGcmEncryptor', () => {
  it('round-trips a plaintext through encrypt/decrypt', () => {
    const encryptor = makeEncryptor();
    const ciphertext = encryptor.encrypt('super-secret-access-token');
    expect(encryptor.decrypt(ciphertext)).toBe('super-secret-access-token');
  });

  it('produces a different ciphertext each time for the same plaintext', () => {
    const encryptor = makeEncryptor();
    const first = encryptor.encrypt('same-input');
    const second = encryptor.encrypt('same-input');
    expect(first).not.toBe(second);
  });

  it('throws if the ciphertext has been tampered with', () => {
    const encryptor = makeEncryptor();
    const ciphertext = encryptor.encrypt('do-not-tamper');
    const [iv, authTag, data] = ciphertext.split(':');
    const tamperedData = Buffer.from(data, 'base64');
    tamperedData[0] ^= 0xff;
    const tampered = [iv, authTag, tamperedData.toString('base64')].join(':');

    expect(() => encryptor.decrypt(tampered)).toThrow();
  });

  it('throws on malformed ciphertext', () => {
    const encryptor = makeEncryptor();
    expect(() => encryptor.decrypt('not-a-real-ciphertext')).toThrow('Malformed ciphertext.');
  });
});

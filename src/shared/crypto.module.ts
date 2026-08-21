import { Module } from '@nestjs/common';
import { ENCRYPTOR } from './application/ports/encryptor.port';
import { AesGcmEncryptor } from './infrastructure/adapters/aes-gcm-encryptor';

@Module({
  providers: [{ provide: ENCRYPTOR, useClass: AesGcmEncryptor }],
  exports: [ENCRYPTOR],
})
export class CryptoModule {}

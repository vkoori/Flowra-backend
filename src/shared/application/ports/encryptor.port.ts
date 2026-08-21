export interface Encryptor {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}

export const ENCRYPTOR = Symbol('ENCRYPTOR');

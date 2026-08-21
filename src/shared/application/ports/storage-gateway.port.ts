export interface PresignedUploadUrlParams {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}

export interface PresignedDownloadUrlParams {
  key: string;
  expiresInSeconds?: number;
}

export interface StorageGateway {
  createPresignedUploadUrl(params: PresignedUploadUrlParams): Promise<string>;
  createPresignedDownloadUrl(params: PresignedDownloadUrlParams): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

export const STORAGE_GATEWAY = Symbol('STORAGE_GATEWAY');

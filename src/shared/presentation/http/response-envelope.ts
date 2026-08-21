import { ErrorCode } from '../../domain/errors/error-code.enum';

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface SuccessResponseEnvelope<T> {
  success: true;
  data: T;
  meta: ResponseMeta;
}

export interface ErrorResponseEnvelope {
  success: false;
  error: { code: ErrorCode; message: string };
  meta: ResponseMeta;
}

export function buildResponseMeta(requestId: string): ResponseMeta {
  return { requestId, timestamp: new Date().toISOString() };
}

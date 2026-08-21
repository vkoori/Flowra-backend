import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buildResponseMeta, SuccessResponseEnvelope } from './response-envelope';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponseEnvelope<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponseEnvelope<T>> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
        meta: buildResponseMeta(request.id),
      })),
    );
  }
}

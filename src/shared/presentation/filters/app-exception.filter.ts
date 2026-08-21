import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { I18nContext } from 'nestjs-i18n';
import { AppError } from '../../domain/errors/app.error';
import { ErrorCode } from '../../domain/errors/error-code.enum';
import { buildResponseMeta, ErrorResponseEnvelope } from '../http/response-envelope';

function extractHttpExceptionMessage(response: unknown, fallback: string): string {
  if (typeof response === 'string') return response;
  if (response && typeof response === 'object' && 'message' in response) {
    const { message } = response;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join('; ');
  }
  return fallback;
}

function translateErrorCode(code: ErrorCode, fallback: string): string {
  const i18n = I18nContext.current();
  if (!i18n) return fallback;
  return i18n.t(`errors.${code}`, { defaultValue: fallback });
}

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const meta = buildResponseMeta(request.id);

    if (exception instanceof AppError) {
      const body: ErrorResponseEnvelope = {
        success: false,
        error: {
          code: exception.code,
          message: translateErrorCode(exception.code, exception.message),
        },
        meta,
      };
      reply.status(exception.httpStatus).send(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body: ErrorResponseEnvelope = {
        success: false,
        error: {
          code: ErrorCode.HTTP_EXCEPTION,
          message: extractHttpExceptionMessage(exception.getResponse(), exception.message),
        },
        meta,
      };
      reply.status(status).send(body);
      return;
    }

    this.logger.error(
      'Unhandled exception',
      exception instanceof Error ? exception.stack : String(exception),
    );
    const body: ErrorResponseEnvelope = {
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: translateErrorCode(ErrorCode.INTERNAL_ERROR, 'Internal server error'),
      },
      meta,
    };
    reply.status(500).send(body);
  }
}

import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class DuplicateInboundEventError extends AppError {
  readonly code = ErrorCode.DUPLICATE_INBOUND_EVENT;
  readonly httpStatus = 409;

  constructor(dedupeKey: string) {
    super(`Inbound event with dedupe key "${dedupeKey}" has already been received`);
  }
}

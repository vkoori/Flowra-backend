import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class TenureAlreadyClosedError extends AppError {
  readonly code = ErrorCode.TENURE_ALREADY_CLOSED;
  readonly httpStatus = 409;

  constructor(tenureId: string) {
    super(`Account tenure "${tenureId}" is already closed`);
  }
}

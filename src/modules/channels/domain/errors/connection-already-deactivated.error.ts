import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class ConnectionAlreadyDeactivatedError extends AppError {
  readonly code = ErrorCode.CONNECTION_ALREADY_DEACTIVATED;
  readonly httpStatus = 409;

  constructor(connectionId: string) {
    super(`Channel connection "${connectionId}" is already deactivated`);
  }
}

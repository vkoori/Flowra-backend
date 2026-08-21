import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class TransferAlreadyResolvedError extends AppError {
  readonly code = ErrorCode.TRANSFER_ALREADY_RESOLVED;
  readonly httpStatus = 409;

  constructor(transferId: string) {
    super(`Account transfer "${transferId}" is already resolved`);
  }
}

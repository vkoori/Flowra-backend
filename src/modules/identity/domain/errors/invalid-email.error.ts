import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class InvalidEmailError extends AppError {
  readonly code = ErrorCode.INVALID_EMAIL;
  readonly httpStatus = 400;

  constructor(value: string) {
    super(`Invalid email: "${value}"`);
  }
}

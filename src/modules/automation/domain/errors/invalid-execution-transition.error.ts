import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class InvalidExecutionTransitionError extends AppError {
  readonly code = ErrorCode.INVALID_EXECUTION_TRANSITION;
  readonly httpStatus = 409;

  constructor(fromStatus: string, attemptedTransition: string, hint?: string) {
    super(
      `Execution cannot ${attemptedTransition} while its current status is "${fromStatus}"` +
        (hint ? ` (${hint})` : ''),
    );
  }
}

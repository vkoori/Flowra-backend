import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class FlowSessionAlreadyClosedError extends AppError {
  readonly code = ErrorCode.FLOW_SESSION_ALREADY_CLOSED;
  readonly httpStatus = 409;

  constructor(flowSessionId: string) {
    super(`Flow session "${flowSessionId}" is no longer awaiting input`);
  }
}

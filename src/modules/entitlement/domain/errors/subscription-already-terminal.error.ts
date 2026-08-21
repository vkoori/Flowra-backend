import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class SubscriptionAlreadyTerminalError extends AppError {
  readonly code = ErrorCode.SUBSCRIPTION_ALREADY_TERMINAL;
  readonly httpStatus = 409;

  constructor(subscriptionId: string, currentStatus: string) {
    super(
      `Subscription "${subscriptionId}" cannot transition from its current status "${currentStatus}"`,
    );
  }
}

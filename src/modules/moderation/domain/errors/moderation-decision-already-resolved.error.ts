import { AppError } from '../../../../shared/domain/errors/app.error';
import { ErrorCode } from '../../../../shared/domain/errors/error-code.enum';

export class ModerationDecisionAlreadyResolvedError extends AppError {
  readonly code = ErrorCode.MODERATION_DECISION_ALREADY_RESOLVED;
  readonly httpStatus = 409;

  constructor(moderationDecisionId: string) {
    super(`Moderation decision "${moderationDecisionId}" is already resolved`);
  }
}

import { ModerationDecision as PrismaModerationDecision } from '../../../../../generated/prisma';
import { ModerationDecision } from '../../domain/entities/moderation-decision.entity';

export class ModerationDecisionMapper {
  static toDomain(row: PrismaModerationDecision): ModerationDecision {
    return ModerationDecision.fromPersistence({
      id: row.id,
      eventId: row.eventId,
      state: row.state,
      score: row.score,
      reasons: row.reasons,
      decidedByUserId: row.decidedByUserId,
      decidedAt: row.decidedAt,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(moderationDecision: ModerationDecision): PrismaModerationDecision {
    return {
      id: moderationDecision.id,
      eventId: moderationDecision.eventId,
      state: moderationDecision.state,
      score: moderationDecision.score,
      reasons: moderationDecision.reasons,
      decidedByUserId: moderationDecision.decidedByUserId,
      decidedAt: moderationDecision.decidedAt,
      createdAt: moderationDecision.createdAt,
    };
  }
}

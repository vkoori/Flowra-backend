import { ModerationDecision } from '../entities/moderation-decision.entity';

export interface ModerationDecisionRepository {
  findById(id: string): Promise<ModerationDecision | null>;
  findByEventId(eventId: string): Promise<ModerationDecision | null>;
  save(moderationDecision: ModerationDecision): Promise<void>;
}

export const MODERATION_DECISION_REPOSITORY = Symbol('MODERATION_DECISION_REPOSITORY');

import { randomUUID } from 'node:crypto';
import { ModerationDecisionAlreadyResolvedError } from '../errors/moderation-decision-already-resolved.error';

export type ModerationState = 'pending' | 'approved' | 'restored';

interface ModerationDecisionProps {
  id: string;
  eventId: string;
  state: ModerationState;
  score: number | null;
  reasons: string[];
  decidedByUserId: string | null;
  decidedAt: Date | null;
  createdAt: Date;
}

export class ModerationDecision {
  private constructor(private readonly props: ModerationDecisionProps) {}

  static create(
    props: { eventId: string; score: number | null; reasons: string[] },
    now: Date,
  ): ModerationDecision {
    return new ModerationDecision({
      id: randomUUID(),
      eventId: props.eventId,
      state: 'pending',
      score: props.score,
      reasons: props.reasons,
      decidedByUserId: null,
      decidedAt: null,
      createdAt: now,
    });
  }

  static fromPersistence(props: ModerationDecisionProps): ModerationDecision {
    return new ModerationDecision(props);
  }

  get id(): string {
    return this.props.id;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get state(): ModerationState {
    return this.props.state;
  }

  get score(): number | null {
    return this.props.score;
  }

  get reasons(): string[] {
    return this.props.reasons;
  }

  get decidedByUserId(): string | null {
    return this.props.decidedByUserId;
  }

  get decidedAt(): Date | null {
    return this.props.decidedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  approve(byUserId: string, at: Date): void {
    if (this.props.state !== 'pending') {
      throw new ModerationDecisionAlreadyResolvedError(this.props.id);
    }
    this.props.state = 'approved';
    this.props.decidedByUserId = byUserId;
    this.props.decidedAt = at;
  }

  restore(byUserId: string, at: Date): void {
    if (this.props.state !== 'pending') {
      throw new ModerationDecisionAlreadyResolvedError(this.props.id);
    }
    this.props.state = 'restored';
    this.props.decidedByUserId = byUserId;
    this.props.decidedAt = at;
  }
}

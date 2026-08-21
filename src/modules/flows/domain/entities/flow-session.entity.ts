import { randomUUID } from 'node:crypto';
import { FlowSessionAlreadyClosedError } from '../errors/flow-session-already-closed.error';

export type FlowSessionStatus = 'awaiting' | 'completed' | 'closed' | 'timed_out';

interface FlowSessionProps {
  id: string;
  conversationId: string;
  flowVersionId: string;
  status: FlowSessionStatus;
  currentStepId: string;
  context: Record<string, unknown>;
  repromptCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class FlowSession {
  private constructor(private readonly props: FlowSessionProps) {}

  static create(
    props: {
      conversationId: string;
      flowVersionId: string;
      currentStepId: string;
      context?: Record<string, unknown>;
      expiresAt?: Date | null;
    },
    now: Date,
  ): FlowSession {
    return new FlowSession({
      id: randomUUID(),
      conversationId: props.conversationId,
      flowVersionId: props.flowVersionId,
      status: 'awaiting',
      currentStepId: props.currentStepId,
      context: props.context ?? {},
      repromptCount: 0,
      expiresAt: props.expiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: FlowSessionProps): FlowSession {
    return new FlowSession(props);
  }

  get id(): string {
    return this.props.id;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get flowVersionId(): string {
    return this.props.flowVersionId;
  }

  get status(): FlowSessionStatus {
    return this.props.status;
  }

  get currentStepId(): string {
    return this.props.currentStepId;
  }

  get context(): Record<string, unknown> {
    return this.props.context;
  }

  get repromptCount(): number {
    return this.props.repromptCount;
  }

  get expiresAt(): Date | null {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private assertAwaiting(): void {
    if (this.props.status !== 'awaiting') {
      throw new FlowSessionAlreadyClosedError(this.props.id);
    }
  }

  advanceTo(stepId: string, contextPatch: Record<string, unknown>, at: Date): void {
    this.assertAwaiting();
    this.props.currentStepId = stepId;
    this.props.context = { ...this.props.context, ...contextPatch };
    this.props.updatedAt = at;
  }

  complete(at: Date): void {
    this.assertAwaiting();
    this.props.status = 'completed';
    this.props.updatedAt = at;
  }

  close(at: Date): void {
    this.assertAwaiting();
    this.props.status = 'closed';
    this.props.updatedAt = at;
  }

  expire(at: Date): void {
    this.assertAwaiting();
    this.props.status = 'timed_out';
    this.props.updatedAt = at;
  }

  incrementReprompt(): void {
    this.assertAwaiting();
    this.props.repromptCount += 1;
  }
}

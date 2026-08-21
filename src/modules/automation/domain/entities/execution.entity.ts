import { randomUUID } from 'node:crypto';
import { InvalidExecutionTransitionError } from '../errors/invalid-execution-transition.error';

export type ExecutionOriginType = 'rule' | 'flow';

export type ExecutionStatus =
  'pending' | 'dispatched' | 'running' | 'succeeded' | 'failed' | 'dead_lettered';

export type ExecutionActionParams = Record<string, unknown>;

interface ExecutionProps {
  id: string;
  originType: ExecutionOriginType;
  originId: string;
  eventId: string;
  actionIndex: number;
  status: ExecutionStatus;
  actionType: string;
  actionParams: ExecutionActionParams;
  scheduledAt: Date;
  nextAttemptAt: Date | null;
  attempts: number;
  maxAttempts: number;
  deadLetterReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Execution {
  private constructor(private readonly props: ExecutionProps) {}

  static create(
    props: {
      originType: ExecutionOriginType;
      originId: string;
      eventId: string;
      actionIndex: number;
      actionType: string;
      actionParams: ExecutionActionParams;
      scheduledAt: Date;
      maxAttempts?: number;
    },
    now: Date,
  ): Execution {
    return new Execution({
      id: randomUUID(),
      originType: props.originType,
      originId: props.originId,
      eventId: props.eventId,
      actionIndex: props.actionIndex,
      status: 'pending',
      actionType: props.actionType,
      actionParams: props.actionParams,
      scheduledAt: props.scheduledAt,
      nextAttemptAt: null,
      attempts: 0,
      maxAttempts: props.maxAttempts ?? 5,
      deadLetterReason: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ExecutionProps): Execution {
    return new Execution(props);
  }

  get id(): string {
    return this.props.id;
  }

  get originType(): ExecutionOriginType {
    return this.props.originType;
  }

  get originId(): string {
    return this.props.originId;
  }

  get eventId(): string {
    return this.props.eventId;
  }

  get actionIndex(): number {
    return this.props.actionIndex;
  }

  get status(): ExecutionStatus {
    return this.props.status;
  }

  get actionType(): string {
    return this.props.actionType;
  }

  get actionParams(): ExecutionActionParams {
    return this.props.actionParams;
  }

  get scheduledAt(): Date {
    return this.props.scheduledAt;
  }

  get nextAttemptAt(): Date | null {
    return this.props.nextAttemptAt;
  }

  get attempts(): number {
    return this.props.attempts;
  }

  get maxAttempts(): number {
    return this.props.maxAttempts;
  }

  get deadLetterReason(): string | null {
    return this.props.deadLetterReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  dispatch(at: Date): void {
    if (this.props.status !== 'pending') {
      throw new InvalidExecutionTransitionError(
        this.props.status,
        'dispatch (pending -> dispatched)',
      );
    }
    this.props.status = 'dispatched';
    this.props.updatedAt = at;
  }

  markRunning(at: Date): void {
    if (this.props.status !== 'dispatched') {
      throw new InvalidExecutionTransitionError(
        this.props.status,
        'markRunning (dispatched -> running)',
      );
    }
    this.props.status = 'running';
    this.props.updatedAt = at;
  }

  markSucceeded(at: Date): void {
    if (this.props.status !== 'running') {
      throw new InvalidExecutionTransitionError(
        this.props.status,
        'markSucceeded (running -> succeeded)',
      );
    }
    this.props.status = 'succeeded';
    this.props.updatedAt = at;
  }

  markFailed(at: Date): void {
    if (this.props.status !== 'running') {
      throw new InvalidExecutionTransitionError(
        this.props.status,
        'markFailed (running -> failed)',
      );
    }
    this.props.status = 'failed';
    this.props.updatedAt = at;
  }

  retry(nextAttemptAt: Date): void {
    if (this.props.status !== 'failed') {
      throw new InvalidExecutionTransitionError(this.props.status, 'retry (failed -> pending)');
    }
    if (this.props.attempts >= this.props.maxAttempts) {
      throw new InvalidExecutionTransitionError(
        this.props.status,
        'retry (failed -> pending)',
        `attempts (${this.props.attempts}) has reached maxAttempts (${this.props.maxAttempts}) — call deadLetter() instead`,
      );
    }
    this.props.status = 'pending';
    this.props.attempts += 1;
    this.props.nextAttemptAt = nextAttemptAt;
    this.props.updatedAt = nextAttemptAt;
  }

  deadLetter(reason: string, at: Date): void {
    if (this.props.status !== 'failed') {
      throw new InvalidExecutionTransitionError(
        this.props.status,
        'deadLetter (failed -> dead_lettered)',
      );
    }
    this.props.status = 'dead_lettered';
    this.props.deadLetterReason = reason;
    this.props.updatedAt = at;
  }
}

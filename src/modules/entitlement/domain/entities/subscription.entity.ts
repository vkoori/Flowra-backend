import { randomUUID } from 'node:crypto';
import { SubscriptionAlreadyTerminalError } from '../errors/subscription-already-terminal.error';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled';

interface SubscriptionProps {
  id: string;
  socialAccountId: string;
  planId: string;
  status: SubscriptionStatus;
  purchasedByUserId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  graceUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription {
  private constructor(private readonly props: SubscriptionProps) {}

  static create(
    props: {
      socialAccountId: string;
      planId: string;
      purchasedByUserId: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
    },
    now: Date,
  ): Subscription {
    return new Subscription({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      planId: props.planId,
      status: 'active',
      purchasedByUserId: props.purchasedByUserId,
      currentPeriodStart: props.currentPeriodStart,
      currentPeriodEnd: props.currentPeriodEnd,
      graceUntil: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get planId(): string {
    return this.props.planId;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get purchasedByUserId(): string {
    return this.props.purchasedByUserId;
  }

  get currentPeriodStart(): Date {
    return this.props.currentPeriodStart;
  }

  get currentPeriodEnd(): Date {
    return this.props.currentPeriodEnd;
  }

  get graceUntil(): Date | null {
    return this.props.graceUntil;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  expire(at: Date): void {
    if (this.props.status !== 'active') {
      throw new SubscriptionAlreadyTerminalError(this.props.id, this.props.status);
    }
    this.props.status = 'expired';
    this.props.updatedAt = at;
  }

  cancel(at: Date): void {
    if (this.props.status !== 'active') {
      throw new SubscriptionAlreadyTerminalError(this.props.id, this.props.status);
    }
    this.props.status = 'cancelled';
    this.props.updatedAt = at;
  }

  reactivate(newPeriodStart: Date, newPeriodEnd: Date, at: Date): void {
    if (this.props.status === 'active') {
      throw new SubscriptionAlreadyTerminalError(this.props.id, this.props.status);
    }
    this.props.status = 'active';
    this.props.currentPeriodStart = newPeriodStart;
    this.props.currentPeriodEnd = newPeriodEnd;
    this.props.graceUntil = null;
    this.props.updatedAt = at;
  }

  enterGracePeriod(until: Date): void {
    this.props.graceUntil = until;
  }
}

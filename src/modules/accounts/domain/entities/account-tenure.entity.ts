import { randomUUID } from 'node:crypto';
import { TenureAlreadyClosedError } from '../errors/tenure-already-closed.error';

export type TenureEndReason = 'transferred' | 'revoked' | 'closed_by_owner';

interface AccountTenureProps {
  id: string;
  socialAccountId: string;
  userId: string;
  startedAt: Date;
  endedAt: Date | null;
  endReason: TenureEndReason | null;
  createdAt: Date;
}

export class AccountTenure {
  private constructor(private readonly props: AccountTenureProps) {}

  static create(props: { socialAccountId: string; userId: string }, now: Date): AccountTenure {
    return new AccountTenure({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      userId: props.userId,
      startedAt: now,
      endedAt: null,
      endReason: null,
      createdAt: now,
    });
  }

  static fromPersistence(props: AccountTenureProps): AccountTenure {
    return new AccountTenure(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get startedAt(): Date {
    return this.props.startedAt;
  }

  get endedAt(): Date | null {
    return this.props.endedAt;
  }

  get endReason(): TenureEndReason | null {
    return this.props.endReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  close(reason: TenureEndReason, endedAt: Date): void {
    if (this.props.endedAt !== null) {
      throw new TenureAlreadyClosedError(this.props.id);
    }
    this.props.endedAt = endedAt;
    this.props.endReason = reason;
  }
}

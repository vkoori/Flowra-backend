import { randomUUID } from 'node:crypto';

interface RetentionPolicyProps {
  id: string;
  socialAccountId: string;
  dataClass: string;
  ttlDays: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class RetentionPolicy {
  private constructor(private readonly props: RetentionPolicyProps) {}

  static create(
    props: { socialAccountId: string; dataClass: string; ttlDays: number | null },
    now: Date,
  ): RetentionPolicy {
    return new RetentionPolicy({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      dataClass: props.dataClass,
      ttlDays: props.ttlDays,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: RetentionPolicyProps): RetentionPolicy {
    return new RetentionPolicy(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get dataClass(): string {
    return this.props.dataClass;
  }

  get ttlDays(): number | null {
    return this.props.ttlDays;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateTtl(ttlDays: number | null, at: Date): void {
    this.props.ttlDays = ttlDays;
    this.props.updatedAt = at;
  }
}

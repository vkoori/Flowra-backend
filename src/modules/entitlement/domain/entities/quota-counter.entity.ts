import { randomUUID } from 'node:crypto';

interface QuotaCounterProps {
  id: string;
  socialAccountId: string;
  metric: string;
  periodStart: Date;
  periodEnd: Date;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

export class QuotaCounter {
  private constructor(private readonly props: QuotaCounterProps) {}

  static create(
    props: {
      socialAccountId: string;
      metric: string;
      periodStart: Date;
      periodEnd: Date;
      count?: number;
    },
    now: Date,
  ): QuotaCounter {
    return new QuotaCounter({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      metric: props.metric,
      periodStart: props.periodStart,
      periodEnd: props.periodEnd,
      count: props.count ?? 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: QuotaCounterProps): QuotaCounter {
    return new QuotaCounter(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get metric(): string {
    return this.props.metric;
  }

  get periodStart(): Date {
    return this.props.periodStart;
  }

  get periodEnd(): Date {
    return this.props.periodEnd;
  }

  get count(): number {
    return this.props.count;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  increment(by: number = 1): void {
    this.props.count += by;
  }
}

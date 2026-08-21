import { randomUUID } from 'node:crypto';

interface PlanProps {
  id: string;
  name: string;
  code: string;
  monthlyMessageQuota: number;
  createdAt: Date;
}

export class Plan {
  private constructor(private readonly props: PlanProps) {}

  static create(
    props: { name: string; code: string; monthlyMessageQuota: number },
    now: Date,
  ): Plan {
    return new Plan({
      id: randomUUID(),
      name: props.name,
      code: props.code,
      monthlyMessageQuota: props.monthlyMessageQuota,
      createdAt: now,
    });
  }

  static fromPersistence(props: PlanProps): Plan {
    return new Plan(props);
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get code(): string {
    return this.props.code;
  }

  get monthlyMessageQuota(): number {
    return this.props.monthlyMessageQuota;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

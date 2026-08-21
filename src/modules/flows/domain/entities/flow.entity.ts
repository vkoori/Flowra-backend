import { randomUUID } from 'node:crypto';

interface FlowProps {
  id: string;
  socialAccountId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Flow {
  private constructor(private readonly props: FlowProps) {}

  static create(props: { socialAccountId: string; name: string }, now: Date): Flow {
    return new Flow({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      name: props.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: FlowProps): Flow {
    return new Flow(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(name: string): void {
    this.props.name = name;
  }
}

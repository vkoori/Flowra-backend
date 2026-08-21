import { randomUUID } from 'node:crypto';
import { Email } from '../value-objects/email.vo';

interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(
    props: { email: Email; passwordHash: string; displayName: string },
    now: Date,
  ): User {
    return new User({
      id: randomUUID(),
      email: props.email,
      passwordHash: props.passwordHash,
      displayName: props.displayName,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  rename(displayName: string): void {
    this.props.displayName = displayName;
  }
}

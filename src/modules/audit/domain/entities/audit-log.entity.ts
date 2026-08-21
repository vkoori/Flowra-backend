import { randomUUID } from 'node:crypto';

interface AuditLogProps {
  id: string;
  actorUserId: string | null;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export class AuditLog {
  private constructor(private readonly props: AuditLogProps) {}

  static create(
    props: {
      actorUserId?: string | null;
      action: string;
      targetType: string;
      targetId: string;
      metadata?: Record<string, unknown> | null;
    },
    now: Date,
  ): AuditLog {
    return new AuditLog({
      id: randomUUID(),
      actorUserId: props.actorUserId ?? null,
      action: props.action,
      targetType: props.targetType,
      targetId: props.targetId,
      metadata: props.metadata ?? null,
      createdAt: now,
    });
  }

  static fromPersistence(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  get id(): string {
    return this.props.id;
  }

  get actorUserId(): string | null {
    return this.props.actorUserId;
  }

  get action(): string {
    return this.props.action;
  }

  get targetType(): string {
    return this.props.targetType;
  }

  get targetId(): string {
    return this.props.targetId;
  }

  get metadata(): Record<string, unknown> | null {
    return this.props.metadata;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

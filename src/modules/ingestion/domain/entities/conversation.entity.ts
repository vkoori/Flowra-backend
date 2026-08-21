import { randomUUID } from 'node:crypto';
import { IngestionPlatform } from './inbound-event.entity';

interface ConversationProps {
  id: string;
  tenureId: string;
  platform: IngestionPlatform;
  participantHash: string;
  windowExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  private constructor(private readonly props: ConversationProps) {}

  static create(
    props: {
      tenureId: string;
      platform: IngestionPlatform;
      participantHash: string;
      windowExpiresAt?: Date | null;
    },
    now: Date,
  ): Conversation {
    return new Conversation({
      id: randomUUID(),
      tenureId: props.tenureId,
      platform: props.platform,
      participantHash: props.participantHash,
      windowExpiresAt: props.windowExpiresAt ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ConversationProps): Conversation {
    return new Conversation(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tenureId(): string {
    return this.props.tenureId;
  }

  get platform(): IngestionPlatform {
    return this.props.platform;
  }

  get participantHash(): string {
    return this.props.participantHash;
  }

  get windowExpiresAt(): Date | null {
    return this.props.windowExpiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  refreshWindow(windowExpiresAt: Date): void {
    this.props.windowExpiresAt = windowExpiresAt;
  }
}

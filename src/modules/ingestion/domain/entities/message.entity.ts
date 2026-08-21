import { randomUUID } from 'node:crypto';

export type MessageDirection = 'inbound' | 'outbound';

interface MessageProps {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  inboundEventId: string | null;
  rawText: string;
  normalizedText: string;
  createdAt: Date;
}

export class Message {
  private constructor(private readonly props: MessageProps) {}

  static create(
    props: {
      conversationId: string;
      direction: MessageDirection;
      inboundEventId?: string | null;
      rawText: string;
      normalizedText: string;
    },
    now: Date,
  ): Message {
    return new Message({
      id: randomUUID(),
      conversationId: props.conversationId,
      direction: props.direction,
      inboundEventId: props.inboundEventId ?? null,
      rawText: props.rawText,
      normalizedText: props.normalizedText,
      createdAt: now,
    });
  }

  static fromPersistence(props: MessageProps): Message {
    return new Message(props);
  }

  get id(): string {
    return this.props.id;
  }

  get conversationId(): string {
    return this.props.conversationId;
  }

  get direction(): MessageDirection {
    return this.props.direction;
  }

  get inboundEventId(): string | null {
    return this.props.inboundEventId;
  }

  get rawText(): string {
    return this.props.rawText;
  }

  get normalizedText(): string {
    return this.props.normalizedText;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

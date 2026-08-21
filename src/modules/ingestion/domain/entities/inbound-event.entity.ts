import { randomUUID } from 'node:crypto';

export type IngestionPlatform = 'instagram' | 'telegram';
export type InboundEventType = 'comment_created' | 'dm_received';

interface InboundEventProps {
  id: string;
  tenureId: string;
  socialAccountId: string;
  platform: IngestionPlatform;
  type: InboundEventType;
  externalId: string;
  dedupeKey: string;
  authorExternalId: string;
  authorRefHash: string;
  rawText: string;
  normalizedText: string;
  normalizerVersion: number;
  context: Record<string, unknown> | null;
  occurredAt: Date;
  createdAt: Date;
}

export class InboundEvent {
  private constructor(private readonly props: InboundEventProps) {}

  static create(
    props: {
      tenureId: string;
      socialAccountId: string;
      platform: IngestionPlatform;
      type: InboundEventType;
      externalId: string;
      dedupeKey: string;
      authorExternalId: string;
      authorRefHash: string;
      rawText: string;
      normalizedText: string;
      normalizerVersion: number;
      context?: Record<string, unknown> | null;
      occurredAt: Date;
    },
    now: Date,
  ): InboundEvent {
    return new InboundEvent({
      id: randomUUID(),
      tenureId: props.tenureId,
      socialAccountId: props.socialAccountId,
      platform: props.platform,
      type: props.type,
      externalId: props.externalId,
      dedupeKey: props.dedupeKey,
      authorExternalId: props.authorExternalId,
      authorRefHash: props.authorRefHash,
      rawText: props.rawText,
      normalizedText: props.normalizedText,
      normalizerVersion: props.normalizerVersion,
      context: props.context ?? null,
      occurredAt: props.occurredAt,
      createdAt: now,
    });
  }

  static fromPersistence(props: InboundEventProps): InboundEvent {
    return new InboundEvent(props);
  }

  get id(): string {
    return this.props.id;
  }

  get tenureId(): string {
    return this.props.tenureId;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get platform(): IngestionPlatform {
    return this.props.platform;
  }

  get type(): InboundEventType {
    return this.props.type;
  }

  get externalId(): string {
    return this.props.externalId;
  }

  get dedupeKey(): string {
    return this.props.dedupeKey;
  }

  get authorExternalId(): string {
    return this.props.authorExternalId;
  }

  get authorRefHash(): string {
    return this.props.authorRefHash;
  }

  get rawText(): string {
    return this.props.rawText;
  }

  get normalizedText(): string {
    return this.props.normalizedText;
  }

  get normalizerVersion(): number {
    return this.props.normalizerVersion;
  }

  get context(): Record<string, unknown> | null {
    return this.props.context;
  }

  get occurredAt(): Date {
    return this.props.occurredAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

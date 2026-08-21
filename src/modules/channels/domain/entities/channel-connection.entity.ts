import { randomUUID } from 'node:crypto';
import { ConnectionAlreadyDeactivatedError } from '../errors/connection-already-deactivated.error';

export type ChannelPlatform = 'instagram' | 'telegram';
export type ConnectionStatus = 'active' | 'needs_reauth' | 'revoked';

interface ChannelConnectionProps {
  id: string;
  socialAccountId: string;
  platform: ChannelPlatform;
  accessTokenEncrypted: string;
  refreshTokenEncrypted: string | null;
  tokenExpiresAt: Date | null;
  capabilities: string[];
  status: ConnectionStatus;
  authorizedByUserId: string;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ReauthorizeTokens {
  accessTokenEncrypted: string;
  refreshTokenEncrypted?: string;
  tokenExpiresAt?: Date;
}

export class ChannelConnection {
  private constructor(private readonly props: ChannelConnectionProps) {}

  static create(
    props: {
      socialAccountId: string;
      platform: ChannelPlatform;
      accessTokenEncrypted: string;
      refreshTokenEncrypted?: string;
      tokenExpiresAt?: Date;
      capabilities: string[];
      authorizedByUserId: string;
    },
    now: Date,
  ): ChannelConnection {
    return new ChannelConnection({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      platform: props.platform,
      accessTokenEncrypted: props.accessTokenEncrypted,
      refreshTokenEncrypted: props.refreshTokenEncrypted ?? null,
      tokenExpiresAt: props.tokenExpiresAt ?? null,
      capabilities: props.capabilities,
      status: 'active',
      authorizedByUserId: props.authorizedByUserId,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: ChannelConnectionProps): ChannelConnection {
    return new ChannelConnection(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get platform(): ChannelPlatform {
    return this.props.platform;
  }

  get accessTokenEncrypted(): string {
    return this.props.accessTokenEncrypted;
  }

  get refreshTokenEncrypted(): string | null {
    return this.props.refreshTokenEncrypted;
  }

  get tokenExpiresAt(): Date | null {
    return this.props.tokenExpiresAt;
  }

  get capabilities(): string[] {
    return this.props.capabilities;
  }

  get status(): ConnectionStatus {
    return this.props.status;
  }

  get authorizedByUserId(): string {
    return this.props.authorizedByUserId;
  }

  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  markNeedsReauth(at: Date): void {
    this.assertNotDeactivated();
    this.props.status = 'needs_reauth';
    this.props.updatedAt = at;
  }

  reauthorize(tokens: ReauthorizeTokens, at: Date): void {
    this.assertNotDeactivated();
    this.props.accessTokenEncrypted = tokens.accessTokenEncrypted;
    this.props.refreshTokenEncrypted =
      tokens.refreshTokenEncrypted ?? this.props.refreshTokenEncrypted;
    this.props.tokenExpiresAt = tokens.tokenExpiresAt ?? this.props.tokenExpiresAt;
    this.props.status = 'active';
    this.props.updatedAt = at;
  }

  deactivate(at: Date): void {
    this.assertNotDeactivated();
    this.props.deletedAt = at;
    this.props.status = 'revoked';
    this.props.updatedAt = at;
  }

  private assertNotDeactivated(): void {
    if (this.props.deletedAt !== null) {
      throw new ConnectionAlreadyDeactivatedError(this.props.id);
    }
  }
}

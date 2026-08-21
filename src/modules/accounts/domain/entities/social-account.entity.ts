import { randomUUID } from 'node:crypto';

export type SocialAccountPlatform = 'instagram' | 'telegram';

interface SocialAccountProps {
  id: string;
  platform: SocialAccountPlatform;
  externalAccountId: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SocialAccount {
  private constructor(private readonly props: SocialAccountProps) {}

  static create(
    props: { platform: SocialAccountPlatform; externalAccountId: string; displayName: string },
    now: Date,
  ): SocialAccount {
    return new SocialAccount({
      id: randomUUID(),
      platform: props.platform,
      externalAccountId: props.externalAccountId,
      displayName: props.displayName,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: SocialAccountProps): SocialAccount {
    return new SocialAccount(props);
  }

  get id(): string {
    return this.props.id;
  }

  get platform(): SocialAccountPlatform {
    return this.props.platform;
  }

  get externalAccountId(): string {
    return this.props.externalAccountId;
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
}

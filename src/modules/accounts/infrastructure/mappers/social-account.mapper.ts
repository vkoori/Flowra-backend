import { SocialAccount, SocialAccountPlatform } from '../../domain/entities/social-account.entity';

export interface SocialAccountRow {
  id: string;
  platform: SocialAccountPlatform;
  externalAccountId: string;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SocialAccountMapper {
  static toDomain(row: SocialAccountRow): SocialAccount {
    return SocialAccount.fromPersistence({
      id: row.id,
      platform: row.platform,
      externalAccountId: row.externalAccountId,
      displayName: row.displayName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(socialAccount: SocialAccount): SocialAccountRow {
    return {
      id: socialAccount.id,
      platform: socialAccount.platform,
      externalAccountId: socialAccount.externalAccountId,
      displayName: socialAccount.displayName,
      createdAt: socialAccount.createdAt,
      updatedAt: socialAccount.updatedAt,
    };
  }
}

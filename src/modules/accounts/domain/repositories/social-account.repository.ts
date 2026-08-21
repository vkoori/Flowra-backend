import { SocialAccount, SocialAccountPlatform } from '../entities/social-account.entity';

export interface SocialAccountRepository {
  findById(id: string): Promise<SocialAccount | null>;
  findByPlatformAndExternalId(
    platform: SocialAccountPlatform,
    externalAccountId: string,
  ): Promise<SocialAccount | null>;
  save(socialAccount: SocialAccount): Promise<void>;
}

export const SOCIAL_ACCOUNT_REPOSITORY = Symbol('SOCIAL_ACCOUNT_REPOSITORY');

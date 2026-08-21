import { SocialAccount } from '../../domain/entities/social-account.entity';
import { SocialAccountMapper, SocialAccountRow } from './social-account.mapper';

describe('SocialAccountMapper', () => {
  const row: SocialAccountRow = {
    id: 'social-account-1',
    platform: 'instagram',
    externalAccountId: 'external-1',
    displayName: 'Acme Corp',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  it('maps a row to a domain entity with every field intact', () => {
    const socialAccount = SocialAccountMapper.toDomain(row);

    expect(socialAccount.id).toBe(row.id);
    expect(socialAccount.platform).toBe(row.platform);
    expect(socialAccount.externalAccountId).toBe(row.externalAccountId);
    expect(socialAccount.displayName).toBe(row.displayName);
    expect(socialAccount.createdAt).toBe(row.createdAt);
    expect(socialAccount.updatedAt).toBe(row.updatedAt);
  });

  it('maps a domain entity back to a row with every field intact', () => {
    const socialAccount = SocialAccount.fromPersistence({
      id: row.id,
      platform: row.platform,
      externalAccountId: row.externalAccountId,
      displayName: row.displayName,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    expect(SocialAccountMapper.toPersistence(socialAccount)).toEqual(row);
  });

  it('round-trips a telegram platform value', () => {
    const telegramRow: SocialAccountRow = { ...row, platform: 'telegram' };

    const socialAccount = SocialAccountMapper.toDomain(telegramRow);

    expect(socialAccount.platform).toBe('telegram');
    expect(SocialAccountMapper.toPersistence(socialAccount)).toEqual(telegramRow);
  });
});

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { SocialAccount } from '../../domain/entities/social-account.entity';
import { SocialAccountRow } from '../mappers/social-account.mapper';
import { PrismaSocialAccountRepository } from './prisma-social-account.repository';

function makeRow(): SocialAccountRow {
  return {
    id: 'social-account-1',
    platform: 'instagram',
    externalAccountId: 'external-1',
    displayName: 'Acme Corp',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('PrismaSocialAccountRepository', () => {
  describe('findById', () => {
    it('maps the row to a domain entity when found', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { socialAccount: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaSocialAccountRepository(prisma);

      const result = await repository.findById(row.id);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: row.id } });
      expect(result).toBeInstanceOf(SocialAccount);
      expect(result?.id).toBe(row.id);
    });

    it('returns null when not found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { socialAccount: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaSocialAccountRepository(prisma);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findByPlatformAndExternalId', () => {
    it('queries by the compound platform + externalAccountId key and maps the result', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { socialAccount: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaSocialAccountRepository(prisma);

      const result = await repository.findByPlatformAndExternalId('instagram', 'external-1');

      expect(findUnique).toHaveBeenCalledWith({
        where: {
          platform_externalAccountId: { platform: 'instagram', externalAccountId: 'external-1' },
        },
      });
      expect(result?.externalAccountId).toBe('external-1');
    });

    it('returns null when not found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { socialAccount: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaSocialAccountRepository(prisma);

      await expect(
        repository.findByPlatformAndExternalId('telegram', 'external-2'),
      ).resolves.toBeNull();
    });
  });

  describe('save', () => {
    it('upserts using the entity id as the key with the mapped row as create/update data', async () => {
      const row = makeRow();
      const socialAccount = SocialAccount.fromPersistence(row);
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { socialAccount: { upsert } } as unknown as PrismaService;
      const repository = new PrismaSocialAccountRepository(prisma);

      await repository.save(socialAccount);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: row.id },
        create: row,
        update: row,
      });
    });
  });
});

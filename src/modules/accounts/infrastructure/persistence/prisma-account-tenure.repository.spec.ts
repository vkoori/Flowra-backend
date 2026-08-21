import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AccountTenure } from '../../domain/entities/account-tenure.entity';
import { AccountTenureRow } from '../mappers/account-tenure.mapper';
import { PrismaAccountTenureRepository } from './prisma-account-tenure.repository';

function makeRow(): AccountTenureRow {
  return {
    id: 'tenure-1',
    socialAccountId: 'social-account-1',
    userId: 'user-1',
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    endedAt: null,
    endReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

describe('PrismaAccountTenureRepository', () => {
  describe('findById', () => {
    it('maps the row to a domain entity when found', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { accountTenure: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaAccountTenureRepository(prisma);

      const result = await repository.findById(row.id);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: row.id } });
      expect(result).toBeInstanceOf(AccountTenure);
      expect(result?.id).toBe(row.id);
    });

    it('returns null when not found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { accountTenure: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaAccountTenureRepository(prisma);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findActiveBySocialAccountId', () => {
    it('queries for the open tenure (endedAt: null) on the social account and maps the result', async () => {
      const row = makeRow();
      const findFirst = jest.fn().mockResolvedValue(row);
      const prisma = { accountTenure: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaAccountTenureRepository(prisma);

      const result = await repository.findActiveBySocialAccountId(row.socialAccountId);

      expect(findFirst).toHaveBeenCalledWith({
        where: { socialAccountId: row.socialAccountId, endedAt: null },
      });
      expect(result?.socialAccountId).toBe(row.socialAccountId);
    });

    it('returns null when there is no active tenure', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const prisma = { accountTenure: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaAccountTenureRepository(prisma);

      await expect(repository.findActiveBySocialAccountId('social-account-1')).resolves.toBeNull();
    });
  });

  describe('save', () => {
    it('upserts using the entity id as the key with the mapped row as create/update data', async () => {
      const row = makeRow();
      const accountTenure = AccountTenure.fromPersistence(row);
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { accountTenure: { upsert } } as unknown as PrismaService;
      const repository = new PrismaAccountTenureRepository(prisma);

      await repository.save(accountTenure);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: row.id },
        create: row,
        update: row,
      });
    });

    it('upserts a closed tenure with endedAt/endReason populated', async () => {
      const row: AccountTenureRow = {
        ...makeRow(),
        endedAt: new Date('2026-02-01T00:00:00.000Z'),
        endReason: 'revoked',
      };
      const accountTenure = AccountTenure.fromPersistence(row);
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { accountTenure: { upsert } } as unknown as PrismaService;
      const repository = new PrismaAccountTenureRepository(prisma);

      await repository.save(accountTenure);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: row.id },
        create: row,
        update: row,
      });
    });
  });
});

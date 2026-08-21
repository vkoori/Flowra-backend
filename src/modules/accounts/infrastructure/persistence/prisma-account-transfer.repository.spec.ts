import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AccountTransfer } from '../../domain/entities/account-transfer.entity';
import { AccountTransferRow } from '../mappers/account-transfer.mapper';
import { PrismaAccountTransferRepository } from './prisma-account-transfer.repository';

function makeRow(): AccountTransferRow {
  return {
    id: 'transfer-1',
    socialAccountId: 'social-account-1',
    fromTenureId: 'tenure-1',
    toUserId: 'user-2',
    status: 'pending',
    objectionDeadlineAt: new Date('2026-01-03T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    resolvedAt: null,
  };
}

describe('PrismaAccountTransferRepository', () => {
  describe('findById', () => {
    it('maps the row to a domain entity when found', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { accountTransfer: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaAccountTransferRepository(prisma);

      const result = await repository.findById(row.id);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: row.id } });
      expect(result).toBeInstanceOf(AccountTransfer);
      expect(result?.id).toBe(row.id);
    });

    it('returns null when not found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { accountTransfer: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaAccountTransferRepository(prisma);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findPendingBySocialAccountId', () => {
    it('queries for the most recent pending transfer on the social account and maps the result', async () => {
      const row = makeRow();
      const findFirst = jest.fn().mockResolvedValue(row);
      const prisma = { accountTransfer: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaAccountTransferRepository(prisma);

      const result = await repository.findPendingBySocialAccountId(row.socialAccountId);

      expect(findFirst).toHaveBeenCalledWith({
        where: { socialAccountId: row.socialAccountId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result?.socialAccountId).toBe(row.socialAccountId);
    });

    it('returns null when there is no pending transfer', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const prisma = { accountTransfer: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaAccountTransferRepository(prisma);

      await expect(repository.findPendingBySocialAccountId('social-account-1')).resolves.toBeNull();
    });
  });

  describe('save', () => {
    it('upserts using the entity id as the key with the mapped row as create/update data', async () => {
      const row = makeRow();
      const accountTransfer = AccountTransfer.fromPersistence(row);
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { accountTransfer: { upsert } } as unknown as PrismaService;
      const repository = new PrismaAccountTransferRepository(prisma);

      await repository.save(accountTransfer);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: row.id },
        create: row,
        update: row,
      });
    });

    it('upserts a resolved transfer with status/resolvedAt populated', async () => {
      const row: AccountTransferRow = {
        ...makeRow(),
        status: 'approved',
        resolvedAt: new Date('2026-01-02T00:00:00.000Z'),
      };
      const accountTransfer = AccountTransfer.fromPersistence(row);
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { accountTransfer: { upsert } } as unknown as PrismaService;
      const repository = new PrismaAccountTransferRepository(prisma);

      await repository.save(accountTransfer);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: row.id },
        create: row,
        update: row,
      });
    });
  });
});

import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { RetentionPolicy } from '../../domain/entities/retention-policy.entity';
import { RetentionPolicyRow } from '../mappers/retention-policy.mapper';
import { PrismaRetentionPolicyRepository } from './prisma-retention-policy.repository';

function makeRow(): RetentionPolicyRow {
  return {
    id: 'retention-policy-1',
    socialAccountId: 'social-account-1',
    dataClass: 'conversations',
    ttlDays: 90,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };
}

describe('PrismaRetentionPolicyRepository', () => {
  describe('findById', () => {
    it('maps the row to a domain entity when found', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { retentionPolicy: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaRetentionPolicyRepository(prisma);

      const result = await repository.findById(row.id);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: row.id } });
      expect(result).toBeInstanceOf(RetentionPolicy);
      expect(result?.id).toBe(row.id);
    });

    it('returns null when not found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { retentionPolicy: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaRetentionPolicyRepository(prisma);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findBySocialAccountId', () => {
    it('queries all retention policies for the social account and maps every row', async () => {
      const rows = [makeRow(), { ...makeRow(), id: 'retention-policy-2', ttlDays: null }];
      const findMany = jest.fn().mockResolvedValue(rows);
      const prisma = { retentionPolicy: { findMany } } as unknown as PrismaService;
      const repository = new PrismaRetentionPolicyRepository(prisma);

      const result = await repository.findBySocialAccountId('social-account-1');

      expect(findMany).toHaveBeenCalledWith({ where: { socialAccountId: 'social-account-1' } });
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(RetentionPolicy);
      expect(result[0].ttlDays).toBe(90);
      expect(result[1].ttlDays).toBeNull();
    });

    it('returns an empty array when there are no retention policies', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = { retentionPolicy: { findMany } } as unknown as PrismaService;
      const repository = new PrismaRetentionPolicyRepository(prisma);

      await expect(repository.findBySocialAccountId('social-account-1')).resolves.toEqual([]);
    });
  });

  describe('save', () => {
    it('upserts using the entity id as the key with the mapped row as create/update data', async () => {
      const row = makeRow();
      const retentionPolicy = RetentionPolicy.fromPersistence(row);
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { retentionPolicy: { upsert } } as unknown as PrismaService;
      const repository = new PrismaRetentionPolicyRepository(prisma);

      await repository.save(retentionPolicy);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: row.id },
        create: row,
        update: row,
      });
    });

    it('upserts a retention policy with a null ttlDays (retain forever)', async () => {
      const row: RetentionPolicyRow = { ...makeRow(), ttlDays: null };
      const retentionPolicy = RetentionPolicy.fromPersistence(row);
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { retentionPolicy: { upsert } } as unknown as PrismaService;
      const repository = new PrismaRetentionPolicyRepository(prisma);

      await repository.save(retentionPolicy);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: row.id },
        create: row,
        update: row,
      });
    });
  });
});

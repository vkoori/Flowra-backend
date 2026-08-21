import { QuotaCounter as PrismaQuotaCounter } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { QuotaCounter } from '../../domain/entities/quota-counter.entity';
import { QuotaCounterMapper } from '../mappers/quota-counter.mapper';
import { PrismaQuotaCounterRepository } from './prisma-quota-counter.repository';

function makeRow(): PrismaQuotaCounter {
  return {
    id: 'quota-counter-1',
    socialAccountId: 'social-account-1',
    metric: 'messages_sent',
    periodStart: new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: new Date('2026-02-01T00:00:00.000Z'),
    count: 42,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
  };
}

function makeQuotaCounter(): QuotaCounter {
  return QuotaCounterMapper.toDomain(makeRow());
}

describe('PrismaQuotaCounterRepository', () => {
  describe('findById()', () => {
    it('calls findUnique with the id and maps the result to a domain entity', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { quotaCounter: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaQuotaCounterRepository(prisma);

      const result = await repository.findById('quota-counter-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'quota-counter-1' } });
      expect(result).toEqual(QuotaCounterMapper.toDomain(row));
    });

    it('returns null when Prisma finds no row', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { quotaCounter: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaQuotaCounterRepository(prisma);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findBySocialAccountMetricAndPeriod()', () => {
    it('calls findUnique on the compound unique key', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { quotaCounter: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaQuotaCounterRepository(prisma);
      const periodStart = row.periodStart;

      const result = await repository.findBySocialAccountMetricAndPeriod(
        'social-account-1',
        'messages_sent',
        periodStart,
      );

      expect(findUnique).toHaveBeenCalledWith({
        where: {
          socialAccountId_metric_periodStart: {
            socialAccountId: 'social-account-1',
            metric: 'messages_sent',
            periodStart,
          },
        },
      });
      expect(result).toEqual(QuotaCounterMapper.toDomain(row));
    });

    it('returns null when Prisma finds no row', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { quotaCounter: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaQuotaCounterRepository(prisma);

      await expect(
        repository.findBySocialAccountMetricAndPeriod(
          'social-account-1',
          'messages_sent',
          new Date('2026-01-01T00:00:00.000Z'),
        ),
      ).resolves.toBeNull();
    });
  });

  describe('save()', () => {
    it('upserts by id using the mapped persistence shape for both create and update', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { quotaCounter: { upsert } } as unknown as PrismaService;
      const repository = new PrismaQuotaCounterRepository(prisma);
      const quotaCounter = makeQuotaCounter();
      const data = QuotaCounterMapper.toPersistence(quotaCounter);

      await repository.save(quotaCounter);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: quotaCounter.id },
        create: data,
        update: data,
      });
    });
  });
});

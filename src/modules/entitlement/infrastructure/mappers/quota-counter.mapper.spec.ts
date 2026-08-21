import { QuotaCounter as PrismaQuotaCounter } from '../../../../../generated/prisma';
import { QuotaCounter } from '../../domain/entities/quota-counter.entity';
import { QuotaCounterMapper } from './quota-counter.mapper';

describe('QuotaCounterMapper', () => {
  const row: PrismaQuotaCounter = {
    id: 'quota-counter-1',
    socialAccountId: 'social-account-1',
    metric: 'messages_sent',
    periodStart: new Date('2026-01-01T00:00:00.000Z'),
    periodEnd: new Date('2026-02-01T00:00:00.000Z'),
    count: 42,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-05T00:00:00.000Z'),
  };

  it('maps every field from a Prisma row to the domain entity', () => {
    const quotaCounter = QuotaCounterMapper.toDomain(row);

    expect(quotaCounter.id).toBe(row.id);
    expect(quotaCounter.socialAccountId).toBe(row.socialAccountId);
    expect(quotaCounter.metric).toBe(row.metric);
    expect(quotaCounter.periodStart).toBe(row.periodStart);
    expect(quotaCounter.periodEnd).toBe(row.periodEnd);
    expect(quotaCounter.count).toBe(row.count);
    expect(quotaCounter.createdAt).toBe(row.createdAt);
    expect(quotaCounter.updatedAt).toBe(row.updatedAt);
  });

  it('maps every field from the domain entity to a Prisma create input', () => {
    const quotaCounter = QuotaCounter.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      metric: row.metric,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      count: row.count,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    expect(QuotaCounterMapper.toPersistence(quotaCounter)).toEqual({
      id: row.id,
      socialAccountId: row.socialAccountId,
      metric: row.metric,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      count: row.count,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  });

  it('round-trips domain -> persistence -> domain without losing fields', () => {
    const quotaCounter = QuotaCounterMapper.toDomain(row);
    const persisted = QuotaCounterMapper.toPersistence(quotaCounter);

    expect(
      QuotaCounterMapper.toDomain({
        id: persisted.id as string,
        socialAccountId: persisted.socialAccountId,
        metric: persisted.metric,
        periodStart: persisted.periodStart as Date,
        periodEnd: persisted.periodEnd as Date,
        count: persisted.count as number,
        createdAt: persisted.createdAt as Date,
        updatedAt: persisted.updatedAt as Date,
      }),
    ).toEqual(quotaCounter);
  });
});

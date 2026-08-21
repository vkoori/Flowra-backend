import { Prisma, QuotaCounter as PrismaQuotaCounter } from '../../../../../generated/prisma';
import { QuotaCounter } from '../../domain/entities/quota-counter.entity';

export class QuotaCounterMapper {
  static toDomain(row: PrismaQuotaCounter): QuotaCounter {
    return QuotaCounter.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      metric: row.metric,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      count: row.count,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(quotaCounter: QuotaCounter): Prisma.QuotaCounterCreateInput {
    return {
      id: quotaCounter.id,
      socialAccountId: quotaCounter.socialAccountId,
      metric: quotaCounter.metric,
      periodStart: quotaCounter.periodStart,
      periodEnd: quotaCounter.periodEnd,
      count: quotaCounter.count,
      createdAt: quotaCounter.createdAt,
      updatedAt: quotaCounter.updatedAt,
    };
  }
}

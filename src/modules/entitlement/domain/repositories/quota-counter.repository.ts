import { QuotaCounter } from '../entities/quota-counter.entity';

export interface QuotaCounterRepository {
  findById(id: string): Promise<QuotaCounter | null>;
  findBySocialAccountMetricAndPeriod(
    socialAccountId: string,
    metric: string,
    periodStart: Date,
  ): Promise<QuotaCounter | null>;
  save(quotaCounter: QuotaCounter): Promise<void>;
}

export const QUOTA_COUNTER_REPOSITORY = Symbol('QUOTA_COUNTER_REPOSITORY');

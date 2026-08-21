import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { QuotaCounter } from '../../domain/entities/quota-counter.entity';
import { QuotaCounterRepository } from '../../domain/repositories/quota-counter.repository';
import { QuotaCounterMapper } from '../mappers/quota-counter.mapper';

@Injectable()
export class PrismaQuotaCounterRepository implements QuotaCounterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<QuotaCounter | null> {
    const row = await this.prisma.quotaCounter.findUnique({ where: { id } });
    return row ? QuotaCounterMapper.toDomain(row) : null;
  }

  async findBySocialAccountMetricAndPeriod(
    socialAccountId: string,
    metric: string,
    periodStart: Date,
  ): Promise<QuotaCounter | null> {
    const row = await this.prisma.quotaCounter.findUnique({
      where: { socialAccountId_metric_periodStart: { socialAccountId, metric, periodStart } },
    });
    return row ? QuotaCounterMapper.toDomain(row) : null;
  }

  async save(quotaCounter: QuotaCounter): Promise<void> {
    const data = QuotaCounterMapper.toPersistence(quotaCounter);
    await this.prisma.quotaCounter.upsert({
      where: { id: quotaCounter.id },
      create: data,
      update: data,
    });
  }
}

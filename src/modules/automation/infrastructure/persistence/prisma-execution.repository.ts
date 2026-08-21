import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Execution } from '../../domain/entities/execution.entity';
import { ExecutionRepository } from '../../domain/repositories/execution.repository';
import { ExecutionMapper, RawExecutionRow } from '../mappers/execution.mapper';

@Injectable()
export class PrismaExecutionRepository implements ExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Execution | null> {
    const row = await this.prisma.execution.findUnique({ where: { id } });
    return row ? ExecutionMapper.toDomain(row) : null;
  }

  async save(execution: Execution): Promise<void> {
    const data = ExecutionMapper.toPersistence(execution);
    await this.prisma.execution.upsert({
      where: { id: execution.id },
      create: data,
      update: data,
    });
  }

  async claimBatch(limit: number, now: Date): Promise<Execution[]> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<RawExecutionRow[]>`
        SELECT *
        FROM executions
        WHERE status = 'pending' AND scheduled_at <= ${now}
        ORDER BY scheduled_at
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      `;

      if (rows.length === 0) {
        return [];
      }

      const ids = rows.map((row) => row.id);
      await tx.execution.updateMany({
        where: { id: { in: ids } },
        data: { status: 'dispatched' },
      });

      return rows.map((row) => ExecutionMapper.toDomainFromRaw({ ...row, status: 'dispatched' }));
    });
  }
}

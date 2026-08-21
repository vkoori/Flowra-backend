import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AuditLogMapper } from '../mappers/audit-log.mapper';

@Injectable()
export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<AuditLog | null> {
    const row = await this.prisma.auditLog.findUnique({ where: { id } });
    return row ? AuditLogMapper.toDomain(row) : null;
  }

  async findByTarget(targetType: string, targetId: string): Promise<AuditLog[]> {
    const rows = await this.prisma.auditLog.findMany({
      where: { targetType, targetId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => AuditLogMapper.toDomain(row));
  }

  async create(log: AuditLog): Promise<void> {
    const data = AuditLogMapper.toPersistence(log);
    await this.prisma.auditLog.create({ data });
  }
}

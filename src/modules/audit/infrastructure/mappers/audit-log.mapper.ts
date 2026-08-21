import { AuditLog as PrismaAuditLog, Prisma } from '../../../../../generated/prisma';
import { AuditLog } from '../../domain/entities/audit-log.entity';

export class AuditLogMapper {
  static toDomain(row: PrismaAuditLog): AuditLog {
    return AuditLog.fromPersistence({
      id: row.id,
      actorUserId: row.actorUserId,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      metadata: (row.metadata as Record<string, unknown> | null) ?? null,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(log: AuditLog): Prisma.AuditLogCreateInput {
    return {
      id: log.id,
      actorUserId: log.actorUserId,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      metadata: log.metadata === null ? Prisma.JsonNull : (log.metadata as Prisma.InputJsonValue),
      createdAt: log.createdAt,
    };
  }
}

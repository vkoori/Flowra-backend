import { AuditLog as PrismaAuditLog, Prisma } from '../../../../../generated/prisma';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogMapper } from './audit-log.mapper';

function makeRow(overrides: Partial<PrismaAuditLog> = {}): PrismaAuditLog {
  return {
    id: 'audit-log-1',
    actorUserId: 'user-1',
    action: 'account.transfer.approved',
    targetType: 'AccountTransfer',
    targetId: 'transfer-1',
    metadata: { reason: 'ownership dispute resolved' },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('AuditLogMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a Prisma row to the domain entity', () => {
      const row = makeRow();

      const log = AuditLogMapper.toDomain(row);

      expect(log.id).toBe(row.id);
      expect(log.actorUserId).toBe(row.actorUserId);
      expect(log.action).toBe(row.action);
      expect(log.targetType).toBe(row.targetType);
      expect(log.targetId).toBe(row.targetId);
      expect(log.metadata).toEqual(row.metadata);
      expect(log.createdAt).toBe(row.createdAt);
    });

    it('maps a row with a null actorUserId and null metadata', () => {
      const row = makeRow({ actorUserId: null, metadata: null });

      const log = AuditLogMapper.toDomain(row);

      expect(log.actorUserId).toBeNull();
      expect(log.metadata).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('maps every field from the domain entity to a Prisma create input', () => {
      const row = makeRow();
      const log = AuditLog.fromPersistence({
        id: row.id,
        actorUserId: row.actorUserId,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        metadata: row.metadata as Record<string, unknown>,
        createdAt: row.createdAt,
      });

      expect(AuditLogMapper.toPersistence(log)).toEqual({
        id: row.id,
        actorUserId: row.actorUserId,
        action: row.action,
        targetType: row.targetType,
        targetId: row.targetId,
        metadata: row.metadata,
        createdAt: row.createdAt,
      });
    });

    it('maps a null actorUserId through unchanged', () => {
      const log = AuditLog.fromPersistence({
        id: 'audit-log-2',
        actorUserId: null,
        action: 'execution.dead_lettered',
        targetType: 'Execution',
        targetId: 'execution-1',
        metadata: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      expect(AuditLogMapper.toPersistence(log).actorUserId).toBeNull();
    });

    it('maps a null metadata to Prisma.JsonNull rather than a plain null', () => {
      const log = AuditLog.fromPersistence({
        id: 'audit-log-3',
        actorUserId: 'user-1',
        action: 'execution.dead_lettered',
        targetType: 'Execution',
        targetId: 'execution-1',
        metadata: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      });

      const persisted = AuditLogMapper.toPersistence(log);

      expect(persisted.metadata).toBe(Prisma.JsonNull);
      expect(persisted.metadata).not.toBeNull();
    });
  });

  it('round-trips domain -> persistence -> domain without losing fields', () => {
    const row = makeRow({ metadata: { severity: 'high', reasons: ['blocklist_match'] } });
    const log = AuditLogMapper.toDomain(row);

    const persisted = AuditLogMapper.toPersistence(log);

    expect(AuditLogMapper.toDomain({ ...row, ...persisted } as PrismaAuditLog)).toEqual(log);
  });
});

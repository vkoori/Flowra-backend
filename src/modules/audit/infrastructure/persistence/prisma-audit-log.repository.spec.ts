import { AuditLog as PrismaAuditLog } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AuditLog } from '../../domain/entities/audit-log.entity';
import { AuditLogMapper } from '../mappers/audit-log.mapper';
import { PrismaAuditLogRepository } from './prisma-audit-log.repository';

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

function makeLog(): AuditLog {
  return AuditLog.create(
    {
      actorUserId: 'user-1',
      action: 'account.transfer.approved',
      targetType: 'AccountTransfer',
      targetId: 'transfer-1',
      metadata: { reason: 'ownership dispute resolved' },
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaAuditLogRepository', () => {
  describe('findById', () => {
    it('maps the row to a domain entity when found', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { auditLog: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaAuditLogRepository(prisma);

      const result = await repository.findById('audit-log-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'audit-log-1' } });
      expect(result).toEqual(AuditLogMapper.toDomain(row));
    });

    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { auditLog: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaAuditLogRepository(prisma);

      const result = await repository.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findByTarget', () => {
    it('queries by targetType and targetId, ordered by createdAt ascending, and maps every row', async () => {
      const rows = [makeRow(), makeRow({ id: 'audit-log-2' })];
      const findMany = jest.fn().mockResolvedValue(rows);
      const prisma = { auditLog: { findMany } } as unknown as PrismaService;
      const repository = new PrismaAuditLogRepository(prisma);

      const result = await repository.findByTarget('AccountTransfer', 'transfer-1');

      expect(findMany).toHaveBeenCalledWith({
        where: { targetType: 'AccountTransfer', targetId: 'transfer-1' },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toEqual(rows.map((row) => AuditLogMapper.toDomain(row)));
    });

    it('returns an empty array when there are no matching rows', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = { auditLog: { findMany } } as unknown as PrismaService;
      const repository = new PrismaAuditLogRepository(prisma);

      const result = await repository.findByTarget('AccountTransfer', 'transfer-404');

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('calls prisma.auditLog.create with the mapped persistence shape, never upsert', async () => {
      const create = jest.fn().mockResolvedValue(undefined);
      const upsert = jest.fn();
      const prisma = { auditLog: { create, upsert } } as unknown as PrismaService;
      const repository = new PrismaAuditLogRepository(prisma);
      const log = makeLog();

      await repository.create(log);

      expect(create).toHaveBeenCalledWith({ data: AuditLogMapper.toPersistence(log) });
      expect(create).toHaveBeenCalledTimes(1);
      expect(upsert).not.toHaveBeenCalled();
    });

    it('resolves without a return value', async () => {
      const create = jest.fn().mockResolvedValue(undefined);
      const prisma = { auditLog: { create } } as unknown as PrismaService;
      const repository = new PrismaAuditLogRepository(prisma);

      await expect(repository.create(makeLog())).resolves.toBeUndefined();
    });
  });
});

import { AuditLog } from './audit-log.entity';

describe('AuditLog', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');

  it('creates a log entry with a generated id and the supplied timestamp as createdAt', () => {
    const log = AuditLog.create(
      {
        actorUserId: 'user-1',
        action: 'account.transfer.approved',
        targetType: 'AccountTransfer',
        targetId: 'transfer-1',
        metadata: { reason: 'ownership dispute resolved' },
      },
      now,
    );

    expect(log.id).toBeTruthy();
    expect(log.actorUserId).toBe('user-1');
    expect(log.action).toBe('account.transfer.approved');
    expect(log.targetType).toBe('AccountTransfer');
    expect(log.targetId).toBe('transfer-1');
    expect(log.metadata).toEqual({ reason: 'ownership dispute resolved' });
    expect(log.createdAt).toBe(now);
  });

  it('generates a fresh id per instance', () => {
    const first = AuditLog.create(
      {
        action: 'account.transfer.approved',
        targetType: 'AccountTransfer',
        targetId: 'transfer-1',
      },
      now,
    );
    const second = AuditLog.create(
      {
        action: 'account.transfer.approved',
        targetType: 'AccountTransfer',
        targetId: 'transfer-1',
      },
      now,
    );

    expect(first.id).not.toBe(second.id);
  });

  it('defaults actorUserId to null for system-initiated actions when omitted', () => {
    const log = AuditLog.create(
      { action: 'execution.dead_lettered', targetType: 'Execution', targetId: 'execution-1' },
      now,
    );

    expect(log.actorUserId).toBeNull();
  });

  it('defaults metadata to null when omitted', () => {
    const log = AuditLog.create(
      {
        actorUserId: 'user-1',
        action: 'account.transfer.approved',
        targetType: 'AccountTransfer',
        targetId: 'transfer-1',
      },
      now,
    );

    expect(log.metadata).toBeNull();
  });

  it('rehydrates from persistence without generating a new id or timestamp', () => {
    const log = AuditLog.fromPersistence({
      id: 'existing-id',
      actorUserId: null,
      action: 'account.transfer.approved',
      targetType: 'AccountTransfer',
      targetId: 'transfer-1',
      metadata: null,
      createdAt: now,
    });

    expect(log.id).toBe('existing-id');
    expect(log.createdAt).toBe(now);
  });
});

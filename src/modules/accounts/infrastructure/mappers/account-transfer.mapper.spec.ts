import { AccountTransfer } from '../../domain/entities/account-transfer.entity';
import { AccountTransferMapper, AccountTransferRow } from './account-transfer.mapper';

describe('AccountTransferMapper', () => {
  const pendingRow: AccountTransferRow = {
    id: 'transfer-1',
    socialAccountId: 'social-account-1',
    fromTenureId: 'tenure-1',
    toUserId: 'user-2',
    status: 'pending',
    objectionDeadlineAt: new Date('2026-01-03T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    resolvedAt: null,
  };

  const resolvedRow: AccountTransferRow = {
    ...pendingRow,
    id: 'transfer-2',
    status: 'approved',
    resolvedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const noFromTenureRow: AccountTransferRow = {
    ...pendingRow,
    id: 'transfer-3',
    fromTenureId: null,
  };

  it('maps a pending row to a domain entity, keeping resolvedAt null', () => {
    const transfer = AccountTransferMapper.toDomain(pendingRow);

    expect(transfer.id).toBe(pendingRow.id);
    expect(transfer.socialAccountId).toBe(pendingRow.socialAccountId);
    expect(transfer.fromTenureId).toBe(pendingRow.fromTenureId);
    expect(transfer.toUserId).toBe(pendingRow.toUserId);
    expect(transfer.status).toBe('pending');
    expect(transfer.objectionDeadlineAt).toBe(pendingRow.objectionDeadlineAt);
    expect(transfer.createdAt).toBe(pendingRow.createdAt);
    expect(transfer.resolvedAt).toBeNull();
  });

  it('maps a row with a null fromTenureId to a domain entity', () => {
    const transfer = AccountTransferMapper.toDomain(noFromTenureRow);

    expect(transfer.fromTenureId).toBeNull();
  });

  it('maps a resolved row to a domain entity with resolvedAt populated', () => {
    const transfer = AccountTransferMapper.toDomain(resolvedRow);

    expect(transfer.status).toBe('approved');
    expect(transfer.resolvedAt).toBe(resolvedRow.resolvedAt);
  });

  it('maps a pending domain entity back to a row with nullable fields preserved', () => {
    const transfer = AccountTransfer.fromPersistence({
      id: pendingRow.id,
      socialAccountId: pendingRow.socialAccountId,
      fromTenureId: pendingRow.fromTenureId,
      toUserId: pendingRow.toUserId,
      status: pendingRow.status,
      objectionDeadlineAt: pendingRow.objectionDeadlineAt,
      createdAt: pendingRow.createdAt,
      resolvedAt: pendingRow.resolvedAt,
    });

    expect(AccountTransferMapper.toPersistence(transfer)).toEqual(pendingRow);
  });

  it('maps a domain entity with a null fromTenureId back to a row', () => {
    const transfer = AccountTransfer.fromPersistence({
      id: noFromTenureRow.id,
      socialAccountId: noFromTenureRow.socialAccountId,
      fromTenureId: noFromTenureRow.fromTenureId,
      toUserId: noFromTenureRow.toUserId,
      status: noFromTenureRow.status,
      objectionDeadlineAt: noFromTenureRow.objectionDeadlineAt,
      createdAt: noFromTenureRow.createdAt,
      resolvedAt: noFromTenureRow.resolvedAt,
    });

    expect(AccountTransferMapper.toPersistence(transfer)).toEqual(noFromTenureRow);
  });

  it.each(['pending', 'approved', 'rejected', 'expired'] as const)(
    'round-trips the %s status',
    (status) => {
      const row: AccountTransferRow = { ...resolvedRow, status };

      const transfer = AccountTransferMapper.toDomain(row);

      expect(transfer.status).toBe(status);
      expect(AccountTransferMapper.toPersistence(transfer)).toEqual(row);
    },
  );
});

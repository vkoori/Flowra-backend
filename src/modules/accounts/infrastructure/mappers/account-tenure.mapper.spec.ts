import { AccountTenure } from '../../domain/entities/account-tenure.entity';
import { AccountTenureMapper, AccountTenureRow } from './account-tenure.mapper';

describe('AccountTenureMapper', () => {
  const openRow: AccountTenureRow = {
    id: 'tenure-1',
    socialAccountId: 'social-account-1',
    userId: 'user-1',
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    endedAt: null,
    endReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const closedRow: AccountTenureRow = {
    ...openRow,
    id: 'tenure-2',
    endedAt: new Date('2026-02-01T00:00:00.000Z'),
    endReason: 'transferred',
  };

  it('maps an open row to a domain entity, keeping endedAt/endReason null', () => {
    const tenure = AccountTenureMapper.toDomain(openRow);

    expect(tenure.id).toBe(openRow.id);
    expect(tenure.socialAccountId).toBe(openRow.socialAccountId);
    expect(tenure.userId).toBe(openRow.userId);
    expect(tenure.startedAt).toBe(openRow.startedAt);
    expect(tenure.endedAt).toBeNull();
    expect(tenure.endReason).toBeNull();
    expect(tenure.createdAt).toBe(openRow.createdAt);
  });

  it('maps a closed row to a domain entity, keeping endedAt/endReason populated', () => {
    const tenure = AccountTenureMapper.toDomain(closedRow);

    expect(tenure.endedAt).toBe(closedRow.endedAt);
    expect(tenure.endReason).toBe('transferred');
  });

  it('maps an open domain entity back to a row with nullable fields preserved', () => {
    const tenure = AccountTenure.fromPersistence({
      id: openRow.id,
      socialAccountId: openRow.socialAccountId,
      userId: openRow.userId,
      startedAt: openRow.startedAt,
      endedAt: openRow.endedAt,
      endReason: openRow.endReason,
      createdAt: openRow.createdAt,
    });

    expect(AccountTenureMapper.toPersistence(tenure)).toEqual(openRow);
  });

  it('maps a closed domain entity back to a row with every field intact', () => {
    const tenure = AccountTenure.fromPersistence({
      id: closedRow.id,
      socialAccountId: closedRow.socialAccountId,
      userId: closedRow.userId,
      startedAt: closedRow.startedAt,
      endedAt: closedRow.endedAt,
      endReason: closedRow.endReason,
      createdAt: closedRow.createdAt,
    });

    expect(AccountTenureMapper.toPersistence(tenure)).toEqual(closedRow);
  });

  it.each(['transferred', 'revoked', 'closed_by_owner'] as const)(
    'round-trips the %s end reason',
    (endReason) => {
      const row: AccountTenureRow = {
        ...closedRow,
        endReason,
      };

      const tenure = AccountTenureMapper.toDomain(row);

      expect(tenure.endReason).toBe(endReason);
      expect(AccountTenureMapper.toPersistence(tenure)).toEqual(row);
    },
  );
});

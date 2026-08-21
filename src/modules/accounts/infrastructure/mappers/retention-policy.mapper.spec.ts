import { RetentionPolicy } from '../../domain/entities/retention-policy.entity';
import { RetentionPolicyMapper, RetentionPolicyRow } from './retention-policy.mapper';

describe('RetentionPolicyMapper', () => {
  const row: RetentionPolicyRow = {
    id: 'retention-policy-1',
    socialAccountId: 'social-account-1',
    dataClass: 'conversations',
    ttlDays: 90,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  const noTtlRow: RetentionPolicyRow = { ...row, id: 'retention-policy-2', ttlDays: null };

  it('maps a row with a ttlDays value to a domain entity', () => {
    const retentionPolicy = RetentionPolicyMapper.toDomain(row);

    expect(retentionPolicy.id).toBe(row.id);
    expect(retentionPolicy.socialAccountId).toBe(row.socialAccountId);
    expect(retentionPolicy.dataClass).toBe(row.dataClass);
    expect(retentionPolicy.ttlDays).toBe(90);
    expect(retentionPolicy.createdAt).toBe(row.createdAt);
    expect(retentionPolicy.updatedAt).toBe(row.updatedAt);
  });

  it('maps a row with a null ttlDays (retain forever) to a domain entity', () => {
    const retentionPolicy = RetentionPolicyMapper.toDomain(noTtlRow);

    expect(retentionPolicy.ttlDays).toBeNull();
  });

  it('maps a domain entity with a ttlDays value back to a row', () => {
    const retentionPolicy = RetentionPolicy.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      dataClass: row.dataClass,
      ttlDays: row.ttlDays,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    expect(RetentionPolicyMapper.toPersistence(retentionPolicy)).toEqual(row);
  });

  it('maps a domain entity with a null ttlDays back to a row', () => {
    const retentionPolicy = RetentionPolicy.fromPersistence({
      id: noTtlRow.id,
      socialAccountId: noTtlRow.socialAccountId,
      dataClass: noTtlRow.dataClass,
      ttlDays: noTtlRow.ttlDays,
      createdAt: noTtlRow.createdAt,
      updatedAt: noTtlRow.updatedAt,
    });

    expect(RetentionPolicyMapper.toPersistence(retentionPolicy)).toEqual(noTtlRow);
  });
});

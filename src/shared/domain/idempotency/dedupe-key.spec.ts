import { buildDedupeKey } from './dedupe-key';

describe('buildDedupeKey', () => {
  it('produces a 64-character hex SHA-256 digest', () => {
    const key = buildDedupeKey({ platform: 'instagram', accountId: 'acct-1' });
    expect(key).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic regardless of key insertion order', () => {
    const a = buildDedupeKey({ platform: 'instagram', accountId: 'acct-1', externalId: 'ext-42' });
    const b = buildDedupeKey({ externalId: 'ext-42', platform: 'instagram', accountId: 'acct-1' });
    expect(a).toBe(b);
  });

  it('produces different keys for different attribute values', () => {
    const a = buildDedupeKey({ platform: 'instagram', externalId: 'ext-42' });
    const b = buildDedupeKey({ platform: 'instagram', externalId: 'ext-43' });
    expect(a).not.toBe(b);
  });

  it('produces different keys when an attribute is missing entirely', () => {
    const a = buildDedupeKey({ platform: 'instagram', externalId: 'ext-42' });
    const b = buildDedupeKey({ platform: 'instagram' });
    expect(a).not.toBe(b);
  });
});

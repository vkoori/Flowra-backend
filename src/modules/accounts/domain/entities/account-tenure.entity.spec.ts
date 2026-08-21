import { AccountTenure } from './account-tenure.entity';
import { TenureAlreadyClosedError } from '../errors/tenure-already-closed.error';

describe('AccountTenure', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  function createOpenTenure(): AccountTenure {
    return AccountTenure.create({ socialAccountId: 'social-account-1', userId: 'user-1' }, now);
  }

  it('has no endedAt/endReason when created', () => {
    const tenure = createOpenTenure();

    expect(tenure.endedAt).toBeNull();
    expect(tenure.endReason).toBeNull();
  });

  it('closes an open tenure, recording the end reason and timestamp', () => {
    const tenure = createOpenTenure();
    const endedAt = new Date('2026-02-01T00:00:00.000Z');

    tenure.close('transferred', endedAt);

    expect(tenure.endedAt).toBe(endedAt);
    expect(tenure.endReason).toBe('transferred');
  });

  it('throws TenureAlreadyClosedError when closing an already-closed tenure', () => {
    const tenure = createOpenTenure();
    tenure.close('revoked', new Date('2026-02-01T00:00:00.000Z'));

    expect(() => tenure.close('closed_by_owner', new Date('2026-03-01T00:00:00.000Z'))).toThrow(
      TenureAlreadyClosedError,
    );
  });
});

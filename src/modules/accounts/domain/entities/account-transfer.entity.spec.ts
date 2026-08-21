import { AccountTransfer } from './account-transfer.entity';
import { TransferAlreadyResolvedError } from '../errors/transfer-already-resolved.error';

describe('AccountTransfer', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  function createPendingTransfer(): AccountTransfer {
    return AccountTransfer.create(
      {
        socialAccountId: 'social-account-1',
        fromTenureId: 'tenure-1',
        toUserId: 'user-2',
        objectionDeadlineAt: new Date('2026-01-03T00:00:00.000Z'),
      },
      now,
    );
  }

  it('starts pending, with no resolvedAt', () => {
    const transfer = createPendingTransfer();

    expect(transfer.status).toBe('pending');
    expect(transfer.resolvedAt).toBeNull();
  });

  describe('approve', () => {
    it('transitions pending -> approved, recording resolvedAt', () => {
      const transfer = createPendingTransfer();
      const resolvedAt = new Date('2026-01-02T00:00:00.000Z');

      transfer.approve(resolvedAt);

      expect(transfer.status).toBe('approved');
      expect(transfer.resolvedAt).toBe(resolvedAt);
    });

    it('throws TransferAlreadyResolvedError when called again', () => {
      const transfer = createPendingTransfer();
      transfer.approve(new Date('2026-01-02T00:00:00.000Z'));

      expect(() => transfer.approve(new Date('2026-01-02T00:00:00.000Z'))).toThrow(
        TransferAlreadyResolvedError,
      );
    });
  });

  describe('reject', () => {
    it('transitions pending -> rejected, recording resolvedAt', () => {
      const transfer = createPendingTransfer();
      const resolvedAt = new Date('2026-01-02T00:00:00.000Z');

      transfer.reject(resolvedAt);

      expect(transfer.status).toBe('rejected');
      expect(transfer.resolvedAt).toBe(resolvedAt);
    });

    it('throws TransferAlreadyResolvedError when called again', () => {
      const transfer = createPendingTransfer();
      transfer.reject(new Date('2026-01-02T00:00:00.000Z'));

      expect(() => transfer.reject(new Date('2026-01-02T00:00:00.000Z'))).toThrow(
        TransferAlreadyResolvedError,
      );
    });
  });

  describe('expire', () => {
    it('transitions pending -> expired, recording resolvedAt', () => {
      const transfer = createPendingTransfer();
      const resolvedAt = new Date('2026-01-03T00:00:00.000Z');

      transfer.expire(resolvedAt);

      expect(transfer.status).toBe('expired');
      expect(transfer.resolvedAt).toBe(resolvedAt);
    });

    it('throws TransferAlreadyResolvedError when called again', () => {
      const transfer = createPendingTransfer();
      transfer.expire(new Date('2026-01-03T00:00:00.000Z'));

      expect(() => transfer.expire(new Date('2026-01-03T00:00:00.000Z'))).toThrow(
        TransferAlreadyResolvedError,
      );
    });
  });

  it('throws TransferAlreadyResolvedError when a resolved transfer is resolved via a different method', () => {
    const transfer = createPendingTransfer();
    transfer.approve(new Date('2026-01-02T00:00:00.000Z'));

    expect(() => transfer.reject(new Date('2026-01-02T00:00:00.000Z'))).toThrow(
      TransferAlreadyResolvedError,
    );
  });
});

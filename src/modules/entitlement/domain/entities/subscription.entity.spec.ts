import { SubscriptionAlreadyTerminalError } from '../errors/subscription-already-terminal.error';
import { Subscription } from './subscription.entity';

describe('Subscription', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');
  const later = new Date('2026-09-21T00:00:00.000Z');

  const createActive = (): Subscription =>
    Subscription.create(
      {
        socialAccountId: 'social-account-1',
        planId: 'plan-1',
        purchasedByUserId: 'user-1',
        currentPeriodStart: now,
        currentPeriodEnd: later,
      },
      now,
    );

  describe('expire()', () => {
    it('transitions from active to expired', () => {
      const subscription = createActive();

      subscription.expire(later);

      expect(subscription.status).toBe('expired');
      expect(subscription.updatedAt).toBe(later);
    });

    it('throws SubscriptionAlreadyTerminalError when called a second time', () => {
      const subscription = createActive();
      subscription.expire(later);

      expect(() => subscription.expire(later)).toThrow(SubscriptionAlreadyTerminalError);
    });

    it('throws SubscriptionAlreadyTerminalError when the subscription is already cancelled', () => {
      const subscription = createActive();
      subscription.cancel(later);

      expect(() => subscription.expire(later)).toThrow(SubscriptionAlreadyTerminalError);
    });
  });

  describe('cancel()', () => {
    it('transitions from active to cancelled', () => {
      const subscription = createActive();

      subscription.cancel(later);

      expect(subscription.status).toBe('cancelled');
      expect(subscription.updatedAt).toBe(later);
    });

    it('throws SubscriptionAlreadyTerminalError when called a second time', () => {
      const subscription = createActive();
      subscription.cancel(later);

      expect(() => subscription.cancel(later)).toThrow(SubscriptionAlreadyTerminalError);
    });

    it('throws SubscriptionAlreadyTerminalError when the subscription is already expired', () => {
      const subscription = createActive();
      subscription.expire(later);

      expect(() => subscription.cancel(later)).toThrow(SubscriptionAlreadyTerminalError);
    });
  });

  describe('reactivate()', () => {
    it('succeeds from expired, moving back to active and clearing graceUntil', () => {
      const subscription = createActive();
      subscription.expire(later);
      subscription.enterGracePeriod(later);

      const newStart = later;
      const newEnd = new Date('2026-10-21T00:00:00.000Z');
      subscription.reactivate(newStart, newEnd, newEnd);

      expect(subscription.status).toBe('active');
      expect(subscription.currentPeriodStart).toBe(newStart);
      expect(subscription.currentPeriodEnd).toBe(newEnd);
      expect(subscription.graceUntil).toBeNull();
      expect(subscription.updatedAt).toBe(newEnd);
    });

    it('succeeds from cancelled, moving back to active', () => {
      const subscription = createActive();
      subscription.cancel(later);

      const newStart = later;
      const newEnd = new Date('2026-10-21T00:00:00.000Z');
      subscription.reactivate(newStart, newEnd, newEnd);

      expect(subscription.status).toBe('active');
    });

    it('throws SubscriptionAlreadyTerminalError when already active', () => {
      const subscription = createActive();

      expect(() => subscription.reactivate(now, later, now)).toThrow(
        SubscriptionAlreadyTerminalError,
      );
    });
  });

  describe('enterGracePeriod()', () => {
    it('sets graceUntil without changing status', () => {
      const subscription = createActive();

      subscription.enterGracePeriod(later);

      expect(subscription.graceUntil).toBe(later);
      expect(subscription.status).toBe('active');
    });
  });
});

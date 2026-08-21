import { Subscription as PrismaSubscription } from '../../../../../generated/prisma';
import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionMapper } from './subscription.mapper';

describe('SubscriptionMapper', () => {
  const baseRow: PrismaSubscription = {
    id: 'subscription-1',
    socialAccountId: 'social-account-1',
    planId: 'plan-1',
    status: 'active',
    purchasedByUserId: 'user-1',
    currentPeriodStart: new Date('2026-01-01T00:00:00.000Z'),
    currentPeriodEnd: new Date('2026-02-01T00:00:00.000Z'),
    graceUntil: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  describe('toDomain()', () => {
    it('maps every field, including a null graceUntil', () => {
      const subscription = SubscriptionMapper.toDomain(baseRow);

      expect(subscription.id).toBe(baseRow.id);
      expect(subscription.socialAccountId).toBe(baseRow.socialAccountId);
      expect(subscription.planId).toBe(baseRow.planId);
      expect(subscription.status).toBe('active');
      expect(subscription.purchasedByUserId).toBe(baseRow.purchasedByUserId);
      expect(subscription.currentPeriodStart).toBe(baseRow.currentPeriodStart);
      expect(subscription.currentPeriodEnd).toBe(baseRow.currentPeriodEnd);
      expect(subscription.graceUntil).toBeNull();
      expect(subscription.createdAt).toBe(baseRow.createdAt);
      expect(subscription.updatedAt).toBe(baseRow.updatedAt);
    });

    it('maps a populated graceUntil', () => {
      const graceUntil = new Date('2026-02-08T00:00:00.000Z');
      const subscription = SubscriptionMapper.toDomain({ ...baseRow, graceUntil });

      expect(subscription.graceUntil).toBe(graceUntil);
    });

    it.each(['active', 'expired', 'cancelled'] as const)('maps status %s', (status) => {
      const subscription = SubscriptionMapper.toDomain({ ...baseRow, status });

      expect(subscription.status).toBe(status);
    });
  });

  describe('toPersistence()', () => {
    it('maps every field, connecting the plan relation by id', () => {
      const subscription = Subscription.fromPersistence({
        id: baseRow.id,
        socialAccountId: baseRow.socialAccountId,
        planId: baseRow.planId,
        status: 'active',
        purchasedByUserId: baseRow.purchasedByUserId,
        currentPeriodStart: baseRow.currentPeriodStart,
        currentPeriodEnd: baseRow.currentPeriodEnd,
        graceUntil: null,
        createdAt: baseRow.createdAt,
        updatedAt: baseRow.updatedAt,
      });

      expect(SubscriptionMapper.toPersistence(subscription)).toEqual({
        id: baseRow.id,
        socialAccountId: baseRow.socialAccountId,
        plan: { connect: { id: baseRow.planId } },
        status: 'active',
        purchasedByUserId: baseRow.purchasedByUserId,
        currentPeriodStart: baseRow.currentPeriodStart,
        currentPeriodEnd: baseRow.currentPeriodEnd,
        graceUntil: null,
        createdAt: baseRow.createdAt,
        updatedAt: baseRow.updatedAt,
      });
    });

    it('carries a populated graceUntil through', () => {
      const graceUntil = new Date('2026-02-08T00:00:00.000Z');
      const subscription = Subscription.fromPersistence({
        id: baseRow.id,
        socialAccountId: baseRow.socialAccountId,
        planId: baseRow.planId,
        status: 'expired',
        purchasedByUserId: baseRow.purchasedByUserId,
        currentPeriodStart: baseRow.currentPeriodStart,
        currentPeriodEnd: baseRow.currentPeriodEnd,
        graceUntil,
        createdAt: baseRow.createdAt,
        updatedAt: baseRow.updatedAt,
      });

      expect(SubscriptionMapper.toPersistence(subscription).graceUntil).toBe(graceUntil);
      expect(SubscriptionMapper.toPersistence(subscription).status).toBe('expired');
    });
  });
});

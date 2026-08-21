import { Subscription as PrismaSubscription } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionMapper } from '../mappers/subscription.mapper';
import { PrismaSubscriptionRepository } from './prisma-subscription.repository';

function makeRow(): PrismaSubscription {
  return {
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
}

function makeSubscription(): Subscription {
  return SubscriptionMapper.toDomain(makeRow());
}

describe('PrismaSubscriptionRepository', () => {
  describe('findById()', () => {
    it('calls findUnique with the id and maps the result to a domain entity', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { subscription: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaSubscriptionRepository(prisma);

      const result = await repository.findById('subscription-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'subscription-1' } });
      expect(result).toEqual(SubscriptionMapper.toDomain(row));
    });

    it('returns null when Prisma finds no row', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { subscription: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaSubscriptionRepository(prisma);

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findActiveBySocialAccountId()', () => {
    it('calls findFirst filtering by socialAccountId and the active status', async () => {
      const row = makeRow();
      const findFirst = jest.fn().mockResolvedValue(row);
      const prisma = { subscription: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaSubscriptionRepository(prisma);

      const result = await repository.findActiveBySocialAccountId('social-account-1');

      expect(findFirst).toHaveBeenCalledWith({
        where: { socialAccountId: 'social-account-1', status: 'active' },
      });
      expect(result).toEqual(SubscriptionMapper.toDomain(row));
    });

    it('returns null when there is no active subscription', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const prisma = { subscription: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaSubscriptionRepository(prisma);

      await expect(repository.findActiveBySocialAccountId('social-account-1')).resolves.toBeNull();
    });
  });

  describe('save()', () => {
    it('upserts by id using the mapped persistence shape for both create and update', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { subscription: { upsert } } as unknown as PrismaService;
      const repository = new PrismaSubscriptionRepository(prisma);
      const subscription = makeSubscription();
      const data = SubscriptionMapper.toPersistence(subscription);

      await repository.save(subscription);

      expect(upsert).toHaveBeenCalledWith({
        where: { id: subscription.id },
        create: data,
        update: data,
      });
    });
  });
});

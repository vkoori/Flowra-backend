import { Prisma, Subscription as PrismaSubscription } from '../../../../../generated/prisma';
import { Subscription } from '../../domain/entities/subscription.entity';

export class SubscriptionMapper {
  static toDomain(row: PrismaSubscription): Subscription {
    return Subscription.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      planId: row.planId,
      status: row.status,
      purchasedByUserId: row.purchasedByUserId,
      currentPeriodStart: row.currentPeriodStart,
      currentPeriodEnd: row.currentPeriodEnd,
      graceUntil: row.graceUntil,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(subscription: Subscription): Prisma.SubscriptionCreateInput {
    return {
      id: subscription.id,
      socialAccountId: subscription.socialAccountId,
      plan: { connect: { id: subscription.planId } },
      status: subscription.status,
      purchasedByUserId: subscription.purchasedByUserId,
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      graceUntil: subscription.graceUntil,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}

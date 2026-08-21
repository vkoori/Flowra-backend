import { Subscription } from '../entities/subscription.entity';

export interface SubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findActiveBySocialAccountId(socialAccountId: string): Promise<Subscription | null>;
  save(subscription: Subscription): Promise<void>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');

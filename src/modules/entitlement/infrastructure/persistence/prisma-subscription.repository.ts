import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Subscription } from '../../domain/entities/subscription.entity';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';
import { SubscriptionMapper } from '../mappers/subscription.mapper';

@Injectable()
export class PrismaSubscriptionRepository implements SubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { id } });
    return row ? SubscriptionMapper.toDomain(row) : null;
  }

  async findActiveBySocialAccountId(socialAccountId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findFirst({
      where: { socialAccountId, status: 'active' },
    });
    return row ? SubscriptionMapper.toDomain(row) : null;
  }

  async save(subscription: Subscription): Promise<void> {
    const data = SubscriptionMapper.toPersistence(subscription);
    await this.prisma.subscription.upsert({
      where: { id: subscription.id },
      create: data,
      update: data,
    });
  }
}

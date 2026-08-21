import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ModerationDecision } from '../../domain/entities/moderation-decision.entity';
import { ModerationDecisionRepository } from '../../domain/repositories/moderation-decision.repository';
import { ModerationDecisionMapper } from '../mappers/moderation-decision.mapper';

@Injectable()
export class PrismaModerationDecisionRepository implements ModerationDecisionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<ModerationDecision | null> {
    const row = await this.prisma.moderationDecision.findUnique({ where: { id } });
    return row ? ModerationDecisionMapper.toDomain(row) : null;
  }

  async findByEventId(eventId: string): Promise<ModerationDecision | null> {
    const row = await this.prisma.moderationDecision.findUnique({ where: { eventId } });
    return row ? ModerationDecisionMapper.toDomain(row) : null;
  }

  async save(moderationDecision: ModerationDecision): Promise<void> {
    const data = ModerationDecisionMapper.toPersistence(moderationDecision);
    await this.prisma.moderationDecision.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}

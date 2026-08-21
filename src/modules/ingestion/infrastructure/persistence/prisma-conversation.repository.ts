import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Conversation } from '../../domain/entities/conversation.entity';
import { IngestionPlatform } from '../../domain/entities/inbound-event.entity';
import { ConversationRepository } from '../../domain/repositories/conversation.repository';
import { ConversationMapper } from '../mappers/conversation.mapper';

@Injectable()
export class PrismaConversationRepository implements ConversationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findUnique({ where: { id } });
    return row ? ConversationMapper.toDomain(row) : null;
  }

  async findByTenureAndParticipantHash(
    tenureId: string,
    platform: IngestionPlatform,
    participantHash: string,
  ): Promise<Conversation | null> {
    const row = await this.prisma.conversation.findFirst({
      where: { tenureId, platform, participantHash },
    });
    return row ? ConversationMapper.toDomain(row) : null;
  }

  async save(conversation: Conversation): Promise<void> {
    const data = ConversationMapper.toPersistence(conversation);
    await this.prisma.conversation.upsert({
      where: { id: conversation.id },
      create: data,
      update: data,
    });
  }
}

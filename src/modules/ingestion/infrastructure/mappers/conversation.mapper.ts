import { Conversation as PrismaConversation, Prisma } from '../../../../../generated/prisma';
import { Conversation } from '../../domain/entities/conversation.entity';

export class ConversationMapper {
  static toDomain(row: PrismaConversation): Conversation {
    return Conversation.fromPersistence({
      id: row.id,
      tenureId: row.tenureId,
      platform: row.platform,
      participantHash: row.participantHash,
      windowExpiresAt: row.windowExpiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(conversation: Conversation): Prisma.ConversationCreateInput {
    return {
      id: conversation.id,
      tenureId: conversation.tenureId,
      platform: conversation.platform,
      participantHash: conversation.participantHash,
      windowExpiresAt: conversation.windowExpiresAt,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };
  }
}

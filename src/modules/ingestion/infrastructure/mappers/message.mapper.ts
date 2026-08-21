import { Message as PrismaMessage, Prisma } from '../../../../../generated/prisma';
import { Message, MessageDirection } from '../../domain/entities/message.entity';

export class MessageMapper {
  static toDomain(row: PrismaMessage): Message {
    return Message.fromPersistence({
      id: row.id,
      conversationId: row.conversationId,
      direction: row.direction as MessageDirection,
      inboundEventId: row.inboundEventId,
      rawText: row.rawText,
      normalizedText: row.normalizedText,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(message: Message): Prisma.MessageUncheckedCreateInput {
    return {
      id: message.id,
      conversationId: message.conversationId,
      direction: message.direction,
      inboundEventId: message.inboundEventId,
      rawText: message.rawText,
      normalizedText: message.normalizedText,
      createdAt: message.createdAt,
    };
  }
}

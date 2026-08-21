import { Message as PrismaMessage } from '../../../../../generated/prisma';
import { Message } from '../../domain/entities/message.entity';
import { MessageMapper } from './message.mapper';

function makeRow(overrides: Partial<PrismaMessage> = {}): PrismaMessage {
  return {
    id: 'message-1',
    conversationId: 'conversation-1',
    direction: 'inbound',
    inboundEventId: 'event-1',
    rawText: 'hello',
    normalizedText: 'hello',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('MessageMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a persistence row', () => {
      const row = makeRow();

      const message = MessageMapper.toDomain(row);

      expect(message.id).toBe(row.id);
      expect(message.conversationId).toBe(row.conversationId);
      expect(message.direction).toBe(row.direction);
      expect(message.inboundEventId).toBe(row.inboundEventId);
      expect(message.rawText).toBe(row.rawText);
      expect(message.normalizedText).toBe(row.normalizedText);
      expect(message.createdAt).toBe(row.createdAt);
    });

    it('maps a null inboundEventId (outbound message)', () => {
      const row = makeRow({ direction: 'outbound', inboundEventId: null });

      const message = MessageMapper.toDomain(row);

      expect(message.direction).toBe('outbound');
      expect(message.inboundEventId).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('maps every field to a Prisma create input', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const message = Message.create(
        {
          conversationId: 'conversation-1',
          direction: 'inbound',
          inboundEventId: 'event-1',
          rawText: 'hello',
          normalizedText: 'hello',
        },
        now,
      );

      const data = MessageMapper.toPersistence(message);

      expect(data).toEqual({
        id: message.id,
        conversationId: message.conversationId,
        direction: message.direction,
        inboundEventId: message.inboundEventId,
        rawText: message.rawText,
        normalizedText: message.normalizedText,
        createdAt: message.createdAt,
      });
    });

    it('maps a null inboundEventId for an outbound message', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const message = Message.create(
        {
          conversationId: 'conversation-1',
          direction: 'outbound',
          rawText: 'hi there',
          normalizedText: 'hi there',
        },
        now,
      );

      const data = MessageMapper.toPersistence(message);

      expect(data.inboundEventId).toBeNull();
    });
  });
});

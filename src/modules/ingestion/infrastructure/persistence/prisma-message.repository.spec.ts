import { Message as PrismaMessage } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Message } from '../../domain/entities/message.entity';
import { PrismaMessageRepository } from './prisma-message.repository';

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

function makeMessage(): Message {
  return Message.create(
    {
      conversationId: 'conversation-1',
      direction: 'inbound',
      inboundEventId: 'event-1',
      rawText: 'hello',
      normalizedText: 'hello',
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaMessageRepository', () => {
  describe('findById', () => {
    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { message: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaMessageRepository(prisma);

      const result = await repository.findById('missing-id');

      expect(result).toBeNull();
      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'missing-id' } });
    });

    it('maps a found row to a domain Message', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { message: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaMessageRepository(prisma);

      const result = await repository.findById(row.id);

      expect(result).toBeInstanceOf(Message);
      expect(result?.id).toBe(row.id);
    });
  });

  describe('findByConversationId', () => {
    it('calls findMany with the conversationId and returns an empty array', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = { message: { findMany } } as unknown as PrismaService;
      const repository = new PrismaMessageRepository(prisma);

      const result = await repository.findByConversationId('conversation-1');

      expect(result).toEqual([]);
      expect(findMany).toHaveBeenCalledWith({
        where: { conversationId: 'conversation-1' },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('maps every found row to a domain Message', async () => {
      const rows = [makeRow({ id: 'message-1' }), makeRow({ id: 'message-2' })];
      const findMany = jest.fn().mockResolvedValue(rows);
      const prisma = { message: { findMany } } as unknown as PrismaService;
      const repository = new PrismaMessageRepository(prisma);

      const result = await repository.findByConversationId('conversation-1');

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Message);
      expect(result.map((message) => message.id)).toEqual(['message-1', 'message-2']);
    });
  });

  describe('create', () => {
    it('creates the message (no upsert/update path)', async () => {
      const create = jest.fn().mockResolvedValue(undefined);
      const prisma = { message: { create } } as unknown as PrismaService;
      const repository = new PrismaMessageRepository(prisma);
      const message = makeMessage();

      await repository.create(message);

      expect(create).toHaveBeenCalledTimes(1);
      const call = create.mock.calls[0][0];
      expect(call.data.id).toBe(message.id);
      expect(call.data.conversationId).toBe(message.conversationId);
    });
  });
});

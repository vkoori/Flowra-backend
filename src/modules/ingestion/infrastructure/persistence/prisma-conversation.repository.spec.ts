import { Conversation as PrismaConversation } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Conversation } from '../../domain/entities/conversation.entity';
import { PrismaConversationRepository } from './prisma-conversation.repository';

function makeRow(overrides: Partial<PrismaConversation> = {}): PrismaConversation {
  return {
    id: 'conversation-1',
    tenureId: 'tenure-1',
    platform: 'instagram',
    participantHash: 'participant-hash-1',
    windowExpiresAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:01.000Z'),
    ...overrides,
  };
}

function makeConversation(): Conversation {
  return Conversation.create(
    {
      tenureId: 'tenure-1',
      platform: 'instagram',
      participantHash: 'participant-hash-1',
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaConversationRepository', () => {
  describe('findById', () => {
    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { conversation: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaConversationRepository(prisma);

      const result = await repository.findById('missing-id');

      expect(result).toBeNull();
      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'missing-id' } });
    });

    it('maps a found row to a domain Conversation', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { conversation: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaConversationRepository(prisma);

      const result = await repository.findById(row.id);

      expect(result).toBeInstanceOf(Conversation);
      expect(result?.id).toBe(row.id);
    });
  });

  describe('findByTenureAndParticipantHash', () => {
    it('calls findFirst with the tenure, platform, and participant hash', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const prisma = { conversation: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaConversationRepository(prisma);

      const result = await repository.findByTenureAndParticipantHash(
        'tenure-1',
        'instagram',
        'participant-hash-1',
      );

      expect(result).toBeNull();
      expect(findFirst).toHaveBeenCalledWith({
        where: {
          tenureId: 'tenure-1',
          platform: 'instagram',
          participantHash: 'participant-hash-1',
        },
      });
    });

    it('maps a found row to a domain Conversation', async () => {
      const row = makeRow();
      const findFirst = jest.fn().mockResolvedValue(row);
      const prisma = { conversation: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaConversationRepository(prisma);

      const result = await repository.findByTenureAndParticipantHash(
        row.tenureId,
        row.platform,
        row.participantHash,
      );

      expect(result).toBeInstanceOf(Conversation);
      expect(result?.participantHash).toBe(row.participantHash);
    });
  });

  describe('save', () => {
    it('upserts the conversation by id', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { conversation: { upsert } } as unknown as PrismaService;
      const repository = new PrismaConversationRepository(prisma);
      const conversation = makeConversation();

      await repository.save(conversation);

      expect(upsert).toHaveBeenCalledTimes(1);
      const call = upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: conversation.id });
      expect(call.create).toEqual(call.update);
      expect(call.create.id).toBe(conversation.id);
    });
  });
});

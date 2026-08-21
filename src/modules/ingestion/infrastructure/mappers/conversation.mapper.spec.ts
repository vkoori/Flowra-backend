import { Conversation as PrismaConversation } from '../../../../../generated/prisma';
import { Conversation } from '../../domain/entities/conversation.entity';
import { ConversationMapper } from './conversation.mapper';

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

describe('ConversationMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a persistence row', () => {
      const row = makeRow();

      const conversation = ConversationMapper.toDomain(row);

      expect(conversation.id).toBe(row.id);
      expect(conversation.tenureId).toBe(row.tenureId);
      expect(conversation.platform).toBe(row.platform);
      expect(conversation.participantHash).toBe(row.participantHash);
      expect(conversation.windowExpiresAt).toBeNull();
      expect(conversation.createdAt).toBe(row.createdAt);
      expect(conversation.updatedAt).toBe(row.updatedAt);
    });

    it('maps a non-null windowExpiresAt', () => {
      const windowExpiresAt = new Date('2026-01-02T00:00:00.000Z');
      const row = makeRow({ windowExpiresAt });

      const conversation = ConversationMapper.toDomain(row);

      expect(conversation.windowExpiresAt).toBe(windowExpiresAt);
    });
  });

  describe('toPersistence', () => {
    it('maps every field to a Prisma create input', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const conversation = Conversation.create(
        {
          tenureId: 'tenure-1',
          platform: 'instagram',
          participantHash: 'participant-hash-1',
        },
        now,
      );

      const data = ConversationMapper.toPersistence(conversation);

      expect(data).toEqual({
        id: conversation.id,
        tenureId: conversation.tenureId,
        platform: conversation.platform,
        participantHash: conversation.participantHash,
        windowExpiresAt: null,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      });
    });

    it('maps a non-null windowExpiresAt', () => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const windowExpiresAt = new Date('2026-01-02T00:00:00.000Z');
      const conversation = Conversation.create(
        {
          tenureId: 'tenure-1',
          platform: 'telegram',
          participantHash: 'participant-hash-2',
          windowExpiresAt,
        },
        now,
      );

      const data = ConversationMapper.toPersistence(conversation);

      expect(data.windowExpiresAt).toBe(windowExpiresAt);
    });
  });
});

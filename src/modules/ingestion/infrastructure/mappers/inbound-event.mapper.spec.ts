import { InboundEvent as PrismaInboundEvent, Prisma } from '../../../../../generated/prisma';
import { InboundEvent } from '../../domain/entities/inbound-event.entity';
import { InboundEventMapper } from './inbound-event.mapper';

function makeRow(overrides: Partial<PrismaInboundEvent> = {}): PrismaInboundEvent {
  return {
    id: 'event-1',
    tenureId: 'tenure-1',
    socialAccountId: 'social-account-1',
    platform: 'instagram',
    type: 'comment_created',
    externalId: 'external-1',
    dedupeKey: 'dedupe-1',
    authorExternalId: 'author-1',
    authorRefHash: 'author-hash-1',
    rawText: 'hello world',
    normalizedText: 'hello world',
    normalizerVersion: 1,
    context: null,
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:01.000Z'),
    ...overrides,
  };
}

describe('InboundEventMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a persistence row', () => {
      const row = makeRow();

      const event = InboundEventMapper.toDomain(row);

      expect(event.id).toBe(row.id);
      expect(event.tenureId).toBe(row.tenureId);
      expect(event.socialAccountId).toBe(row.socialAccountId);
      expect(event.platform).toBe(row.platform);
      expect(event.type).toBe(row.type);
      expect(event.externalId).toBe(row.externalId);
      expect(event.dedupeKey).toBe(row.dedupeKey);
      expect(event.authorExternalId).toBe(row.authorExternalId);
      expect(event.authorRefHash).toBe(row.authorRefHash);
      expect(event.rawText).toBe(row.rawText);
      expect(event.normalizedText).toBe(row.normalizedText);
      expect(event.normalizerVersion).toBe(row.normalizerVersion);
      expect(event.context).toBeNull();
      expect(event.occurredAt).toBe(row.occurredAt);
      expect(event.createdAt).toBe(row.createdAt);
    });

    it('maps a non-null JSON context', () => {
      const context = { commentId: 'abc', mentions: ['x', 'y'] };
      const row = makeRow({ context });

      const event = InboundEventMapper.toDomain(row);

      expect(event.context).toEqual(context);
    });
  });

  describe('toPersistence', () => {
    it('maps every field to a Prisma create input', () => {
      const event = InboundEvent.create(
        {
          tenureId: 'tenure-1',
          socialAccountId: 'social-account-1',
          platform: 'instagram',
          type: 'comment_created',
          externalId: 'external-1',
          dedupeKey: 'dedupe-1',
          authorExternalId: 'author-1',
          authorRefHash: 'author-hash-1',
          rawText: 'hello world',
          normalizedText: 'hello world',
          normalizerVersion: 1,
          occurredAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        new Date('2026-01-01T00:00:01.000Z'),
      );

      const data = InboundEventMapper.toPersistence(event);

      expect(data).toEqual({
        id: event.id,
        tenureId: event.tenureId,
        socialAccountId: event.socialAccountId,
        platform: event.platform,
        type: event.type,
        externalId: event.externalId,
        dedupeKey: event.dedupeKey,
        authorExternalId: event.authorExternalId,
        authorRefHash: event.authorRefHash,
        rawText: event.rawText,
        normalizedText: event.normalizedText,
        normalizerVersion: event.normalizerVersion,
        context: Prisma.JsonNull,
        occurredAt: event.occurredAt,
        createdAt: event.createdAt,
      });
    });

    it('maps a non-null JSON context to its raw value', () => {
      const context = { commentId: 'abc' };
      const event = InboundEvent.create(
        {
          tenureId: 'tenure-1',
          socialAccountId: 'social-account-1',
          platform: 'telegram',
          type: 'dm_received',
          externalId: 'external-2',
          dedupeKey: 'dedupe-2',
          authorExternalId: 'author-2',
          authorRefHash: 'author-hash-2',
          rawText: 'hi',
          normalizedText: 'hi',
          normalizerVersion: 1,
          context,
          occurredAt: new Date('2026-01-01T00:00:00.000Z'),
        },
        new Date('2026-01-01T00:00:01.000Z'),
      );

      const data = InboundEventMapper.toPersistence(event);

      expect(data.context).toEqual(context);
    });
  });
});

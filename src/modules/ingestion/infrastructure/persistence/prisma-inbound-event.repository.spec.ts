import { InboundEvent as PrismaInboundEventRow, Prisma } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { DuplicateInboundEventError } from '../../domain/errors/duplicate-inbound-event.error';
import { InboundEvent } from '../../domain/entities/inbound-event.entity';
import { PrismaInboundEventRepository } from './prisma-inbound-event.repository';

function makeEvent(): InboundEvent {
  return InboundEvent.create(
    {
      tenureId: 'tenure-1',
      socialAccountId: 'social-account-1',
      platform: 'instagram',
      type: 'comment_created',
      externalId: 'external-1',
      dedupeKey: 'dedupe-1',
      authorExternalId: 'author-1',
      authorRefHash: 'author-hash-1',
      rawText: 'hello',
      normalizedText: 'hello',
      normalizerVersion: 1,
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

function makeRow(overrides: Partial<PrismaInboundEventRow> = {}): PrismaInboundEventRow {
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
    rawText: 'hello',
    normalizedText: 'hello',
    normalizerVersion: 1,
    context: null,
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:01.000Z'),
    ...overrides,
  };
}

describe('PrismaInboundEventRepository', () => {
  describe('findById', () => {
    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { inboundEvent: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaInboundEventRepository(prisma);

      const result = await repository.findById('missing-id');

      expect(result).toBeNull();
      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'missing-id' } });
    });

    it('maps a found row to a domain InboundEvent', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { inboundEvent: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaInboundEventRepository(prisma);

      const result = await repository.findById(row.id);

      expect(result).toBeInstanceOf(InboundEvent);
      expect(result?.id).toBe(row.id);
    });
  });

  describe('findByDedupeKey', () => {
    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { inboundEvent: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaInboundEventRepository(prisma);

      const result = await repository.findByDedupeKey('missing-dedupe-key');

      expect(result).toBeNull();
      expect(findUnique).toHaveBeenCalledWith({ where: { dedupeKey: 'missing-dedupe-key' } });
    });

    it('maps a found row to a domain InboundEvent', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { inboundEvent: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaInboundEventRepository(prisma);

      const result = await repository.findByDedupeKey(row.dedupeKey);

      expect(result).toBeInstanceOf(InboundEvent);
      expect(result?.dedupeKey).toBe(row.dedupeKey);
    });
  });

  it('resolves on a normal create', async () => {
    const create = jest.fn().mockResolvedValue(undefined);
    const prisma = { inboundEvent: { create } } as unknown as PrismaService;
    const repository = new PrismaInboundEventRepository(prisma);

    await expect(repository.create(makeEvent())).resolves.toBeUndefined();
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('rethrows DuplicateInboundEventError when the dedupe key already exists', async () => {
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });
    const create = jest.fn().mockRejectedValue(uniqueViolation);
    const prisma = { inboundEvent: { create } } as unknown as PrismaService;
    const repository = new PrismaInboundEventRepository(prisma);

    await expect(repository.create(makeEvent())).rejects.toThrow(DuplicateInboundEventError);
  });

  it('rethrows an unrelated error unchanged', async () => {
    const otherError = new Error('connection reset');
    const create = jest.fn().mockRejectedValue(otherError);
    const prisma = { inboundEvent: { create } } as unknown as PrismaService;
    const repository = new PrismaInboundEventRepository(prisma);

    await expect(repository.create(makeEvent())).rejects.toBe(otherError);
  });
});

import { ModerationDecision as PrismaModerationDecision } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { ModerationDecision } from '../../domain/entities/moderation-decision.entity';
import { PrismaModerationDecisionRepository } from './prisma-moderation-decision.repository';

function makeRow(overrides: Partial<PrismaModerationDecision> = {}): PrismaModerationDecision {
  return {
    id: 'moderation-decision-1',
    eventId: 'event-1',
    state: 'pending',
    score: 0.92,
    reasons: ['blocklist_match'],
    decidedByUserId: null,
    decidedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeDecision(): ModerationDecision {
  return ModerationDecision.create(
    { eventId: 'event-2', score: 0.5, reasons: ['link_detected'] },
    new Date('2026-08-21T00:00:00.000Z'),
  );
}

describe('PrismaModerationDecisionRepository', () => {
  describe('findById', () => {
    it('calls findUnique with an id where clause and maps the row', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { moderationDecision: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaModerationDecisionRepository(prisma);

      const decision = await repository.findById('moderation-decision-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'moderation-decision-1' } });
      expect(decision?.id).toBe(row.id);
      expect(decision?.eventId).toBe(row.eventId);
      expect(decision?.score).toBe(row.score);
      expect(decision?.reasons).toEqual(row.reasons);
    });

    it('returns null when Prisma returns null', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { moderationDecision: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaModerationDecisionRepository(prisma);

      const decision = await repository.findById('missing-id');

      expect(decision).toBeNull();
    });
  });

  describe('findByEventId', () => {
    it('calls findUnique with an eventId where clause and maps the row', async () => {
      const row = makeRow();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { moderationDecision: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaModerationDecisionRepository(prisma);

      const decision = await repository.findByEventId('event-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { eventId: 'event-1' } });
      expect(decision?.eventId).toBe(row.eventId);
    });

    it('returns null when Prisma returns null', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { moderationDecision: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaModerationDecisionRepository(prisma);

      const decision = await repository.findByEventId('missing-event');

      expect(decision).toBeNull();
    });
  });

  describe('save', () => {
    it('upserts using the decision id, with matching create/update payloads', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { moderationDecision: { upsert } } as unknown as PrismaService;
      const repository = new PrismaModerationDecisionRepository(prisma);
      const decision = makeDecision();

      await repository.save(decision);

      expect(upsert).toHaveBeenCalledTimes(1);
      const call = upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: decision.id });
      expect(call.create).toEqual(call.update);
      expect(call.create).toEqual({
        id: decision.id,
        eventId: decision.eventId,
        state: decision.state,
        score: decision.score,
        reasons: decision.reasons,
        decidedByUserId: decision.decidedByUserId,
        decidedAt: decision.decidedAt,
        createdAt: decision.createdAt,
      });
    });

    it('upserts a resolved decision with decidedByUserId and decidedAt set', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { moderationDecision: { upsert } } as unknown as PrismaService;
      const repository = new PrismaModerationDecisionRepository(prisma);
      const decision = makeDecision();
      decision.approve('manager-1', new Date('2026-08-22T00:00:00.000Z'));

      await repository.save(decision);

      const call = upsert.mock.calls[0][0];
      expect(call.create.state).toBe('approved');
      expect(call.create.decidedByUserId).toBe('manager-1');
      expect(call.create.decidedAt).toEqual(new Date('2026-08-22T00:00:00.000Z'));
    });
  });
});

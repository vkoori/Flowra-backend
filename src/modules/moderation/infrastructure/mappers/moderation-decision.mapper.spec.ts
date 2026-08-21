import { ModerationDecision as PrismaModerationDecision } from '../../../../../generated/prisma';
import { ModerationDecision } from '../../domain/entities/moderation-decision.entity';
import { ModerationDecisionMapper } from './moderation-decision.mapper';

function makeRow(overrides: Partial<PrismaModerationDecision> = {}): PrismaModerationDecision {
  return {
    id: 'moderation-decision-1',
    eventId: 'event-1',
    state: 'pending',
    score: 0.92,
    reasons: ['blocklist_match', 'link_detected'],
    decidedByUserId: null,
    decidedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ModerationDecisionMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a Prisma row to the domain entity', () => {
      const row = makeRow();

      const decision = ModerationDecisionMapper.toDomain(row);

      expect(decision.id).toBe(row.id);
      expect(decision.eventId).toBe(row.eventId);
      expect(decision.state).toBe(row.state);
      expect(decision.score).toBe(row.score);
      expect(decision.reasons).toEqual(row.reasons);
      expect(decision.decidedByUserId).toBeNull();
      expect(decision.decidedAt).toBeNull();
      expect(decision.createdAt).toBe(row.createdAt);
    });

    it('maps a resolved row, including score null and nullable decision fields set', () => {
      const row = makeRow({
        state: 'approved',
        score: null,
        reasons: [],
        decidedByUserId: 'manager-1',
        decidedAt: new Date('2026-01-02T00:00:00.000Z'),
      });

      const decision = ModerationDecisionMapper.toDomain(row);

      expect(decision.state).toBe('approved');
      expect(decision.score).toBeNull();
      expect(decision.reasons).toEqual([]);
      expect(decision.decidedByUserId).toBe('manager-1');
      expect(decision.decidedAt).toBe(row.decidedAt);
    });
  });

  describe('toPersistence', () => {
    it('maps every field from the domain entity to a Prisma row', () => {
      const row = makeRow();
      const decision = ModerationDecision.fromPersistence({
        id: row.id,
        eventId: row.eventId,
        state: row.state,
        score: row.score,
        reasons: row.reasons,
        decidedByUserId: row.decidedByUserId,
        decidedAt: row.decidedAt,
        createdAt: row.createdAt,
      });

      expect(ModerationDecisionMapper.toPersistence(decision)).toEqual(row);
    });

    it('maps nullable score, decidedByUserId, and decidedAt when unset', () => {
      const row = makeRow({ score: null, decidedByUserId: null, decidedAt: null });
      const decision = ModerationDecisionMapper.toDomain(row);

      expect(ModerationDecisionMapper.toPersistence(decision)).toEqual(row);
    });
  });

  it('round-trips domain -> persistence -> domain without losing fields', () => {
    const row = makeRow({
      state: 'restored',
      score: 0.4,
      reasons: ['repetition_detected'],
      decidedByUserId: 'manager-2',
      decidedAt: new Date('2026-01-03T00:00:00.000Z'),
    });
    const decision = ModerationDecisionMapper.toDomain(row);

    const persisted = ModerationDecisionMapper.toPersistence(decision);

    expect(ModerationDecisionMapper.toDomain(persisted)).toEqual(decision);
  });
});

import { ModerationDecision } from './moderation-decision.entity';
import { ModerationDecisionAlreadyResolvedError } from '../errors/moderation-decision-already-resolved.error';

describe('ModerationDecision', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');

  function createPendingDecision(): ModerationDecision {
    return ModerationDecision.create(
      { eventId: 'event-1', score: 0.92, reasons: ['blocklist_match'] },
      now,
    );
  }

  it('is pending with no decider when created', () => {
    const decision = createPendingDecision();

    expect(decision.state).toBe('pending');
    expect(decision.decidedByUserId).toBeNull();
    expect(decision.decidedAt).toBeNull();
  });

  it('approves a pending decision, recording who decided and when', () => {
    const decision = createPendingDecision();
    const decidedAt = new Date('2026-01-02T00:00:00.000Z');

    decision.approve('manager-1', decidedAt);

    expect(decision.state).toBe('approved');
    expect(decision.decidedByUserId).toBe('manager-1');
    expect(decision.decidedAt).toBe(decidedAt);
  });

  it('restores a pending decision, recording who decided and when', () => {
    const decision = createPendingDecision();
    const decidedAt = new Date('2026-01-02T00:00:00.000Z');

    decision.restore('manager-1', decidedAt);

    expect(decision.state).toBe('restored');
    expect(decision.decidedByUserId).toBe('manager-1');
    expect(decision.decidedAt).toBe(decidedAt);
  });

  it('throws ModerationDecisionAlreadyResolvedError when approving an already-approved decision', () => {
    const decision = createPendingDecision();
    decision.approve('manager-1', new Date('2026-01-02T00:00:00.000Z'));

    expect(() => decision.approve('manager-2', new Date('2026-01-03T00:00:00.000Z'))).toThrow(
      ModerationDecisionAlreadyResolvedError,
    );
  });

  it('throws ModerationDecisionAlreadyResolvedError when restoring an already-restored decision', () => {
    const decision = createPendingDecision();
    decision.restore('manager-1', new Date('2026-01-02T00:00:00.000Z'));

    expect(() => decision.restore('manager-2', new Date('2026-01-03T00:00:00.000Z'))).toThrow(
      ModerationDecisionAlreadyResolvedError,
    );
  });

  it('throws ModerationDecisionAlreadyResolvedError when restoring an already-approved decision', () => {
    const decision = createPendingDecision();
    decision.approve('manager-1', new Date('2026-01-02T00:00:00.000Z'));

    expect(() => decision.restore('manager-2', new Date('2026-01-03T00:00:00.000Z'))).toThrow(
      ModerationDecisionAlreadyResolvedError,
    );
  });
});

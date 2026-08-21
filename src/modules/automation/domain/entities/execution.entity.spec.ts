import { InvalidExecutionTransitionError } from '../errors/invalid-execution-transition.error';
import { Execution } from './execution.entity';

describe('Execution', () => {
  const t0 = new Date('2026-08-21T00:00:00.000Z');
  const t1 = new Date('2026-08-21T00:01:00.000Z');
  const t2 = new Date('2026-08-21T00:02:00.000Z');
  const t3 = new Date('2026-08-21T00:03:00.000Z');

  const createExecution = (maxAttempts = 5): Execution =>
    Execution.create(
      {
        originType: 'rule',
        originId: 'rule-1',
        eventId: 'event-1',
        actionIndex: 0,
        actionType: 'send_dm',
        actionParams: {},
        scheduledAt: t0,
        maxAttempts,
      },
      t0,
    );

  describe('happy path', () => {
    it('goes pending -> dispatched -> running -> succeeded', () => {
      const execution = createExecution();

      execution.dispatch(t1);
      expect(execution.status).toBe('dispatched');
      expect(execution.updatedAt).toBe(t1);

      execution.markRunning(t2);
      expect(execution.status).toBe('running');
      expect(execution.updatedAt).toBe(t2);

      execution.markSucceeded(t3);
      expect(execution.status).toBe('succeeded');
      expect(execution.updatedAt).toBe(t3);
    });
  });

  describe('retry()', () => {
    it('transitions failed -> pending and increments attempts', () => {
      const execution = createExecution();
      execution.dispatch(t1);
      execution.markRunning(t2);
      execution.markFailed(t3);

      expect(execution.attempts).toBe(0);

      const nextAttemptAt = new Date('2026-08-21T00:05:00.000Z');
      execution.retry(nextAttemptAt);

      expect(execution.status).toBe('pending');
      expect(execution.attempts).toBe(1);
      expect(execution.nextAttemptAt).toBe(nextAttemptAt);
    });

    it('throws InvalidExecutionTransitionError once attempts >= maxAttempts', () => {
      const execution = createExecution(1);
      execution.dispatch(t1);
      execution.markRunning(t2);
      execution.markFailed(t3);
      execution.retry(new Date('2026-08-21T00:05:00.000Z'));

      // second failure — attempts (1) has now reached maxAttempts (1)
      execution.dispatch(new Date('2026-08-21T00:06:00.000Z'));
      execution.markRunning(new Date('2026-08-21T00:07:00.000Z'));
      execution.markFailed(new Date('2026-08-21T00:08:00.000Z'));

      expect(() => execution.retry(new Date('2026-08-21T00:09:00.000Z'))).toThrow(
        InvalidExecutionTransitionError,
      );
    });

    it('throws InvalidExecutionTransitionError when status is not failed', () => {
      const execution = createExecution();

      expect(() => execution.retry(t1)).toThrow(InvalidExecutionTransitionError);
    });
  });

  describe('deadLetter()', () => {
    it('transitions failed -> dead_lettered and records the reason', () => {
      const execution = createExecution();
      execution.dispatch(t1);
      execution.markRunning(t2);
      execution.markFailed(t3);

      const deadLetteredAt = new Date('2026-08-21T00:10:00.000Z');
      execution.deadLetter('max attempts exceeded', deadLetteredAt);

      expect(execution.status).toBe('dead_lettered');
      expect(execution.deadLetterReason).toBe('max attempts exceeded');
      expect(execution.updatedAt).toBe(deadLetteredAt);
    });

    it('throws InvalidExecutionTransitionError when status is not failed', () => {
      const execution = createExecution();

      expect(() => execution.deadLetter('reason', t1)).toThrow(InvalidExecutionTransitionError);
    });
  });

  describe('invalid transitions from the wrong starting status', () => {
    it('dispatch() throws when status is not pending', () => {
      const execution = createExecution();
      execution.dispatch(t1);

      expect(() => execution.dispatch(t2)).toThrow(InvalidExecutionTransitionError);
    });

    it('markRunning() throws when status is not dispatched', () => {
      const execution = createExecution();

      expect(() => execution.markRunning(t1)).toThrow(InvalidExecutionTransitionError);
    });

    it('markSucceeded() throws when status is not running', () => {
      const execution = createExecution();
      execution.dispatch(t1);

      expect(() => execution.markSucceeded(t2)).toThrow(InvalidExecutionTransitionError);
    });

    it('markFailed() throws when status is not running', () => {
      const execution = createExecution();
      execution.dispatch(t1);

      expect(() => execution.markFailed(t2)).toThrow(InvalidExecutionTransitionError);
    });
  });
});

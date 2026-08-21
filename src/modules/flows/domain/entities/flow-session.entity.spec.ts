import { FlowSessionAlreadyClosedError } from '../errors/flow-session-already-closed.error';
import { FlowSession } from './flow-session.entity';

describe('FlowSession', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');
  const later = new Date('2026-08-21T01:00:00.000Z');

  const createAwaiting = (): FlowSession =>
    FlowSession.create(
      {
        conversationId: 'conversation-1',
        flowVersionId: 'flow-version-1',
        currentStepId: 'step-1',
      },
      now,
    );

  describe('advanceTo()', () => {
    it('merges the context patch and updates the current step while awaiting', () => {
      const session = createAwaiting();

      session.advanceTo('step-2', { in_uae: true }, later);

      expect(session.currentStepId).toBe('step-2');
      expect(session.context).toEqual({ in_uae: true });
      expect(session.updatedAt).toBe(later);
    });

    it('merges onto existing context rather than replacing it', () => {
      const session = createAwaiting();
      session.advanceTo('step-2', { in_uae: true }, later);

      session.advanceTo('step-3', { plan: 'pro' }, later);

      expect(session.context).toEqual({ in_uae: true, plan: 'pro' });
    });

    it('throws FlowSessionAlreadyClosedError once the session is no longer awaiting', () => {
      const session = createAwaiting();
      session.complete(later);

      expect(() => session.advanceTo('step-2', {}, later)).toThrow(FlowSessionAlreadyClosedError);
    });
  });

  describe('complete()', () => {
    it('transitions from awaiting to completed', () => {
      const session = createAwaiting();

      session.complete(later);

      expect(session.status).toBe('completed');
      expect(session.updatedAt).toBe(later);
    });

    it('throws FlowSessionAlreadyClosedError when called a second time', () => {
      const session = createAwaiting();
      session.complete(later);

      expect(() => session.complete(later)).toThrow(FlowSessionAlreadyClosedError);
    });
  });

  describe('close()', () => {
    it('transitions from awaiting to closed', () => {
      const session = createAwaiting();

      session.close(later);

      expect(session.status).toBe('closed');
      expect(session.updatedAt).toBe(later);
    });

    it('throws FlowSessionAlreadyClosedError when called a second time', () => {
      const session = createAwaiting();
      session.close(later);

      expect(() => session.close(later)).toThrow(FlowSessionAlreadyClosedError);
    });
  });

  describe('expire()', () => {
    it('transitions from awaiting to timed_out', () => {
      const session = createAwaiting();

      session.expire(later);

      expect(session.status).toBe('timed_out');
      expect(session.updatedAt).toBe(later);
    });

    it('throws FlowSessionAlreadyClosedError when called a second time', () => {
      const session = createAwaiting();
      session.expire(later);

      expect(() => session.expire(later)).toThrow(FlowSessionAlreadyClosedError);
    });
  });

  describe('incrementReprompt()', () => {
    it('bumps the reprompt count while awaiting', () => {
      const session = createAwaiting();

      session.incrementReprompt();
      session.incrementReprompt();

      expect(session.repromptCount).toBe(2);
    });

    it('throws FlowSessionAlreadyClosedError once the session is no longer awaiting', () => {
      const session = createAwaiting();
      session.close(later);

      expect(() => session.incrementReprompt()).toThrow(FlowSessionAlreadyClosedError);
    });
  });
});

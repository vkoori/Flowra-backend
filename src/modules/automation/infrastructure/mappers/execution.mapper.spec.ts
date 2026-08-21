import { Execution as PrismaExecution } from '../../../../../generated/prisma';
import { Execution } from '../../domain/entities/execution.entity';
import { ExecutionMapper, RawExecutionRow } from './execution.mapper';

function makePrismaExecution(overrides: Partial<PrismaExecution> = {}): PrismaExecution {
  return {
    id: 'execution-1',
    originType: 'rule',
    originId: 'rule-1',
    eventId: 'event-1',
    actionIndex: 0,
    status: 'pending',
    actionType: 'send_dm',
    actionParams: { text: 'hello' },
    scheduledAt: new Date('2026-01-01T00:00:00.000Z'),
    nextAttemptAt: null,
    attempts: 0,
    maxAttempts: 5,
    deadLetterReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

function makeRawExecutionRow(overrides: Partial<RawExecutionRow> = {}): RawExecutionRow {
  return {
    id: 'execution-2',
    origin_type: 'flow',
    origin_id: 'flow-session-1',
    event_id: 'event-2',
    action_index: 1,
    status: 'dispatched',
    action_type: 'send_comment_reply',
    action_params: { text: 'thanks' },
    scheduled_at: new Date('2026-01-03T00:00:00.000Z'),
    next_attempt_at: new Date('2026-01-03T00:05:00.000Z'),
    attempts: 2,
    max_attempts: 5,
    dead_letter_reason: 'timed out',
    created_at: new Date('2026-01-03T00:00:00.000Z'),
    updated_at: new Date('2026-01-03T00:06:00.000Z'),
    ...overrides,
  };
}

describe('ExecutionMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a Prisma row onto the domain entity', () => {
      const row = makePrismaExecution({
        nextAttemptAt: new Date('2026-01-05T00:00:00.000Z'),
        deadLetterReason: 'max attempts exceeded',
        attempts: 3,
      });

      const execution = ExecutionMapper.toDomain(row);

      expect(execution.id).toBe(row.id);
      expect(execution.originType).toBe(row.originType);
      expect(execution.originId).toBe(row.originId);
      expect(execution.eventId).toBe(row.eventId);
      expect(execution.actionIndex).toBe(row.actionIndex);
      expect(execution.status).toBe(row.status);
      expect(execution.actionType).toBe(row.actionType);
      expect(execution.actionParams).toEqual(row.actionParams);
      expect(execution.scheduledAt).toBe(row.scheduledAt);
      expect(execution.nextAttemptAt).toBe(row.nextAttemptAt);
      expect(execution.attempts).toBe(row.attempts);
      expect(execution.maxAttempts).toBe(row.maxAttempts);
      expect(execution.deadLetterReason).toBe(row.deadLetterReason);
      expect(execution.createdAt).toBe(row.createdAt);
      expect(execution.updatedAt).toBe(row.updatedAt);
    });

    it('maps null nextAttemptAt and deadLetterReason to null', () => {
      const row = makePrismaExecution({ nextAttemptAt: null, deadLetterReason: null });

      const execution = ExecutionMapper.toDomain(row);

      expect(execution.nextAttemptAt).toBeNull();
      expect(execution.deadLetterReason).toBeNull();
    });
  });

  describe('toDomainFromRaw', () => {
    it('maps every field from a snake_case raw row onto the domain entity', () => {
      const row = makeRawExecutionRow();

      const execution = ExecutionMapper.toDomainFromRaw(row);

      expect(execution.id).toBe(row.id);
      expect(execution.originType).toBe(row.origin_type);
      expect(execution.originId).toBe(row.origin_id);
      expect(execution.eventId).toBe(row.event_id);
      expect(execution.actionIndex).toBe(row.action_index);
      expect(execution.status).toBe(row.status);
      expect(execution.actionType).toBe(row.action_type);
      expect(execution.actionParams).toEqual(row.action_params);
      expect(execution.scheduledAt).toBe(row.scheduled_at);
      expect(execution.nextAttemptAt).toBe(row.next_attempt_at);
      expect(execution.attempts).toBe(row.attempts);
      expect(execution.maxAttempts).toBe(row.max_attempts);
      expect(execution.deadLetterReason).toBe(row.dead_letter_reason);
      expect(execution.createdAt).toBe(row.created_at);
      expect(execution.updatedAt).toBe(row.updated_at);
    });

    it('maps null next_attempt_at and dead_letter_reason to null', () => {
      const row = makeRawExecutionRow({ next_attempt_at: null, dead_letter_reason: null });

      const execution = ExecutionMapper.toDomainFromRaw(row);

      expect(execution.nextAttemptAt).toBeNull();
      expect(execution.deadLetterReason).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('round-trips every field back into a Prisma create input', () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const execution = Execution.create(
        {
          originType: 'flow',
          originId: 'flow-session-1',
          eventId: 'event-3',
          actionIndex: 2,
          actionType: 'send_dm',
          actionParams: { text: 'hi' },
          scheduledAt: now,
          maxAttempts: 3,
        },
        now,
      );

      const persistence = ExecutionMapper.toPersistence(execution);

      expect(persistence).toEqual({
        id: execution.id,
        originType: 'flow',
        originId: 'flow-session-1',
        eventId: 'event-3',
        actionIndex: 2,
        status: 'pending',
        actionType: 'send_dm',
        actionParams: { text: 'hi' },
        scheduledAt: now,
        nextAttemptAt: null,
        attempts: 0,
        maxAttempts: 3,
        deadLetterReason: null,
        createdAt: now,
        updatedAt: now,
      });
    });

    it('carries a non-null nextAttemptAt and deadLetterReason through', () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const execution = Execution.create(
        {
          originType: 'rule',
          originId: 'rule-1',
          eventId: 'event-4',
          actionIndex: 0,
          actionType: 'send_dm',
          actionParams: {},
          scheduledAt: now,
          maxAttempts: 1,
        },
        now,
      );
      execution.dispatch(now);
      execution.markRunning(now);
      execution.markFailed(now);
      execution.deadLetter('provider rejected message', now);

      const persistence = ExecutionMapper.toPersistence(execution);

      expect(persistence.status).toBe('dead_lettered');
      expect(persistence.deadLetterReason).toBe('provider rejected message');
    });
  });
});

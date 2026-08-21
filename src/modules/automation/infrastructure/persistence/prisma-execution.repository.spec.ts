import { Execution as PrismaExecution } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Execution } from '../../domain/entities/execution.entity';
import { RawExecutionRow } from '../mappers/execution.mapper';
import { PrismaExecutionRepository } from './prisma-execution.repository';

function makePrismaExecution(overrides: Partial<PrismaExecution> = {}): PrismaExecution {
  return {
    id: 'execution-1',
    originType: 'rule',
    originId: 'rule-1',
    eventId: 'event-1',
    actionIndex: 0,
    status: 'pending',
    actionType: 'send_dm',
    actionParams: {},
    scheduledAt: new Date('2026-01-01T00:00:00.000Z'),
    nextAttemptAt: null,
    attempts: 0,
    maxAttempts: 5,
    deadLetterReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeRawExecutionRow(overrides: Partial<RawExecutionRow> = {}): RawExecutionRow {
  return {
    id: 'execution-1',
    origin_type: 'rule',
    origin_id: 'rule-1',
    event_id: 'event-1',
    action_index: 0,
    status: 'pending',
    action_type: 'send_dm',
    action_params: {},
    scheduled_at: new Date('2026-01-01T00:00:00.000Z'),
    next_attempt_at: null,
    attempts: 0,
    max_attempts: 5,
    dead_letter_reason: null,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeExecution(): Execution {
  return Execution.create(
    {
      originType: 'rule',
      originId: 'rule-1',
      eventId: 'event-1',
      actionIndex: 0,
      actionType: 'send_dm',
      actionParams: {},
      scheduledAt: new Date('2026-01-01T00:00:00.000Z'),
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaExecutionRepository', () => {
  describe('findById', () => {
    it('returns the mapped domain entity when a row is found', async () => {
      const row = makePrismaExecution();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { execution: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaExecutionRepository(prisma);

      const execution = await repository.findById('execution-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'execution-1' } });
      expect(execution?.id).toBe(row.id);
    });

    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { execution: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaExecutionRepository(prisma);

      const execution = await repository.findById('missing');

      expect(execution).toBeNull();
    });
  });

  describe('save', () => {
    it('upserts the execution keyed by id with mapped persistence data', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { execution: { upsert } } as unknown as PrismaService;
      const repository = new PrismaExecutionRepository(prisma);
      const execution = makeExecution();

      await repository.save(execution);

      expect(upsert).toHaveBeenCalledTimes(1);
      const call = upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: execution.id });
      expect(call.create.id).toBe(execution.id);
      expect(call.create.status).toBe('pending');
      expect(call.update).toBe(call.create);
    });
  });

  describe('claimBatch', () => {
    it('claims due rows, marks them dispatched, and returns them mapped', async () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const rawRows = [
        makeRawExecutionRow({ id: 'execution-1' }),
        makeRawExecutionRow({ id: 'execution-2', origin_id: 'rule-2' }),
      ];
      const queryRaw = jest.fn().mockResolvedValue(rawRows);
      const updateMany = jest.fn().mockResolvedValue({ count: rawRows.length });
      const tx = { $queryRaw: queryRaw, execution: { updateMany } };
      const transaction = jest.fn((callback: (tx: unknown) => unknown) => callback(tx));
      const prisma = { $transaction: transaction } as unknown as PrismaService;
      const repository = new PrismaExecutionRepository(prisma);

      const executions = await repository.claimBatch(10, now);

      expect(transaction).toHaveBeenCalledTimes(1);
      expect(queryRaw).toHaveBeenCalledTimes(1);
      expect(updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['execution-1', 'execution-2'] } },
        data: { status: 'dispatched' },
      });
      expect(executions).toHaveLength(2);
      expect(executions.map((execution) => execution.id)).toEqual(['execution-1', 'execution-2']);
      expect(executions.every((execution) => execution.status === 'dispatched')).toBe(true);
    });

    it('short-circuits without calling updateMany when nothing is claimed', async () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const queryRaw = jest.fn().mockResolvedValue([]);
      const updateMany = jest.fn().mockResolvedValue({ count: 0 });
      const tx = { $queryRaw: queryRaw, execution: { updateMany } };
      const transaction = jest.fn((callback: (tx: unknown) => unknown) => callback(tx));
      const prisma = { $transaction: transaction } as unknown as PrismaService;
      const repository = new PrismaExecutionRepository(prisma);

      const executions = await repository.claimBatch(10, now);

      expect(queryRaw).toHaveBeenCalledTimes(1);
      expect(updateMany).not.toHaveBeenCalled();
      expect(executions).toEqual([]);
    });
  });
});

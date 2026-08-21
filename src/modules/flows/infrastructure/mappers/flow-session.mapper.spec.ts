import { FlowSession as PrismaFlowSession } from '../../../../../generated/prisma';
import { FlowSession } from '../../domain/entities/flow-session.entity';
import { FlowSessionMapper } from './flow-session.mapper';

describe('FlowSessionMapper', () => {
  const context = { in_uae: true, plan: 'pro' };

  const row: PrismaFlowSession = {
    id: 'flow-session-1',
    conversationId: 'conversation-1',
    flowVersionId: 'flow-version-1',
    status: 'awaiting',
    currentStepId: 'step-2',
    context,
    repromptCount: 1,
    expiresAt: new Date('2026-01-02T00:00:00.000Z'),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T01:00:00.000Z'),
  };

  it('maps every field from a Prisma row to the domain entity, including context', () => {
    const flowSession = FlowSessionMapper.toDomain(row);

    expect(flowSession.id).toBe(row.id);
    expect(flowSession.conversationId).toBe(row.conversationId);
    expect(flowSession.flowVersionId).toBe(row.flowVersionId);
    expect(flowSession.status).toBe(row.status);
    expect(flowSession.currentStepId).toBe(row.currentStepId);
    expect(flowSession.context).toEqual(context);
    expect(flowSession.repromptCount).toBe(row.repromptCount);
    expect(flowSession.expiresAt).toBe(row.expiresAt);
    expect(flowSession.createdAt).toBe(row.createdAt);
    expect(flowSession.updatedAt).toBe(row.updatedAt);
  });

  it('maps a null expiresAt through unchanged', () => {
    const rowWithoutExpiry: PrismaFlowSession = { ...row, expiresAt: null };

    const flowSession = FlowSessionMapper.toDomain(rowWithoutExpiry);

    expect(flowSession.expiresAt).toBeNull();
    expect(FlowSessionMapper.toPersistence(flowSession).expiresAt).toBeNull();
  });

  it('maps every field from the domain entity to a Prisma create input', () => {
    const flowSession = FlowSession.fromPersistence({
      id: row.id,
      conversationId: row.conversationId,
      flowVersionId: row.flowVersionId,
      status: row.status,
      currentStepId: row.currentStepId,
      context,
      repromptCount: row.repromptCount,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });

    expect(FlowSessionMapper.toPersistence(flowSession)).toEqual({
      id: row.id,
      conversationId: row.conversationId,
      flowVersionId: row.flowVersionId,
      status: row.status,
      currentStepId: row.currentStepId,
      context,
      repromptCount: row.repromptCount,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  });

  it('round-trips domain -> persistence -> domain without losing fields', () => {
    const flowSession = FlowSessionMapper.toDomain(row);
    const persisted = FlowSessionMapper.toPersistence(flowSession);

    expect(
      FlowSessionMapper.toDomain({ ...row, ...persisted } as unknown as PrismaFlowSession),
    ).toEqual(flowSession);
  });
});

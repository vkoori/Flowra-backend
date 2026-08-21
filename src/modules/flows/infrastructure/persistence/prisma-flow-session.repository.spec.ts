import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { FlowSession } from '../../domain/entities/flow-session.entity';
import { FlowSessionMapper } from '../mappers/flow-session.mapper';
import { PrismaFlowSessionRepository } from './prisma-flow-session.repository';

function makeFlowSession(): FlowSession {
  return FlowSession.create(
    { conversationId: 'conversation-1', flowVersionId: 'flow-version-1', currentStepId: 'step-1' },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaFlowSessionRepository', () => {
  describe('findById()', () => {
    it('maps the row to a domain entity when found', async () => {
      const flowSession = makeFlowSession();
      const row = { ...FlowSessionMapper.toPersistence(flowSession) };
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { flowSession: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaFlowSessionRepository(prisma);

      const result = await repository.findById(flowSession.id);

      expect(findUnique).toHaveBeenCalledWith({ where: { id: flowSession.id } });
      expect(result).toEqual(flowSession);
    });

    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { flowSession: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaFlowSessionRepository(prisma);

      const result = await repository.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findAwaitingByConversationId()', () => {
    it('queries by conversationId filtered to the awaiting status', async () => {
      const flowSession = makeFlowSession();
      const row = { ...FlowSessionMapper.toPersistence(flowSession) };
      const findFirst = jest.fn().mockResolvedValue(row);
      const prisma = { flowSession: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaFlowSessionRepository(prisma);

      const result = await repository.findAwaitingByConversationId('conversation-1');

      expect(findFirst).toHaveBeenCalledWith({
        where: { conversationId: 'conversation-1', status: 'awaiting' },
      });
      expect(result).toEqual(flowSession);
    });

    it('returns null when there is no awaiting session for the conversation', async () => {
      const findFirst = jest.fn().mockResolvedValue(null);
      const prisma = { flowSession: { findFirst } } as unknown as PrismaService;
      const repository = new PrismaFlowSessionRepository(prisma);

      const result = await repository.findAwaitingByConversationId('conversation-1');

      expect(result).toBeNull();
    });
  });

  describe('save()', () => {
    it('upserts on the flow session id', async () => {
      const flowSession = makeFlowSession();
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { flowSession: { upsert } } as unknown as PrismaService;
      const repository = new PrismaFlowSessionRepository(prisma);

      await repository.save(flowSession);

      const data = FlowSessionMapper.toPersistence(flowSession);
      expect(upsert).toHaveBeenCalledWith({
        where: { id: flowSession.id },
        create: data,
        update: data,
      });
    });
  });
});

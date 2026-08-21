import { FlowSession as PrismaFlowSession, Prisma } from '../../../../../generated/prisma';
import { FlowSession } from '../../domain/entities/flow-session.entity';

export class FlowSessionMapper {
  static toDomain(row: PrismaFlowSession): FlowSession {
    return FlowSession.fromPersistence({
      id: row.id,
      conversationId: row.conversationId,
      flowVersionId: row.flowVersionId,
      status: row.status,
      currentStepId: row.currentStepId,
      context: row.context as Record<string, unknown>,
      repromptCount: row.repromptCount,
      expiresAt: row.expiresAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(flowSession: FlowSession): Prisma.FlowSessionUncheckedCreateInput {
    return {
      id: flowSession.id,
      conversationId: flowSession.conversationId,
      flowVersionId: flowSession.flowVersionId,
      status: flowSession.status,
      currentStepId: flowSession.currentStepId,
      context: flowSession.context as Prisma.InputJsonValue,
      repromptCount: flowSession.repromptCount,
      expiresAt: flowSession.expiresAt,
      createdAt: flowSession.createdAt,
      updatedAt: flowSession.updatedAt,
    };
  }
}

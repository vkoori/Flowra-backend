import { FlowSession } from '../entities/flow-session.entity';

export interface FlowSessionRepository {
  findById(id: string): Promise<FlowSession | null>;
  findAwaitingByConversationId(conversationId: string): Promise<FlowSession | null>;
  save(flowSession: FlowSession): Promise<void>;
}

export const FLOW_SESSION_REPOSITORY = Symbol('FLOW_SESSION_REPOSITORY');

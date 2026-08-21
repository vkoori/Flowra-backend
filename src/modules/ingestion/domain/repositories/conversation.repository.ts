import { Conversation } from '../entities/conversation.entity';
import { IngestionPlatform } from '../entities/inbound-event.entity';

export interface ConversationRepository {
  findById(id: string): Promise<Conversation | null>;
  findByTenureAndParticipantHash(
    tenureId: string,
    platform: IngestionPlatform,
    participantHash: string,
  ): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
}

export const CONVERSATION_REPOSITORY = Symbol('CONVERSATION_REPOSITORY');

import { InboundEvent } from '../entities/inbound-event.entity';

export interface InboundEventRepository {
  findById(id: string): Promise<InboundEvent | null>;
  findByDedupeKey(dedupeKey: string): Promise<InboundEvent | null>;
  create(event: InboundEvent): Promise<void>;
}

export const INBOUND_EVENT_REPOSITORY = Symbol('INBOUND_EVENT_REPOSITORY');

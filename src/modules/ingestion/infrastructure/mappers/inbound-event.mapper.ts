import { InboundEvent as PrismaInboundEvent, Prisma } from '../../../../../generated/prisma';
import { InboundEvent } from '../../domain/entities/inbound-event.entity';

export class InboundEventMapper {
  static toDomain(row: PrismaInboundEvent): InboundEvent {
    return InboundEvent.fromPersistence({
      id: row.id,
      tenureId: row.tenureId,
      socialAccountId: row.socialAccountId,
      platform: row.platform,
      type: row.type,
      externalId: row.externalId,
      dedupeKey: row.dedupeKey,
      authorExternalId: row.authorExternalId,
      authorRefHash: row.authorRefHash,
      rawText: row.rawText,
      normalizedText: row.normalizedText,
      normalizerVersion: row.normalizerVersion,
      context: (row.context as Record<string, unknown> | null) ?? null,
      occurredAt: row.occurredAt,
      createdAt: row.createdAt,
    });
  }

  static toPersistence(event: InboundEvent): Prisma.InboundEventCreateInput {
    return {
      id: event.id,
      tenureId: event.tenureId,
      socialAccountId: event.socialAccountId,
      platform: event.platform,
      type: event.type,
      externalId: event.externalId,
      dedupeKey: event.dedupeKey,
      authorExternalId: event.authorExternalId,
      authorRefHash: event.authorRefHash,
      rawText: event.rawText,
      normalizedText: event.normalizedText,
      normalizerVersion: event.normalizerVersion,
      context: event.context === null ? Prisma.JsonNull : (event.context as Prisma.InputJsonValue),
      occurredAt: event.occurredAt,
      createdAt: event.createdAt,
    };
  }
}

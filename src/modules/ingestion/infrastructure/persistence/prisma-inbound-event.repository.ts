import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { isUniqueConstraintViolation } from '../../../../shared/infrastructure/prisma/prisma-unique-violation';
import { DuplicateInboundEventError } from '../../domain/errors/duplicate-inbound-event.error';
import { InboundEvent } from '../../domain/entities/inbound-event.entity';
import { InboundEventRepository } from '../../domain/repositories/inbound-event.repository';
import { InboundEventMapper } from '../mappers/inbound-event.mapper';

@Injectable()
export class PrismaInboundEventRepository implements InboundEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<InboundEvent | null> {
    const row = await this.prisma.inboundEvent.findUnique({ where: { id } });
    return row ? InboundEventMapper.toDomain(row) : null;
  }

  async findByDedupeKey(dedupeKey: string): Promise<InboundEvent | null> {
    const row = await this.prisma.inboundEvent.findUnique({ where: { dedupeKey } });
    return row ? InboundEventMapper.toDomain(row) : null;
  }

  async create(event: InboundEvent): Promise<void> {
    try {
      await this.prisma.inboundEvent.create({ data: InboundEventMapper.toPersistence(event) });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        throw new DuplicateInboundEventError(event.dedupeKey);
      }
      throw error;
    }
  }
}

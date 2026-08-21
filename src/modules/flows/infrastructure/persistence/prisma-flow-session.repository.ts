import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { FlowSession } from '../../domain/entities/flow-session.entity';
import { FlowSessionRepository } from '../../domain/repositories/flow-session.repository';
import { FlowSessionMapper } from '../mappers/flow-session.mapper';

@Injectable()
export class PrismaFlowSessionRepository implements FlowSessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<FlowSession | null> {
    const row = await this.prisma.flowSession.findUnique({ where: { id } });
    return row ? FlowSessionMapper.toDomain(row) : null;
  }

  async findAwaitingByConversationId(conversationId: string): Promise<FlowSession | null> {
    const row = await this.prisma.flowSession.findFirst({
      where: { conversationId, status: 'awaiting' },
    });
    return row ? FlowSessionMapper.toDomain(row) : null;
  }

  async save(flowSession: FlowSession): Promise<void> {
    const data = FlowSessionMapper.toPersistence(flowSession);
    await this.prisma.flowSession.upsert({
      where: { id: flowSession.id },
      create: data,
      update: data,
    });
  }
}

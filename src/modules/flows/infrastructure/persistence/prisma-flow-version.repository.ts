import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { FlowVersion } from '../../domain/entities/flow-version.entity';
import { FlowVersionRepository } from '../../domain/repositories/flow-version.repository';
import { FlowVersionMapper } from '../mappers/flow-version.mapper';

@Injectable()
export class PrismaFlowVersionRepository implements FlowVersionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<FlowVersion | null> {
    const row = await this.prisma.flowVersion.findUnique({ where: { id } });
    return row ? FlowVersionMapper.toDomain(row) : null;
  }

  async findLatestByFlowId(flowId: string): Promise<FlowVersion | null> {
    const row = await this.prisma.flowVersion.findFirst({
      where: { flowId },
      orderBy: { version: 'desc' },
    });
    return row ? FlowVersionMapper.toDomain(row) : null;
  }

  async create(flowVersion: FlowVersion): Promise<void> {
    await this.prisma.flowVersion.create({ data: FlowVersionMapper.toPersistence(flowVersion) });
  }
}

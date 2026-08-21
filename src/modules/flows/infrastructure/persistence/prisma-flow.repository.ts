import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Flow } from '../../domain/entities/flow.entity';
import { FlowRepository } from '../../domain/repositories/flow.repository';
import { FlowMapper } from '../mappers/flow.mapper';

@Injectable()
export class PrismaFlowRepository implements FlowRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Flow | null> {
    const row = await this.prisma.flow.findUnique({ where: { id } });
    return row ? FlowMapper.toDomain(row) : null;
  }

  async findBySocialAccountId(socialAccountId: string): Promise<Flow[]> {
    const rows = await this.prisma.flow.findMany({ where: { socialAccountId } });
    return rows.map((row) => FlowMapper.toDomain(row));
  }

  async save(flow: Flow): Promise<void> {
    const data = FlowMapper.toPersistence(flow);
    await this.prisma.flow.upsert({
      where: { id: flow.id },
      create: data,
      update: data,
    });
  }
}

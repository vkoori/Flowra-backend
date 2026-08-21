import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Plan } from '../../domain/entities/plan.entity';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { PlanMapper } from '../mappers/plan.mapper';

@Injectable()
export class PrismaPlanRepository implements PlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Plan | null> {
    const row = await this.prisma.plan.findUnique({ where: { id } });
    return row ? PlanMapper.toDomain(row) : null;
  }

  async findByCode(code: string): Promise<Plan | null> {
    const row = await this.prisma.plan.findUnique({ where: { code } });
    return row ? PlanMapper.toDomain(row) : null;
  }

  async save(plan: Plan): Promise<void> {
    const data = PlanMapper.toPersistence(plan);
    await this.prisma.plan.upsert({
      where: { id: plan.id },
      create: data,
      update: data,
    });
  }
}

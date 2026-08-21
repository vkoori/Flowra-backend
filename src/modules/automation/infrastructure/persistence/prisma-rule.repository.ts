import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Rule } from '../../domain/entities/rule.entity';
import { RuleRepository } from '../../domain/repositories/rule.repository';
import { RuleMapper } from '../mappers/rule.mapper';

@Injectable()
export class PrismaRuleRepository implements RuleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Rule | null> {
    const row = await this.prisma.rule.findUnique({ where: { id } });
    return row ? RuleMapper.toDomain(row) : null;
  }

  async findEnabledBySocialAccountId(socialAccountId: string): Promise<Rule[]> {
    const rows = await this.prisma.rule.findMany({
      where: { socialAccountId, enabled: true },
      orderBy: { priority: 'desc' },
    });
    return rows.map((row) => RuleMapper.toDomain(row));
  }

  async save(rule: Rule): Promise<void> {
    const data = RuleMapper.toPersistence(rule);
    await this.prisma.rule.upsert({
      where: { id: rule.id },
      create: data,
      update: data,
    });
  }
}

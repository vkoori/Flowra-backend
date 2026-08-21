import { Prisma, Rule as PrismaRule } from '../../../../../generated/prisma';
import { Rule } from '../../domain/entities/rule.entity';

export class RuleMapper {
  static toDomain(row: PrismaRule): Rule {
    return Rule.fromPersistence({
      id: row.id,
      socialAccountId: row.socialAccountId,
      enabled: row.enabled,
      priority: row.priority,
      triggerType: row.triggerType,
      triggerScope: (row.triggerScope as Record<string, unknown> | null) ?? null,
      matcherMode: row.matcherMode,
      matcherValues: row.matcherValues,
      matcherCaseSensitive: row.matcherCaseSensitive,
      conditions: row.conditions as Record<string, unknown>,
      actions: row.actions as Record<string, unknown>,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  static toPersistence(rule: Rule): Prisma.RuleCreateInput {
    return {
      id: rule.id,
      socialAccountId: rule.socialAccountId,
      enabled: rule.enabled,
      priority: rule.priority,
      triggerType: rule.triggerType,
      triggerScope:
        rule.triggerScope === null ? Prisma.JsonNull : (rule.triggerScope as Prisma.InputJsonValue),
      matcherMode: rule.matcherMode,
      matcherValues: rule.matcherValues,
      matcherCaseSensitive: rule.matcherCaseSensitive,
      conditions: rule.conditions as Prisma.InputJsonValue,
      actions: rule.actions as Prisma.InputJsonValue,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}

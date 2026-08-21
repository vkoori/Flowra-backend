import { Rule as PrismaRule } from '../../../../../generated/prisma';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Rule } from '../../domain/entities/rule.entity';
import { PrismaRuleRepository } from './prisma-rule.repository';

function makePrismaRule(overrides: Partial<PrismaRule> = {}): PrismaRule {
  return {
    id: 'rule-1',
    socialAccountId: 'social-account-1',
    enabled: true,
    priority: 0,
    triggerType: 'comment_created',
    triggerScope: null,
    matcherMode: 'contains',
    matcherValues: ['discount'],
    matcherCaseSensitive: false,
    conditions: {},
    actions: {},
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function makeRule(): Rule {
  return Rule.create(
    {
      socialAccountId: 'social-account-1',
      triggerType: 'comment_created',
      matcherMode: 'contains',
      matcherValues: ['discount'],
      conditions: {},
      actions: {},
    },
    new Date('2026-01-01T00:00:00.000Z'),
  );
}

describe('PrismaRuleRepository', () => {
  describe('findById', () => {
    it('returns the mapped domain entity when a row is found', async () => {
      const row = makePrismaRule();
      const findUnique = jest.fn().mockResolvedValue(row);
      const prisma = { rule: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaRuleRepository(prisma);

      const rule = await repository.findById('rule-1');

      expect(findUnique).toHaveBeenCalledWith({ where: { id: 'rule-1' } });
      expect(rule).not.toBeNull();
      expect(rule?.id).toBe(row.id);
      expect(rule?.matcherValues).toEqual(row.matcherValues);
    });

    it('returns null when no row is found', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const prisma = { rule: { findUnique } } as unknown as PrismaService;
      const repository = new PrismaRuleRepository(prisma);

      const rule = await repository.findById('missing');

      expect(rule).toBeNull();
    });
  });

  describe('findEnabledBySocialAccountId', () => {
    it('queries enabled rules for the account ordered by priority descending', async () => {
      const rows = [
        makePrismaRule({ id: 'rule-1', priority: 5 }),
        makePrismaRule({ id: 'rule-2', priority: 1 }),
      ];
      const findMany = jest.fn().mockResolvedValue(rows);
      const prisma = { rule: { findMany } } as unknown as PrismaService;
      const repository = new PrismaRuleRepository(prisma);

      const rules = await repository.findEnabledBySocialAccountId('social-account-1');

      expect(findMany).toHaveBeenCalledWith({
        where: { socialAccountId: 'social-account-1', enabled: true },
        orderBy: { priority: 'desc' },
      });
      expect(rules.map((rule) => rule.id)).toEqual(['rule-1', 'rule-2']);
    });

    it('returns an empty array when no enabled rules exist', async () => {
      const findMany = jest.fn().mockResolvedValue([]);
      const prisma = { rule: { findMany } } as unknown as PrismaService;
      const repository = new PrismaRuleRepository(prisma);

      const rules = await repository.findEnabledBySocialAccountId('social-account-1');

      expect(rules).toEqual([]);
    });
  });

  describe('save', () => {
    it('upserts the rule keyed by id with mapped persistence data', async () => {
      const upsert = jest.fn().mockResolvedValue(undefined);
      const prisma = { rule: { upsert } } as unknown as PrismaService;
      const repository = new PrismaRuleRepository(prisma);
      const rule = makeRule();

      await repository.save(rule);

      expect(upsert).toHaveBeenCalledTimes(1);
      const call = upsert.mock.calls[0][0];
      expect(call.where).toEqual({ id: rule.id });
      expect(call.create.id).toBe(rule.id);
      expect(call.create.socialAccountId).toBe(rule.socialAccountId);
      expect(call.update).toBe(call.create);
    });
  });
});

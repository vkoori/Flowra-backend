import { Prisma, Rule as PrismaRule } from '../../../../../generated/prisma';
import { Rule } from '../../domain/entities/rule.entity';
import { RuleMapper } from './rule.mapper';

function makePrismaRule(overrides: Partial<PrismaRule> = {}): PrismaRule {
  return {
    id: 'rule-1',
    socialAccountId: 'social-account-1',
    enabled: true,
    priority: 3,
    triggerType: 'comment_created',
    triggerScope: { postIds: ['post-1'] },
    matcherMode: 'contains',
    matcherValues: ['discount', 'promo'],
    matcherCaseSensitive: true,
    conditions: { minFollowers: 100 },
    actions: { send: 'dm' },
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    ...overrides,
  };
}

describe('RuleMapper', () => {
  describe('toDomain', () => {
    it('maps every field from a Prisma row onto the domain entity', () => {
      const row = makePrismaRule();

      const rule = RuleMapper.toDomain(row);

      expect(rule.id).toBe(row.id);
      expect(rule.socialAccountId).toBe(row.socialAccountId);
      expect(rule.enabled).toBe(row.enabled);
      expect(rule.priority).toBe(row.priority);
      expect(rule.triggerType).toBe(row.triggerType);
      expect(rule.triggerScope).toEqual(row.triggerScope);
      expect(rule.matcherMode).toBe(row.matcherMode);
      expect(rule.matcherValues).toEqual(row.matcherValues);
      expect(rule.matcherCaseSensitive).toBe(row.matcherCaseSensitive);
      expect(rule.conditions).toEqual(row.conditions);
      expect(rule.actions).toEqual(row.actions);
      expect(rule.createdAt).toBe(row.createdAt);
      expect(rule.updatedAt).toBe(row.updatedAt);
    });

    it('maps a null triggerScope to null', () => {
      const row = makePrismaRule({ triggerScope: null });

      const rule = RuleMapper.toDomain(row);

      expect(rule.triggerScope).toBeNull();
    });
  });

  describe('toPersistence', () => {
    it('round-trips every field back into a Prisma create input', () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const rule = Rule.create(
        {
          socialAccountId: 'social-account-2',
          triggerType: 'dm_received',
          triggerScope: { keywords: ['hi'] },
          matcherMode: 'regex',
          matcherValues: ['^hello'],
          matcherCaseSensitive: true,
          conditions: { locale: 'en' },
          actions: { reply: 'hi there' },
          priority: 7,
          enabled: false,
        },
        now,
      );

      const persistence = RuleMapper.toPersistence(rule);

      expect(persistence).toEqual({
        id: rule.id,
        socialAccountId: 'social-account-2',
        enabled: false,
        priority: 7,
        triggerType: 'dm_received',
        triggerScope: { keywords: ['hi'] },
        matcherMode: 'regex',
        matcherValues: ['^hello'],
        matcherCaseSensitive: true,
        conditions: { locale: 'en' },
        actions: { reply: 'hi there' },
        createdAt: now,
        updatedAt: now,
      });
    });

    it('maps a null triggerScope to Prisma.JsonNull rather than JS null', () => {
      const now = new Date('2026-08-21T00:00:00.000Z');
      const rule = Rule.create(
        {
          socialAccountId: 'social-account-3',
          triggerType: 'comment_created',
          matcherMode: 'any',
          matcherValues: [],
          conditions: {},
          actions: {},
        },
        now,
      );

      const persistence = RuleMapper.toPersistence(rule);

      expect(persistence.triggerScope).toBe(Prisma.JsonNull);
    });
  });
});

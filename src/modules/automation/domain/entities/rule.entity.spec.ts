import { Rule } from './rule.entity';

describe('Rule', () => {
  const now = new Date('2026-08-21T00:00:00.000Z');

  const createRule = (enabled = true): Rule =>
    Rule.create(
      {
        socialAccountId: 'social-account-1',
        triggerType: 'comment_created',
        matcherMode: 'contains',
        matcherValues: ['discount'],
        conditions: {},
        actions: {},
        enabled,
      },
      now,
    );

  describe('enable()', () => {
    it('sets enabled to true from disabled', () => {
      const rule = createRule(false);

      rule.enable();

      expect(rule.enabled).toBe(true);
    });

    it('is idempotent — does not throw when already enabled', () => {
      const rule = createRule(true);

      expect(() => rule.enable()).not.toThrow();
      expect(rule.enabled).toBe(true);
    });
  });

  describe('disable()', () => {
    it('sets enabled to false from enabled', () => {
      const rule = createRule(true);

      rule.disable();

      expect(rule.enabled).toBe(false);
    });

    it('is idempotent — does not throw when already disabled', () => {
      const rule = createRule(false);

      expect(() => rule.disable()).not.toThrow();
      expect(rule.enabled).toBe(false);
    });
  });
});

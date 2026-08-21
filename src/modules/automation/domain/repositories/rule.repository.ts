import { Rule } from '../entities/rule.entity';

export interface RuleRepository {
  findById(id: string): Promise<Rule | null>;
  findEnabledBySocialAccountId(socialAccountId: string): Promise<Rule[]>;
  save(rule: Rule): Promise<void>;
}

export const RULE_REPOSITORY = Symbol('RULE_REPOSITORY');

import { randomUUID } from 'node:crypto';

export type RuleTriggerType = 'comment_created' | 'dm_received';

export type RuleMatcherMode = 'exact' | 'contains' | 'regex' | 'any';

export type RuleTriggerScope = Record<string, unknown> | null;
export type RuleConditions = Record<string, unknown>;
export type RuleActions = Record<string, unknown>;

interface RuleProps {
  id: string;
  socialAccountId: string;
  enabled: boolean;
  priority: number;
  triggerType: RuleTriggerType;
  triggerScope: RuleTriggerScope;
  matcherMode: RuleMatcherMode;
  matcherValues: string[];
  matcherCaseSensitive: boolean;
  conditions: RuleConditions;
  actions: RuleActions;
  createdAt: Date;
  updatedAt: Date;
}

export class Rule {
  private constructor(private readonly props: RuleProps) {}

  static create(
    props: {
      socialAccountId: string;
      triggerType: RuleTriggerType;
      triggerScope?: RuleTriggerScope;
      matcherMode: RuleMatcherMode;
      matcherValues: string[];
      matcherCaseSensitive?: boolean;
      conditions: RuleConditions;
      actions: RuleActions;
      priority?: number;
      enabled?: boolean;
    },
    now: Date,
  ): Rule {
    return new Rule({
      id: randomUUID(),
      socialAccountId: props.socialAccountId,
      enabled: props.enabled ?? true,
      priority: props.priority ?? 0,
      triggerType: props.triggerType,
      triggerScope: props.triggerScope ?? null,
      matcherMode: props.matcherMode,
      matcherValues: props.matcherValues,
      matcherCaseSensitive: props.matcherCaseSensitive ?? false,
      conditions: props.conditions,
      actions: props.actions,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: RuleProps): Rule {
    return new Rule(props);
  }

  get id(): string {
    return this.props.id;
  }

  get socialAccountId(): string {
    return this.props.socialAccountId;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get priority(): number {
    return this.props.priority;
  }

  get triggerType(): RuleTriggerType {
    return this.props.triggerType;
  }

  get triggerScope(): RuleTriggerScope {
    return this.props.triggerScope;
  }

  get matcherMode(): RuleMatcherMode {
    return this.props.matcherMode;
  }

  get matcherValues(): string[] {
    return this.props.matcherValues;
  }

  get matcherCaseSensitive(): boolean {
    return this.props.matcherCaseSensitive;
  }

  get conditions(): RuleConditions {
    return this.props.conditions;
  }

  get actions(): RuleActions {
    return this.props.actions;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  enable(): void {
    this.props.enabled = true;
  }

  disable(): void {
    this.props.enabled = false;
  }
}

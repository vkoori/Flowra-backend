# 016 — Manager creates a rule that replies to a matching comment

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md)
**Access control:** Social-network administrator (scoped to the target social account)

## Story

As a manager, I want to configure a rule that automatically replies when a comment
matches a keyword, so that common questions get an instant response without me having
to watch every post manually.

## Acceptance criteria

```gherkin
Feature: Create a comment-reply rule

  Scenario: Successful creation
    Given I hold the active AccountTenure for social account "sa-1"
    When I create a rule with trigger "comment_created", matcher mode "contains",
      matcher values ["price", "cost"], and one action "platform.send_message"
    Then a new Rule is created, enabled by default, scoped to "sa-1"
    And the rule's conditions/actions are stored as their configured JSON shape

  Scenario: Cannot create a rule on an account I don't manage
    Given a different manager holds the active AccountTenure for social account "sa-3"
    When I try to create a rule scoped to "sa-3"
    Then the request is rejected with a forbidden error

  Scenario: Action requires a capability the connection doesn't have
    Given social account "sa-1"'s connection capabilities do not include SEND_MESSAGE
    When I try to create a rule whose action is "platform.send_message"
    Then the request is rejected with a validation error naming the missing capability
    And no Rule is created

  Scenario: Malformed matcher/condition/action payload
    When I submit a rule with an action type that isn't registered, or a condition tree
      that doesn't validate against the (future) condition schema
    Then the request is rejected with a validation error
    And no Rule is created
```

## Considerations

- **Schema already exists**: `Rule` (`rules` table, `automation` module) was built this
  session with `triggerType`, `matcherMode`, `matcherValues`, `conditions`, `actions` as
  loosely-typed JSON — this task is the first thing that actually writes to it via a
  real use case, which is exactly where the deferred Zod registry (design doc §7,
  "a Zod registry keyed on `type`") stops being optional. Building at least a minimal
  version of that registry (covering `platform.send_message` and a basic condition
  shape) is *in scope* for this task, even though the full engine described in §7 is
  bigger than this one task.
- **Reject at save time if the target connection lacks the required capability** —
  design doc §7: "A condition requiring FOLLOW_CHECK is hidden in the UI and rejected on
  save when the connection lacks it." This task is the "on save" half of that rule;
  applies to actions too, not just conditions.
- **`automation`/`flows` must never contain a platform name** (design doc §3,
  CLAUDE.md's own module-map rule) — the action type string (`"platform.send_message"`)
  is polymorphic; which concrete platform executes it is resolved later, at dispatch
  time, by the connector layer — not decided here.
- **Priority and enabled defaults**: `priority` defaults to 0, `enabled` defaults to
  `true` on creation (matches the entity's existing `create()` defaults).
- **Does not itself trigger any matching** — this task is CRUD; task 018 is what reads
  these rules against an inbound event.

# 019 — System enforces a per-author cooldown before creating an execution

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [018](018-system-matches-an-event-against-rules.md)
**Access control:** System-internal

## Story

As the system, I want to suppress a rule from firing again for the same author within
a cooldown window, so that one enthusiastic (or spammy) commenter doesn't get the same
automated reply five times in a minute.

## Acceptance criteria

```gherkin
Feature: Per-author cooldown condition

  Scenario: First match within the window creates an execution
    Given author "author-1" has not triggered this rule recently
    When a matching InboundEvent from "author-1" is evaluated
    Then the cooldown condition passes
    And an Execution is created

  Scenario: Repeated match within the cooldown window is suppressed
    Given author "author-1" triggered this same rule 30 seconds ago
    And the rule's cooldown is configured as 5 minutes
    When another matching InboundEvent from "author-1" arrives
    Then the cooldown condition fails
    And no Execution is created for this rule (design doc §6.4: "condition fails, no
      execution created" — not an error, not a retry, just silently no-op for this rule)

  Scenario: Match after the cooldown window has elapsed
    Given author "author-1" triggered this same rule 10 minutes ago
    And the rule's cooldown is configured as 5 minutes
    When another matching InboundEvent from "author-1" arrives
    Then the cooldown condition passes
    And an Execution is created
```

## Considerations

- **`authorRefHash` is the identity used for cooldown comparisons**, not the raw
  platform author id — matches design doc §6.12's privacy design (comparable but not
  reversible) and reuses what ingestion already computes per event.
- **Cooldown is a condition type within the general condition tree** (task 018's
  engine), not a separate mechanism bolted on afterward — design doc §7 lists it as
  exactly that: `condition.type = 'cooldown'` alongside follower-check, business-hours,
  etc. This task is really "build the cooldown condition implementation," a slice of
  the broader condition-tree work task 018 depends on.
- **Where is "last triggered" tracked?** Not an explicit table in the design doc —
  likely derived by querying the most recent `Execution`/`InboundEvent` for
  `(ruleId, authorRefHash)` rather than a dedicated counter table. Whoever implements
  this should pick one approach and confirm it against real query performance at scale
  (cooldown checks run on every single matching event) — flagging as an implementation
  decision, not fixed here.
- **Scope of the cooldown**: per rule, or per author across all rules on an account? The
  design doc's phrasing ("per-author cooldown") reads as per-rule (each rule can define
  its own cooldown duration as part of its condition tree) rather than one global
  per-account cooldown — confirm this reading before implementing if it's ambiguous
  once the condition schema is actually drafted.

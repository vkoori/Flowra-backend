# 021 — Manager enables or disables a rule

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine, inferred CRUD) · **Priority:** P1 · **Depends on:** [016](016-manager-creates-a-comment-reply-rule.md)
**Access control:** Social-network administrator (scoped to the target social account)

## Story

As a manager, I want to turn a rule on or off without deleting it, so that I can
temporarily pause an automation (e.g. during a sale, or while I fix a typo in the
reply text) and re-enable it later without reconfiguring it from scratch.

## Acceptance criteria

```gherkin
Feature: Enable/disable a rule

  Scenario: Disabling an enabled rule
    Given I hold the active AccountTenure for social account "sa-1"
    And "sa-1" has an enabled Rule "rule-1"
    When I disable "rule-1"
    Then "rule-1".enabled becomes false
    And "rule-1" no longer matches any inbound event (task 018)

  Scenario: Enabling an already-enabled rule is a no-op
    Given "rule-1" is already enabled
    When I enable "rule-1" again
    Then the request succeeds without error (idempotent — matches the Rule entity's
      existing enable()/disable() behavior, deliberately non-throwing)

  Scenario: Cannot toggle a rule on an account I don't manage
    Given a different manager holds the active tenure for "sa-3"
    When I try to disable a rule scoped to "sa-3"
    Then the request is rejected with a forbidden error
```

## Considerations

- **The domain logic already exists** — `Rule.enable()`/`disable()` were built this
  session as intentionally idempotent (no error on redundant toggling, unlike most
  other entities' terminal-state transitions). This task is purely wiring a use case +
  controller on top of already-correct domain behavior.
- **Disabling does not touch already-pending Executions** for that rule that were
  created before the toggle — design doc doesn't say disabling should cancel in-flight
  work, and the execution state machine (design doc §5) has no "cancelled" state to put
  them in. Confirm this is the intended behavior (leave in-flight executions to finish
  naturally) rather than assuming cancellation is wanted.

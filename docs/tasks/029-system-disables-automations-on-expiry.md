# 029 — System disables rules/flows (without deleting them) when a subscription expires

**Phase:** 4 — Entitlement · **Priority:** P1 · **Depends on:** [027](027-admin-activates-a-subscription.md)
**Access control:** System-internal (scheduler job)

## Story

As the system, when a social account's subscription passes its grace period and
expires, I want to disable its rules and flows without deleting any configuration, so
that renewal instantly restores everything exactly as it was.

## Acceptance criteria

```gherkin
Feature: Disable automations on expiry

  Scenario: Grace period passes and the subscription expires
    Given Subscription "sub-1" has graceUntil in the past and status "active"
    When the scheduled expiry job runs
    Then "sub-1".status becomes "expired"
    And every Rule for that social account is disabled (enabled = false), not deleted

  Scenario: Configuration is preserved, not destroyed
    Given social account "sa-1"'s subscription just expired
    When I inspect "sa-1"'s rules after expiry
    Then every rule still exists with its original matcher/conditions/actions intact —
      only `enabled` changed
```

## Considerations

- **"Disabled, not deleted" is the explicit design requirement** (design doc §6.11
  point 2) — this must reuse the existing `Rule.disable()` entity method (idempotent,
  already built) applied in bulk across every rule for the account, not a new
  deletion/archival mechanism.
- **Grace period, not immediate cutoff**: design doc §6.11 point 1 + the closing
  rationale — "An abrupt cutoff costs a business real customers... The grace window is
  not a courtesy; it is churn prevention." This task fires only after `graceUntil`
  passes, not the instant the billing period ends — confirm `graceUntil` is being set
  correctly by task 027/031 before this job can be tested meaningfully.
- **Scheduler-owned, safe at N replicas** — same claiming discipline (`SKIP LOCKED` or
  equivalent) as every other scheduler job in this backlog (tasks 012, 022, 047, 048).
- **Flows need their own handling too** — this task's Gherkin focuses on `Rule` for
  concreteness, but `Flow`/`FlowVersion` presumably need an equivalent "not deleted,
  just made unreachable" treatment; confirm whether flows have an `enabled` concept at
  all in the current schema (they don't yet — `Flow` has no such column) before
  assuming this task covers them identically to rules. Flagging as an open
  schema/scope question rather than assuming a parallel structure that doesn't exist yet.

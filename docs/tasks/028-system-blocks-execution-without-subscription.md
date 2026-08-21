# 028 — System blocks automation execution when there's no active subscription

**Phase:** 4 — Entitlement · **Priority:** P1 · **Depends on:** [018](018-system-matches-an-event-against-rules.md), [027](027-admin-activates-a-subscription.md)
**Access control:** System-internal

## Story

As the system, I want every rule save and every action execution to pass through a
single entitlement check, so that a social account without a paid subscription can't
consume automation regardless of which code path tries to trigger it.

## Acceptance criteria

```gherkin
Feature: Entitlement gate

  Scenario: Matching still creates no execution without a subscription
    Given social account "sa-1" has no active Subscription
    And "sa-1" has an enabled rule that would otherwise match
    When a matching InboundEvent arrives for "sa-1"
    Then the webhook still responds 200 OK (task 014's own requirement)
    And no Execution is created for that rule match

  Scenario: Rule creation is still allowed without a subscription
    Given social account "sa-1" has no active Subscription
    When the manager creates a new rule for "sa-1"
    Then [OPEN QUESTION — see Considerations: should rule creation itself be blocked
      pre-subscription, or only execution? Design doc §6.2 only says "every rule save
      and every action execution passes through assertAllowed" — implying save-time
      is gated too, but that reads oddly for onboarding-before-paying. Confirm.]

  Scenario: assertAllowed is the single choke point
    Given any future code path that wants to execute a rule/flow action
    When it does so
    Then it must call assertAllowed(socialAccountId, metric) first
    And there is exactly one implementation of this check, not one per call site
```

## Considerations

- **`assertAllowed(socialAccountId, metric): Promise<void>`** is named explicitly in
  design doc §6.2 as the one choke point — "Every rule save and every action execution
  passes through" it. This task's real deliverable is building that one function
  (in `entitlement`'s public API) and ensuring every relevant call site in
  `automation`/`flows` actually calls it, not duplicating an ad hoc check per module.
- **Open question flagged above**: the design doc's own wording ("every rule save...")
  suggests entitlement gates rule *creation*, not just execution — but that's a real
  product-behavior question worth confirming before building (blocking rule creation
  entirely for a pre-paying customer changes the onboarding funnel materially compared
  to letting them configure everything and only gating execution).
- **Never surface this as an error the platform sees** — same principle as task 014's
  "no subscription still returns 200." The entitlement gate fails *silently* from the
  platform's perspective; it's only visible to the manager (e.g. via a dashboard state,
  not specified here) and to `assertAllowed`'s internal caller.
- **Relationship to quota metrics**: `metric` in `assertAllowed`'s signature implies
  more than a boolean "has a subscription" check — likely also checks `QuotaCounter`
  against the `Plan`'s `monthlyMessageQuota`. Whether quota *exhaustion* (not just
  subscription *absence*) is in scope for this specific task or a separate one is worth
  deciding; the design doc doesn't split them into separate journeys, so treating them
  as one task here is a judgment call, not a documented split.

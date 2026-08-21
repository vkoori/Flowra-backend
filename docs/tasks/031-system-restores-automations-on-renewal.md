# 031 — System restores rules/flows automatically when a subscription is renewed

**Phase:** 4 — Entitlement · **Priority:** P1 · **Depends on:** [027](027-admin-activates-a-subscription.md), [029](029-system-disables-automations-on-expiry.md)
**Access control:** System administrator (renewal is another admin activation, per task 027's mechanism)

## Story

As a system administrator, when I reactivate a lapsed social account's subscription, I
want its previously-disabled rules to come back exactly as they were, so that renewal
"just works" without the manager having to reconfigure anything.

## Acceptance criteria

```gherkin
Feature: Automatic restoration on renewal

  Scenario: Renewing an expired subscription restores its rules
    Given social account "sa-1" has an "expired" Subscription
    And "sa-1" has 3 rules that were disabled by task 029's expiry job
    When a system administrator reactivates "sa-1" (same mechanism as task 027)
    Then a new/updated Subscription becomes "active" for "sa-1"
    And all 3 rules that were disabled *specifically due to expiry* become enabled again

  Scenario: A rule the manager had manually disabled before expiry stays disabled
    Given rule "rule-2" was disabled by the manager (task 021) before the subscription
      ever expired
    When the subscription is later renewed
    Then "rule-2" remains disabled — renewal must not re-enable something the manager
      deliberately turned off for their own reasons
```

## Considerations

- **The tricky part is the second scenario**: "renewal restores everything" (design
  doc §6.11 point 2 verbatim) must not conflate "disabled because we expired it" with
  "disabled because the manager wanted it off." The current `Rule` schema has only a
  single `enabled: boolean` — it cannot currently distinguish these two reasons.
  **This is a real schema gap worth flagging**: either track *why* a rule was disabled
  (e.g. a `disabledReason`/`disabledBySystem` flag) or accept that this task, as
  literally specified by the design doc, can't be built correctly without that
  addition. Flagging rather than quietly implementing the simpler-but-wrong version
  (restore-all, which would incorrectly resurrect manager-disabled rules too).
- **Depends on task 029 having disabled rules in a way this task can distinguish** —
  sequencing matters: whoever builds 029 should already have this task's requirement
  in mind so the "why disabled" signal exists by the time 031 needs it.
- **Same admin-activation endpoint as task 027**, or a distinct "renew" endpoint? Given
  the underlying operation (create/update an active Subscription row) is the same,
  this is likely the same use case with different starting state, not a separate one —
  confirm during implementation rather than building two parallel code paths.

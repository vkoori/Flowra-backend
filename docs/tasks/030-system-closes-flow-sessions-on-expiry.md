# 030 — System closes live flow sessions neutrally when a subscription expires

**Phase:** 4 — Entitlement · **Priority:** P1 · **Depends on:** [029](029-system-disables-automations-on-expiry.md), [032](032-manager-creates-a-multi-step-flow.md)
**Access control:** System-internal

## Story

As the system, when a subscription expires, I want any currently-live conversational
flow sessions to close with a neutral message rather than being abandoned mid-dialogue,
so that a customer who's mid-conversation isn't left hanging with no response ever.

## Acceptance criteria

```gherkin
Feature: Close live flow sessions on subscription expiry

  Scenario: An awaiting flow session is closed neutrally on expiry
    Given social account "sa-1" has a FlowSession in status "awaiting"
    When "sa-1"'s subscription expires (task 029's job runs)
    Then that FlowSession transitions to "closed" (via its existing close() method)
    And a neutral closing message is sent to the customer (not silence, not an error)

  Scenario: Sessions already completed/closed are untouched
    Given social account "sa-1" has a FlowSession already in status "completed"
    When "sa-1"'s subscription expires
    Then that session is left as-is — the closing logic only applies to "awaiting" sessions
```

## Considerations

- **Explicit design requirement** (design doc §6.11 point 4): "Live flow sessions are
  closed with a neutral message rather than left hanging." This is exactly what
  `FlowSession.close()` (already built) is for — this task's new work is the scheduler
  hook that finds every awaiting session for a just-expired account and calls it, plus
  actually sending the neutral message (an outbound send, which itself goes through the
  same dispatch machinery as any other action).
- **What is the "neutral message"?** Not specified verbatim in the design doc — a
  product/copy decision (e.g. "We're currently unable to continue this conversation,
  please check back later") needed before this ships; the mechanism (close + send) is
  fully specifiable now even without final copy.
- **Runs as part of the same job as task 029**, or a separate one? Given both are
  triggered by the same expiry event, doing them in the same transaction/job run avoids
  a window where rules are disabled but flow sessions are still live — recommend
  combining rather than two independent scheduled jobs racing each other.

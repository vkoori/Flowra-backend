# 013 — System parks executions and notifies the manager on auth failure

**Phase:** 1 — Accounts & Channels · **Priority:** P1 · **Depends on:** [012](012-system-refreshes-an-access-token.md), [022](022-system-dispatches-within-rate-limit.md)
**Access control:** System-internal

## Story

As the system, when a connection's token stops working, I want to stop retrying its
pending automations and tell the manager why, so that we don't burn through rate limits
retrying something that can never succeed until they re-authorize.

## Acceptance criteria

```gherkin
Feature: Parking executions on auth failure

  Scenario: An execution fails with an auth error
    Given an Execution is running and its outbound API call fails with a 401/invalid-token error
    When the failure is classified
    Then the connection is marked "needs_reauth"
    And the execution is parked — moved to a state that is NOT scheduled for automatic
      retry (distinct from the normal failed -> retry -> pending path)

  Scenario: Other pending executions on the same connection are also parked
    Given connection "conn-1" has 3 other pending executions queued
    When "conn-1" transitions to "needs_reauth"
    Then those 3 pending executions are also parked, not left to fail individually one
      by one and burn through their own retry budgets

  Scenario: Manager is notified
    Given a connection transitions to "needs_reauth"
    Then the manager who holds the active tenure for that connection's social account
      is notified (channel unspecified — see Considerations)

  Scenario: Re-authorization resumes work
    Given connection "conn-1" is "needs_reauth" with parked executions
    When the manager successfully re-authorizes (reconnects, task 008/026)
    Then "conn-1" returns to "active"
    And its parked executions become eligible for dispatch again
```

## Considerations

- **Why this matters (design doc §6.10 point 2, verbatim reasoning)**: "Retrying a
  revoked token forever is the fastest way to burn a rate limit." Parked ≠ failed ≠
  dead-lettered — it's a fourth, distinct state where the row is deliberately *not*
  picked up by the normal retry/dispatch loop until the connection heals.
- **Notification channel is unspecified** — design doc §6.10 point 3 just says "the
  manager is notified," without saying how (email? in-app? both?). This product
  decision doesn't block building the *parking* mechanism itself, but the "notify"
  half of this task can't be marked done until a channel is chosen — flagging as open.
- **Relationship to task 012**: task 012 is the *proactive* path (refresh ahead of
  expiry); this task is the *reactive* path (something already failed at execution
  time). Both land in the same `needs_reauth` state and the same parking behavior —
  don't build two different "parked" mechanisms.
- **Un-parking on reconnect**: reconnecting (task 008/026) must know to sweep and
  requeue previously-parked executions for that connection, not just flip the
  connection's own status.

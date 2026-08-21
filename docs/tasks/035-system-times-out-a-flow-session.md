# 035 — System times out an abandoned flow session

**Phase:** 5 — Flows · **Priority:** P1 · **Depends on:** [033](033-system-advances-a-flow-session.md)
**Access control:** System-internal (scheduler job)

## Story

As the system, when a customer never replies to an active flow step within its
configured window, I want to time the session out safely before the platform's own
messaging window closes, so that we never end up trying to send a message the platform
will reject.

## Acceptance criteria

```gherkin
Feature: Flow session timeout

  Scenario: A session times out after its configured window with no reply
    Given FlowSession "session-1" is "awaiting" with a timeout scheduled via an
      execution of type "flow.timeout"
    When that scheduled timeout fires with no intervening reply
    Then "session-1" transitions to "timed_out" (via its existing expire() method)

  Scenario: A reply before the timeout cancels it
    Given FlowSession "session-1" has a scheduled flow.timeout execution
    When a matching or non-matching reply arrives before that execution's scheduledAt
    Then the pending flow.timeout execution is cancelled (an UPDATE on the row, per
      design doc §5 — cancellation is always a DB write, never a queue operation)
    And the session proceeds via task 033/034 instead of timing out later

  Scenario: Timeout window respects the platform's own messaging window
    Given the target platform only allows replies within 24h of the customer's last
      message (e.g. Instagram)
    When a flow step's timeoutSeconds is configured
    Then it must be safely shorter than that platform limit (design doc §6.6 point 2
      recommends 12h specifically to leave margin)
```

## Considerations

- **Uses the same `scheduled_at` mechanism as everything else** (design doc §6.6 point
  4 / CLAUDE.md §0.1): "an execution of type `flow.timeout` scheduled ahead, cancelled
  by an `UPDATE` when the answer arrives early." This is not a new scheduling primitive
  — it's another `Execution`-shaped row (or an equivalent scheduled-job row) using the
  exact mechanism the outbox/dispatcher already provides.
- **The specific failure this prevents is named explicitly** (design doc §6.6 point 2):
  "A session that waits 48h will resume and then fail to send [because Instagram only
  allows replies within 24h]." This isn't a hypothetical edge case — it's a documented,
  previously-identified production risk. 12h is the doc's own recommended default.
- **Timeout duration is per-step, configured in the graph** (`timeoutSeconds` in the
  example JSON) — not a single global constant; validate at flow-creation time (task
  032) that a step's configured timeout doesn't exceed whatever margin is considered
  safe for the target platform.
- **Cancellation must be race-safe against task 033's advancement** — if a reply and
  the timeout fire at nearly the same moment, per-conversation locking (task 036)
  is what prevents both from being processed as if the session were in two different
  end states simultaneously.

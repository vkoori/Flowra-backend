# 023 — System retries a failed execution and dead-letters it after exhausting attempts

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [022](022-system-dispatches-within-rate-limit.md)
**Access control:** System-internal

## Story

As the system, when sending an automated reply fails, I want to retry it with backoff a
bounded number of times and then give up with a clear, human-readable reason, so that
transient failures self-heal but permanent ones don't retry forever and become visible
instead of silently dropped.

## Acceptance criteria

```gherkin
Feature: Retry with backoff and dead-lettering

  Scenario: A transient failure (5xx/timeout) is retried
    Given a "running" Execution's outbound call fails with a 503
    When the failure is classified
    Then the execution transitions to "failed"
    And then, since attempts < maxAttempts, back to "pending" with a later nextAttemptAt
    And attempts is incremented

  Scenario: A permanent failure (4xx auth/bad-request) is not retried
    Given a "running" Execution's outbound call fails with a 400 or 401
    When the failure is classified
    Then a BullMQ UnrecoverableError is thrown so the queue does not keep retrying it
    And the execution transitions toward dead-lettering rather than a retry

  Scenario: Retries exhausted
    Given a "failed" Execution has attempts equal to maxAttempts
    When another failure occurs (or the row is next evaluated)
    Then the execution transitions to "dead_lettered" with a deadLetterReason set
    And it is not retried again

  Scenario: A dead-lettered execution is visible to the manager
    Given an Execution for rule "rule-1" is "dead_lettered" with reason "token expired"
    When the manager views the execution log for "rule-1" (task 025)
    Then they see the human-readable reason, not silence
```

## Considerations

- **The state machine already exists**: `Execution.markFailed()`, `.retry()`,
  `.deadLetter()` were built this session exactly to this spec (§5's diagram), including
  `.retry()` refusing once `attempts >= maxAttempts` and pointing the caller at
  `.deadLetter()` instead. This task is the *use-case* layer that classifies real HTTP
  outcomes into calls on that already-correct entity.
- **Error classification is the actual new work here**: 4xx (except 429) = permanent,
  never retry (design doc §4.E.17 / CLAUDE.md); 429/5xx/timeout = transient, retry with
  backoff. This classification must happen *before* deciding retry vs. dead-letter —
  don't let BullMQ's own `attempts`/`backoff` config blindly retry something that can
  never succeed (CLAUDE.md §0.1.4 calls this out specifically).
- **BullMQ retry ≠ blind retry** (CLAUDE.md §0.1.4): throw BullMQ's own
  `UnrecoverableError` for classified-permanent failures so the *queue* stops retrying
  too, not just the DB-level state machine.
- **Dead-lettered must be product-visible** (design doc §9.9): "the manager should see
  'this reply failed because the token expired', not silence." This is a real
  requirement on `deadLetterReason`'s content — it must be a message meaningful to a
  non-technical manager, not a raw stack trace or HTTP status code.
- **Backoff schedule** (how long between attempts) isn't specified numerically in the
  design doc — pick a reasonable exponential backoff and document the chosen curve when
  this ships.

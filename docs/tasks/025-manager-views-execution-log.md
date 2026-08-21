# 025 — Manager views the execution log for a rule

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P1 · **Depends on:** [018](018-system-matches-an-event-against-rules.md), [023](023-system-retries-and-dead-letters-executions.md)
**Access control:** Social-network administrator (scoped to the target social account)

## Story

As a manager, I want to see the history of a rule's executions — what fired, what
succeeded, what failed and why — so that when a customer says "your bot didn't
respond," I can find out why myself instead of filing a support ticket.

## Acceptance criteria

```gherkin
Feature: Execution log

  Scenario: Viewing a rule's execution history
    Given rule "rule-1" has produced executions in states succeeded, failed, and dead_lettered
    When I view "rule-1"'s execution log
    Then I see each execution with its status, timestamps, attempts, and (if
      dead-lettered) its human-readable deadLetterReason

  Scenario: Correlating an execution back to the triggering event
    Given execution "exec-1" originated from InboundEvent "event-1"
    When I view "exec-1" in the log
    Then I can see which inbound comment/DM triggered it

  Scenario: Cannot view execution logs for a rule I don't own
    Given rule "rule-3" belongs to social account "sa-3", which I don't manage
    When I try to view "rule-3"'s execution log
    Then the request is rejected with a forbidden error
```

## Considerations

- **This is explicitly a product requirement, not a nice-to-have** — design doc §10:
  "the most common support question will be 'why didn't my automation fire?', and the
  answer must be self-service." This task exists specifically to make that
  self-service, so it's deliberately included even though the design doc never phrases
  it as a numbered journey.
- **Correlation via `eventId`**: every log entry should be traceable back to its
  `InboundEvent` and forward to the structured logs sharing the same correlation id
  (design doc §10 Observability: "structured logs with `eventId` as the correlation
  ID through the whole pipeline").
- **Read-only, scoped query** — same ownership-scoping discipline as task 010, composed
  in application code since `automation`'s `executions` and whatever surfaces the
  triggering rule/event live behind their owning modules' public APIs, not joined
  directly across module boundaries.
- **Pagination matters here more than in task 010** — a busy rule could accumulate many
  executions; this needs real pagination/filtering (by status, date range) from day one,
  not an afterthought.

# 022 — System dispatches a pending execution within a connection's rate limit

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [018](018-system-matches-an-event-against-rules.md)
**Access control:** System-internal

## Story

As the system, I want to claim pending executions and dispatch them as BullMQ jobs
without exceeding a connection's outbound rate limit, so that we never get throttled or
banned by a platform for sending too fast.

## Acceptance criteria

```gherkin
Feature: Rate-limited dispatch

  Scenario: A due, pending execution is claimed and dispatched
    Given an Execution is "pending" with scheduledAt in the past
    When the dispatcher runs
    Then the execution is claimed via SELECT ... FOR UPDATE SKIP LOCKED
    And its status becomes "dispatched"
    And a BullMQ job is published with a deterministic jobId (design doc CLAUDE.md §0.1.2)

  Scenario: Multiple scheduler replicas never double-claim the same execution
    Given two scheduler/dispatcher instances are running concurrently
    And one Execution is due
    When both instances query for due executions at the same moment
    Then exactly one of them claims it
    And the other sees it as already locked/claimed, not as a separate free row

  Scenario: Rate limit budget exhausted
    Given connection "conn-1"'s Redis token bucket has no budget remaining
    When an execution due for "conn-1" is claimed
    Then the outbound call is not made yet
    And the execution's nextAttemptAt is set to a later time
    And no job is stuck unacknowledged in the broker waiting for budget

  Scenario: Budget consumed before the call, not after
    Given connection "conn-1" has exactly 1 token remaining
    When two executions for "conn-1" are ready to dispatch at the same instant
    Then only one of them successfully consumes the token and proceeds to call the platform
    And the other is deferred, not both allowed through and rate-limited after the fact
```

## Considerations

- **This is `dispatch`'s core job** — the module was scaffolded with zero tables of its
  own this session, deliberately: it operates on `automation`'s `executions` via that
  module's public API (per the design doc's own `automation → dispatch` dependency
  direction, CLAUDE.md §0.1). Building `automation`'s `ExecutionsService`-style
  application-layer facade (claim/mark-dispatched) is a prerequisite piece of this task,
  not something to skip.
- **`SELECT ... FOR UPDATE SKIP LOCKED`** — the `ExecutionRepository.claimBatch()`
  repository method already built this session implements exactly this; this task
  wires it into an actual scheduler loop and BullMQ publish step.
- **Deterministic job IDs** (CLAUDE.md §0.1.2): `jobId = executionId` (or the
  `${originType}:${originId}:${eventId}:${actionIndex}` composite) so re-enqueueing is
  idempotent at the queue layer on top of the DB-level idempotency already in place.
- **Token bucket consumed *before* the call, never after** (design doc §9.6) — this is
  the specific ordering that prevents burst overrun; Redis, namespaced `rl:*` per
  CLAUDE.md §0.
- **BullMQ is a delivery mechanism, not the source of truth** (CLAUDE.md §0.1) — a job
  existing/running/completing is never what "status" means; the `Execution` row is.
  A worker picking up a stale job for an already-cancelled/parked execution must check
  the row's current status before acting, and no-op if it's no longer eligible.

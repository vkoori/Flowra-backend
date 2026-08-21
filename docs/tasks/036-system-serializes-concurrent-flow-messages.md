# 036 — System serializes concurrent messages to the same conversation

**Phase:** 5 — Flows · **Priority:** P1 · **Depends on:** [033](033-system-advances-a-flow-session.md)
**Access control:** System-internal

## Story

As the system, when two messages arrive for the same conversation in quick succession,
I want to process them one at a time rather than letting two workers race on the same
session, so that a flow session never ends up corrupted by concurrent writes.

## Acceptance criteria

```gherkin
Feature: Per-conversation serialization during flow stepping

  Scenario: Two near-simultaneous messages are processed in order, not in parallel
    Given FlowSession "session-1" is "awaiting" at step "ask_location"
    And two messages arrive for its conversation within milliseconds of each other
    When both are picked up by (possibly different) workers
    Then only one worker proceeds to evaluate/advance the session at a time
    And the second worker's processing waits until the first's transaction completes,
      then re-reads the session's now-current state before acting

  Scenario: A lock is released even if processing fails
    Given a worker holds the per-conversation lock while stepping session "session-1"
    When that worker's processing throws an unexpected error
    Then the lock/transaction is released (not held forever)
    And the next message for that conversation can still be processed
```

## Considerations

- **This is the one place in the system where parallelism is deliberately
  forbidden**, per design doc §6.6 point 1, verbatim: "the only place in the system
  where parallelism is forbidden." Every other piece of this backlog is designed to
  scale out; this one specifically must not.
- **Mechanism, per design doc**: "Lock the session row with `SELECT ... FOR UPDATE`, or
  take an advisory lock on `conversation_id`" — CLAUDE.md §0.1.6 is more specific:
  `pg_advisory_xact_lock(hashtext(conversationId))` taken inside the same transaction
  that steps the session, regardless of queue technology (BullMQ concurrency settings
  are not a substitute for this).
- **This isn't a separate feature to ship — it's a correctness requirement on task
  033's implementation.** Listed as its own task here because it's independently
  specifiable/testable (you can write a test that fires two concurrent step-advance
  calls and assert serialized behavior), but it should land as part of building 033,
  not bolted on afterward once a race condition is discovered in production.
- **Advisory lock scope**: must cover the *entire* read-decide-write sequence for a
  step advancement (load session, evaluate the reply, write the new state) — locking
  only the final write and not the read-then-decide portion still allows two workers to
  make conflicting decisions based on stale reads.

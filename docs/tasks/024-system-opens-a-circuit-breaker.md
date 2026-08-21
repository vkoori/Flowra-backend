# 024 — System opens a circuit breaker for a connection after repeated failures

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P1 · **Depends on:** [022](022-system-dispatches-within-rate-limit.md), [023](023-system-retries-and-dead-letters-executions.md)
**Access control:** System-internal

## Story

As the system, I want to stop sending outbound calls to a connection that's repeatedly
failing, so that we don't keep hammering a platform (or a dead connection) while it's
in a bad state, and so we recover automatically once it's healthy again.

## Acceptance criteria

```gherkin
Feature: Per-connection circuit breaker

  Scenario: Repeated failures open the circuit
    Given connection "conn-1" has had N consecutive 5xx/429 failures
    When the failure threshold is crossed
    Then the circuit for "conn-1" opens
    And subsequent executions for "conn-1" are parked rather than attempted

  Scenario: An open circuit parks new work without attempting it
    Given the circuit for "conn-1" is open
    When a new Execution for "conn-1" becomes due for dispatch
    Then no outbound call is made
    And the execution is left pending/parked rather than immediately failing and
      consuming a retry attempt

  Scenario: Circuit half-opens and probes after a cooldown
    Given the circuit for "conn-1" has been open for its cooldown period
    When the next dispatch attempt for "conn-1" occurs
    Then exactly one probe call is allowed through
    And a successful probe closes the circuit again
    And a failed probe re-opens it and restarts the cooldown
```

## Considerations

- **Circuit breaker state is application-layer state, not a BullMQ concept and not
  necessarily a Postgres table** (CLAUDE.md §0.1.7): "Implement per connection... in the
  infrastructure layer behind the same gateway port used for the HTTP call." Redis is
  the natural place for this (already used for rate limiting/locks in this stack) —
  keyed by `channelConnectionId`, namespaced distinctly from `rl:*`/`lock:*`.
  "BullMQ concurrency settings are not a substitute for a circuit breaker" — don't
  conflate the two.
- **Distinct from rate limiting (task 022) and retry/dead-letter (task 023)**: rate
  limiting paces *good* traffic; circuit breaking stops sending *any* traffic to a
  connection that's demonstrably broken right now. A connection can be within its rate
  limit and still have its circuit open.
- **Failure threshold and cooldown duration** aren't specified numerically in the
  design doc — pick reasonable defaults (e.g. 5 consecutive failures, 60s cooldown) and
  document them; likely worth making these configurable per adapter/platform rather
  than one global constant, since platforms differ in how tolerant they are.
- **Interacts with task 013 (parked executions on auth failure)**: an open circuit and
  a `needs_reauth` connection produce a similar visible symptom ("nothing's being sent
  right now") but are different mechanisms with different recovery paths — don't merge
  their implementations even though they look similar from the outside.

# 034 — System reprompts a bounded number of times then hands off

**Phase:** 5 — Flows · **Priority:** P1 · **Depends on:** [033](033-system-advances-a-flow-session.md)
**Access control:** System-internal

## Story

As the system, when a customer's reply doesn't match any expected answer at the
current flow step, I want to re-ask the question a limited number of times and then
hand off rather than getting stuck, so that a confused customer isn't stuck in an
infinite loop with a bot.

## Acceptance criteria

```gherkin
Feature: Bounded reprompting

  Scenario: A non-matching reply triggers a reprompt
    Given FlowSession "session-1" is at step "ask_location" with onNoMatch.max = 2 and
      repromptCount = 0
    When a reply arrives that matches none of the step's expectations
    Then the reprompt message is sent
    And repromptCount increments to 1
    And the session remains "awaiting" at the same step

  Scenario: Reprompt budget exhausted hands off
    Given FlowSession "session-1" is at step "ask_location" with onNoMatch.max = 2 and
      repromptCount = 2
    When another non-matching reply arrives
    Then the session hands off per the step's onNoMatch.then value (e.g. "assistant" or
      a human-handoff signal)
    And the session does not reprompt a third time

  Scenario: A matching reply resets the reprompt count implicitly
    Given a session successfully advances to a new step (task 033)
    Then that new step's own repromptCount starts fresh at 0 — reprompts don't carry
      over between steps
```

## Considerations

- **Explicit design requirement** (design doc §6.6 point 3): "Without `max`, a customer
  who types something unexpected receives the same question forever." The
  `FlowSession.incrementReprompt()` entity method (already built) is exactly the
  counter this task drives; the new work is the routing decision (reprompt vs. hand
  off) based on comparing it to the step's configured `onNoMatch.max`.
- **`onNoMatch.then` can point at "assistant"** per the design doc's example JSON — but
  the `assistant` module is out of scope for this backlog (per the earlier LLM-scope
  decision). This task should implement the hand-off *mechanism* (closing/pausing the
  flow session and signaling a handoff target) without assuming the assistant module
  exists to receive it yet — document the handoff target as a no-op/logged event until
  assistant is built, rather than blocking this task on assistant's existence.
- **Reprompt count resets per-step, not per-session** — confirm this reading of the
  design doc's JSON example (`repromptCount` conceptually lives with the interaction at
  a given step) against the actual schema, since `FlowSession.repromptCount` is
  currently a single session-level counter, not per-step. This may need either a
  schema adjustment (track reprompt count per step visited) or a product decision that
  the counter is intentionally session-wide, not step-wide — flagging as an open
  question since the current schema and the design doc's implied per-step semantics
  may not match.

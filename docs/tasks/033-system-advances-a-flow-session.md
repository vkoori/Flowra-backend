# 033 — System advances a flow session when a reply matches an expected answer

**Phase:** 5 — Flows · **Priority:** P1 · **Depends on:** [015](015-system-ingests-a-direct-message.md), [032](032-manager-creates-a-multi-step-flow.md)
**Access control:** System-internal

## Story

As the system, when a reply to an active flow session matches one of the current
step's expected answers, I want to advance the session to the next step and run
whatever it does (send a message, evaluate a branch, run an action), so that the
dialogue actually progresses.

## Acceptance criteria

```gherkin
Feature: Advance a flow session

  Scenario: A message matches an "ask" step's expectation and advances
    Given FlowSession "session-1" is "awaiting" at step "ask_location" with expects
      matching "yes"/"yeah" -> "send_price" and "no"/"nope" -> "no_shipping"
    When a new message "yeah, I am" arrives on the session's conversation
    Then the session's context is updated (saveAs field set)
    And the session advances to step "send_price"
    And that step's action runs (e.g. sends a price message)

  Scenario: Routing precedence — an active session takes priority over rule matching
    Given a conversation has an "awaiting" FlowSession
    And the same message would also match one of the account's rules
    When the message arrives
    Then it is routed to the flow session's step evaluation, not to rule matching
      (design doc §6.6's routing precedence flowchart)

  Scenario: No active session falls through to rule matching
    Given a conversation has no "awaiting" FlowSession
    When a message arrives
    Then it is routed to rule matching (task 018) instead

  Scenario: A flow reaches its "end" step
    Given a session advances into a step of type "end"
    Then the session transitions to "completed"
```

## Considerations

- **This is the step executor** — explicitly deferred during the earlier
  domain-modeling session ("do NOT implement the actual step executor... application-
  layer work"). This task is where it gets built, on top of the already-built
  `FlowSession.advanceTo()`/`.complete()` entity methods.
- **Routing precedence is a specific, ordered decision tree** (design doc §6.6's
  flowchart): escape keyword check (task 038) first, then active-session check, then
  step-expectation match, then reprompt-or-handoff (task 034) on no match. Implement
  this as one explicit routing function, not scattered conditionals across ingestion
  and automation.
- **`action` steps reuse the same ActionRunner registry as rules** — don't build a
  second action-execution path; a flow's `action` step should produce an `Execution`
  row exactly like a rule's action does, with `originType = 'flow'` and `originId` set
  to the FlowSession's id (already the schema's intended shape).
- **`branch` steps reuse the same condition tree as rules** (design doc §6.6: "a
  mid-dialogue 'is a follower' check needs no new code") — same reuse principle as task
  032's action-step note.
- **Per-conversation serialization is required for this task to be correct** — see task
  036; don't build/test this in isolation from that locking requirement, since a race
  between two near-simultaneous messages is exactly where step-advancement bugs
  actually surface.

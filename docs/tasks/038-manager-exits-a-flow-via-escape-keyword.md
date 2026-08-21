# 038 — Manager (end customer) exits an active flow via an escape keyword

**Phase:** 5 — Flows · **Priority:** P2 · **Depends on:** [033](033-system-advances-a-flow-session.md)
**Access control:** Public (the end customer messaging in, not the managing "manager" role — see Considerations)

## Story

As a customer in the middle of an automated dialogue, I want to be able to type
something like "stop" or "human" and immediately fall through to normal handling
instead of being stuck answering the bot's question, so that I always have an escape
hatch.

## Acceptance criteria

```gherkin
Feature: Escape keyword

  Scenario: An escape keyword closes the session and falls through to rule matching
    Given FlowSession "session-1" is "awaiting" at some step
    When a message containing an escape keyword (e.g. "stop") arrives
    Then "session-1" is closed (via its existing close() method)
    And the message is then evaluated against the account's rules (task 018), not
      treated as an answer to the flow's current question

  Scenario: Escape check happens before the active-session check
    Given a conversation has an "awaiting" FlowSession
    When a message containing an escape keyword arrives
    Then it is recognized as an escape *before* being matched against the current
      step's expectations — design doc §6.6's routing flowchart puts this check first
```

## Considerations

- **Access-control note**: unlike every other Phase 5 task, the *caller* here is the
  end customer messaging the connected account, not a Flowra "manager" — there is no
  authentication on this path at all (it arrives via the same public webhook ingestion
  as any other inbound message). Listed as "Public" for that reason, distinct from the
  Social-network-administrator-scoped tasks around it.
- **What counts as an escape keyword is configuration, not a hard-coded list** — likely
  either a fixed system-wide set (e.g. "stop", "cancel") or configurable per flow;
  design doc §6.6 names the concept but not the exact keyword set or where it's
  configured — flagging as an open product decision, defaulting to a small hard-coded
  set (documented) if no configuration surface exists yet.
- **This is the first branch in design doc §6.6's routing flowchart** — sequencing
  matters for task 033's implementation: escape check, then active-session check, then
  step-match, then reprompt/handoff (task 034). Get the order right; an escape keyword
  that only works when no session is active isn't the feature this task describes.

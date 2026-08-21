# 037 — A running flow session keeps its pinned flow version when the flow is edited

**Phase:** 5 — Flows · **Priority:** P1 · **Depends on:** [032](032-manager-creates-a-multi-step-flow.md), [033](033-system-advances-a-flow-session.md)
**Access control:** System-internal (a consequence of how tasks 032/033 are built, not a separate endpoint)

## Story

As the system, I want an in-progress flow session to keep running against the exact
flow version it started on, even if the manager edits the flow mid-conversation, so
that live dialogues are never corrupted by a concurrent edit.

## Acceptance criteria

```gherkin
Feature: Flow session version pinning

  Scenario: An edit during a live session does not affect that session
    Given FlowSession "session-1" was created against FlowVersion "v1" of flow "flow-1"
    And "session-1" is currently "awaiting"
    When the manager edits "flow-1", creating FlowVersion "v2"
    Then "session-1" continues to reference "v1" and keeps stepping through "v1"'s graph
    And "v1" itself is never mutated (it can't be — FlowVersion has no update path)

  Scenario: A new session started after the edit uses the new version
    Given flow "flow-1" now has FlowVersion "v2" as its latest
    When a new trigger starts a fresh FlowSession for "flow-1"
    Then that new session references "v2", not "v1"

  Scenario: Session finishes on the old version
    Given "session-1" is running against "v1" while "v2" exists
    When "session-1" reaches its "end" step
    Then it completes normally using "v1"'s graph throughout — it never "jumps" to "v2"
      mid-dialogue
```

## Considerations

- **Explicit design requirement** (design doc §6.6 point 4): "Editing a flow must not
  corrupt live dialogues; running sessions finish on the old version." This is really
  a confirmation/verification task on top of what tasks 032 (immutable `FlowVersion`,
  `create()`-only repository) and 033 (`FlowSession.flowVersionId` set once at session
  creation, never reassigned) already establish structurally — there is no code path
  that would repoint an existing session at a new version, by construction.
- **Why this is still worth its own task**: it's the kind of invariant that's easy to
  silently break with a "helpful" change later (e.g. someone adding a "always use the
  latest version" convenience feature without realizing it corrupts in-flight
  dialogues) — worth an explicit regression test asserting the pinning behavior, not
  just an emergent property nobody actively verifies.
- **No new schema or use case work** — this task is primarily a test-writing and
  documentation task confirming behavior tasks 032/033 already provide by construction.

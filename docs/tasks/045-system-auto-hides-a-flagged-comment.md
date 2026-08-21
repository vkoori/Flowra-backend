# 045 — System auto-hides a flagged comment when the connection supports it

**Phase:** 7 — Moderation, deterministic layer only · **Priority:** P2 · **Depends on:** [009](009-system-probes-connection-capabilities.md), [044](044-system-runs-deterministic-abuse-checks.md)
**Access control:** System-internal

## Story

As the system, when a comment is flagged by the deterministic moderation checks, I
want to hide it immediately on platforms that support hiding, so that abusive content
stops being publicly visible right away rather than waiting for a manager to review it
first.

## Acceptance criteria

```gherkin
Feature: Auto-hide on flag

  Scenario: Connection supports HIDE_COMMENT
    Given a ModerationDecision was just created for a comment on a connection whose
      capabilities include HIDE_COMMENT
    When the decision is created
    Then the comment is hidden on the platform immediately
    And the ModerationDecision remains "pending" (hiding is not the same as resolving —
      a manager still needs to approve or restore it, task 046)

  Scenario: Connection does not support HIDE_COMMENT
    Given a connection's capabilities do not include HIDE_COMMENT
    When a ModerationDecision is created for a comment on it
    Then no hide action is attempted
    And the ModerationDecision is still created and queued for manager review, just
      without the auto-hide step

  Scenario: Hiding is reversible; this task never deletes anything
    Given a comment was auto-hidden
    Then the comment itself still exists on the platform, merely hidden — this task
      must never call a delete/remove action (design doc §6.7: "Hiding is reversible;
      deleting is not")
```

## Considerations

- **Capability-gated, per task 009's discovery mechanism** — never assume
  `HIDE_COMMENT` is available; check the connection's stored capability set before
  attempting the call, exactly the same discipline as every other capability-gated
  action in this backlog (e.g. task 016's rule-creation capability check).
- **"Hide" is explicitly, deliberately not "delete"** — this is a stated design
  principle (design doc §6.7), not an incidental implementation detail. If a future
  task ever proposes auto-deleting flagged content, that would need its own explicit
  product decision — this task's action is hide only.
- **This produces an `Execution`-shaped side effect** (an outbound platform call) —
  reuse the same ActionRunner/dispatch machinery (tasks 018/022/023) rather than
  building a separate direct-call path outside the retry/rate-limit/circuit-breaker
  protections everything else gets.
- **Does not resolve the ModerationDecision** — hiding and reviewing are separate
  concerns; a hidden comment still needs a manager's approve/restore action (task 046)
  before it's considered "handled."

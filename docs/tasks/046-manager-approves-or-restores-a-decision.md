# 046 — Manager approves or restores a moderation decision

**Phase:** 7 — Moderation, deterministic layer only · **Priority:** P2 · **Depends on:** [044](044-system-runs-deterministic-abuse-checks.md)
**Access control:** Social-network administrator (scoped to the target social account)

## Story

As a manager, I want to review flagged comments and either confirm the system's
decision or restore a wrongly-hidden one, so that automated moderation stays under
human oversight rather than silently and permanently hiding content.

## Acceptance criteria

```gherkin
Feature: Review a moderation decision

  Scenario: Approving a flagged decision
    Given ModerationDecision "decision-1" is "pending" for a comment on social account
      "sa-1", which I manage
    When I approve it
    Then "decision-1" transitions to "approved"
    And decidedByUserId/decidedAt are recorded
    And the comment remains hidden (if it was auto-hidden by task 045) — approving
      confirms the hide, it doesn't reverse it

  Scenario: Restoring a wrongly-flagged decision
    Given ModerationDecision "decision-1" is "pending" and its comment was auto-hidden
    When I restore it
    Then "decision-1" transitions to "restored"
    And the comment is unhidden on the platform
    And decidedByUserId/decidedAt are recorded

  Scenario: Cannot re-decide an already-resolved decision
    Given ModerationDecision "decision-1" is already "approved" or "restored"
    When I try to approve or restore it again
    Then the request is rejected with a conflict error
      (ModerationDecisionAlreadyResolvedError)

  Scenario: Cannot review a decision on an account I don't manage
    Given ModerationDecision "decision-3" belongs to social account "sa-3", which I
      don't manage
    When I try to approve or restore it
    Then the request is rejected with a forbidden error
```

## Considerations

- **The domain logic already exists** — `ModerationDecision.approve()`/`.restore()`
  were built this session exactly to this spec, throwing
  `ModerationDecisionAlreadyResolvedError` on a repeat call. This task wires the
  use case + controller + (for restore) the actual unhide platform call.
- **"Restore" must call the platform's unhide action** — this is a real outbound side
  effect (design doc §6.7: "opt restored: unhide comment"), going through the same
  ActionRunner/dispatch machinery as any other platform call (retry/rate-limit/circuit
  breaker all still apply — an unhide call can fail transiently just like a send).
- **This is the review-queue surface** the design doc refers to in the module map
  ("moderation: classification, review queue") — likely paired with a "list pending
  decisions for my accounts" read endpoint (same shape as task 010/025's list
  patterns), even though the design doc doesn't spell that out as its own journey.

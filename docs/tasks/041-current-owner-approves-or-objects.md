# 041 — Current owner approves or objects to a pending claim

**Phase:** 6 — Ownership transfer · **Priority:** P2 · **Depends on:** [040](040-current-owner-notified-with-objection-window.md)
**Access control:** Social-network administrator (only the current tenure holder for the contested account may respond)

## Story

As the current owner of a contested social account, I want to explicitly approve or
object to a pending claim, so that the outcome reflects my actual wishes rather than
just whatever happens if I do nothing.

## Acceptance criteria

```gherkin
Feature: Respond to a pending claim

  Scenario: Current owner approves — transfer proceeds
    Given social account "sa-1" has a pending AccountTransfer with objectionDeadlineAt
      in the future
    And I hold "sa-1"'s current active AccountTenure
    When I approve the transfer
    Then I am asked whether configuration should carry over (default no — task 042)
    And my tenure is closed with endReason "transferred"
    And a new AccountTenure is opened for the claimant
    And the ChannelConnection's authorizedByUserId is updated to the claimant
    And an audit_log entry is written (task 043)

  Scenario: Current owner objects — transfer is rejected
    Given social account "sa-1" has a pending AccountTransfer
    And I hold "sa-1"'s current active AccountTenure
    When I object to the transfer
    Then the AccountTransfer's status becomes "rejected"
    And my tenure and the existing ChannelConnection are completely unaffected
    And the claimant is informed their claim was denied

  Scenario: Someone other than the current owner tries to respond
    Given a different user (not the current tenure holder) tries to approve/object to
      a transfer for "sa-1"
    When they attempt this action
    Then the request is rejected with a forbidden error

  Scenario: Responding after the objection deadline has passed
    Given a transfer's objectionDeadlineAt is already in the past
    When the current owner tries to object at this point
    Then [OPEN QUESTION — see Considerations: is a late objection still honored if the
      auto-approval sweep (task 040) hasn't run yet, or is the deadline a hard cutoff
      regardless of whether the sweep has executed? Design doc doesn't address this
      race explicitly.]
```

## Considerations

- **Directly implements design doc §6.3's sequence diagram**: "A approves or window
  expires → ask whether configuration should carry over → close A's tenure
  (end_reason=transferred) → open B's tenure → update channel_connection.authorized_by
  → write audit_log entry" for the approve path, and "A objects → mark transfer
  rejected → claim denied" for the object path.
- **`AccountTransfer.approve()`/`.reject()` entity methods already exist** (built this
  session, throwing `TransferAlreadyResolvedError` on a second attempt) — this task
  wires the use case/controller and the multi-step side effects (closing/opening
  tenures, updating the connection, writing the audit entry) around them, all in one
  transaction.
- **Open race condition flagged above**: a late objection arriving after the deadline
  but before the auto-approval sweep runs isn't addressed in the design doc. Recommend
  treating the deadline as advisory for the *sweep's* trigger condition but still
  accepting an explicit objection any time before the transfer actually resolves
  (whichever happens first, sweep or explicit response, wins) — but this is a judgment
  call, flagging for confirmation rather than assuming.
- **This task and task 042 (config carry-over) are tightly coupled** — the "ask whether
  configuration should carry over" step is part of the *same* approval flow, not a
  separate later action; listed separately here because it has its own distinct
  default-no behavior worth its own acceptance criteria.

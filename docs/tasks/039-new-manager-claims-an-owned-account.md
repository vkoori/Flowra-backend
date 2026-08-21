# 039 — New manager claims a social account already owned by someone else

**Phase:** 6 — Ownership transfer · **Priority:** P2 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md), [026](026-manager-connects-instagram-via-oauth.md)
**Access control:** Social-network administrator (the claimant must at least be a registered, authenticated manager — they just don't yet hold this specific account's tenure)

## Story

As a manager who has admin access to a page on the platform side, I want to claim it
in Flowra even though someone else currently manages it here, so that a change of
real-world ownership (e.g. I bought the business) can eventually be reflected in the
system.

## Acceptance criteria

```gherkin
Feature: Claim an already-owned account

  Scenario: OAuth/connect on an owned page opens a pending transfer
    Given social account "sa-1" has an active AccountTenure held by user "owner-A"
    When user "owner-B" successfully completes the platform's connect flow for the same
      underlying account (task 008 or 026's "found, owned by someone else" branch)
    Then a new AccountTransfer is created with status "pending", socialAccountId "sa-1",
      toUserId "owner-B"'s id, and an objectionDeadlineAt 48h out
    And "owner-A"'s tenure and existing ChannelConnection are left completely untouched
    And "owner-B" receives a "claim submitted, pending" response, not immediate access

  Scenario: A second claim while one is already pending
    Given social account "sa-1" already has a pending AccountTransfer from "owner-B"
    When user "owner-C" also attempts to connect the same account
    Then [OPEN QUESTION — see Considerations: reject the second claim outright, queue
      it, or replace the first? Design doc doesn't address concurrent competing claims.]

  Scenario: Automations keep running on the old token during the pending claim
    Given social account "sa-1" has a pending AccountTransfer
    When an inbound event arrives for "sa-1" during the pending window
    Then it is processed normally against "owner-A"'s still-active tenure and
      connection — a contested claim must not silently break a live business
      (design doc §6.3, stated explicitly)
```

## Considerations

- **A "claim" is not a new mechanism — it's the same branch already built into task
  008/026's connect flow** (the "found, owned by someone else" case). This task exists
  separately mainly to give the *resulting* `AccountTransfer` its own lifecycle
  (tasks 040/041) proper coverage — the trigger itself is covered by 008/026.
- **Open question flagged above**: concurrent competing claims on the same account
  aren't addressed in the design doc at all. A reasonable default is "reject a second
  claim while one is already pending" (simplest, avoids a queue), but this is a real
  gap worth a decision before implementation, not a silent assumption.
- **Explicit non-negotiable requirement**: "Until the moment of transfer, automations
  keep running on the old token" (design doc §6.3) — this task must NOT pause or
  degrade the current owner's automations just because a claim exists. Get this wrong
  and a contested claim becomes a denial-of-service against the current, paying
  customer.

# 040 — Current owner is notified of a claim and given an objection window

**Phase:** 6 — Ownership transfer · **Priority:** P2 · **Depends on:** [039](039-new-manager-claims-an-owned-account.md)
**Access control:** System-internal (the notification itself); the owner's *response* is task 041

## Story

As the current owner of a social account, I want to be notified immediately when
someone else claims it, and given a real window to object, so that I'm not silently
locked out of a page I still legitimately manage.

## Acceptance criteria

```gherkin
Feature: Notify current owner of a claim

  Scenario: A new pending claim triggers a notification
    Given a new AccountTransfer is created for social account "sa-1" against current
      owner "owner-A"
    When the transfer is created
    Then "owner-A" is notified (channel unspecified — see Considerations)
    And the notification clearly states the objection deadline

  Scenario: Objection window duration
    Given a transfer's objectionDeadlineAt is set at creation time
    Then it is exactly 48 hours after creation (design doc §11: "Objection window
      length for claims: 48h assumed" — an explicitly assumed, not firmly decided,
      default)

  Scenario: Window expires with no response
    Given a transfer's objectionDeadlineAt has passed
    And the current owner never responded
    When the expiry is checked (by a scheduled job or on next relevant access)
    Then the transfer proceeds as if approved (design doc §6.3: "A approves or window
      expires" are the same branch)
```

## Considerations

- **48h is explicitly marked as an assumption in the design doc itself** (§11's open
  decisions table), not a firm product decision — worth confirming it's still the
  right number before shipping, though it's a safe default to build against now.
- **Notification channel is unspecified**, same open item as task 013 — don't block
  building the transfer *state machine* on this being resolved, but the "notified"
  half of this task's Gherkin can't be marked fully done until a channel is chosen.
- **"Window expires" needs an active trigger** — nothing happens automatically in
  Postgres when a timestamp passes; either a scheduled job periodically sweeps expired-
  with-no-response transfers and auto-resolves them, or the check happens lazily on
  next access to the transfer. A scheduled sweep is more predictable (matches every
  other time-based transition in this backlog — subscription expiry, flow timeouts —
  all use the same "a job checks and acts" pattern) — recommend consistency with that.

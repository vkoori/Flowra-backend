# 048 — Scheduled job nulls a platform user ID once its conversation closes

**Phase:** 8 — Retention, purge, and log redaction · **Priority:** P2 · **Depends on:** [015](015-system-ingests-a-direct-message.md)
**Access control:** System-internal (scheduler job)

## Story

As the business, I want a customer's raw platform user id removed once their
conversation with us is closed, so that we're not holding an identifying reference to
them any longer than the conversation is actually active.

## Acceptance criteria

```gherkin
Feature: Null platform user id on conversation close

  Scenario: A closed conversation's identifying reference is nulled
    Given Conversation "conv-1" is closed (windowExpiresAt has passed, or its flow
      session ended — however "closed" is determined)
    When the scheduled job runs
    Then any raw platform-user-id field tied to "conv-1"'s participant is nulled
    And "participantHash" (the comparable-but-not-reversible hash) is left intact —
      it's needed for cooldown/analytics per design doc §6.12

  Scenario: An open conversation is untouched
    Given Conversation "conv-2" is still active (within its messaging window)
    When the scheduled job runs
    Then no fields on "conv-2" or its messages are nulled yet
```

## Considerations

- **Open schema question**: the current `Conversation`/`Message`/`InboundEvent` models
  don't have an obviously-named "raw platform user id" column distinct from
  `authorExternalId` (on `InboundEvent`) — confirm exactly which column(s) this task
  targets before implementing. `InboundEvent.authorExternalId` looks like the right
  target based on the design doc's own retention table ("Platform user ID: Kept only
  while the conversation is open, then nulled"), but this needs confirming against
  the real schema rather than assumed.
- **"Conversation is closed" needs a precise definition** for this job to know when to
  act — is it `windowExpiresAt` passing, or tied to whether any `FlowSession` on that
  conversation reached a terminal state, or both? The design doc doesn't define
  "closed" precisely enough to implement this unambiguously — flagging as a genuine
  open question rather than picking one silently.
- **Distinct from task 047**: that task purges message *content*; this task nulls an
  *identifier*. They likely run on different schedules/triggers (content TTL is a fixed
  duration; user-id nulling is triggered by conversation closure, not a fixed age) —
  don't merge them into one job just because they're both "privacy cleanup."
- **`author_ref_hash` (HMAC, per-account key) is explicitly kept indefinitely** (design
  doc §6.12) — this job must never touch that field, only the raw/reversible identifier.

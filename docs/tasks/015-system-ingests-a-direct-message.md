# 015 — System ingests an inbound direct message into a conversation

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [014](014-system-ingests-a-comment-webhook.md)
**Access control:** Public

## Story

As the system, I want to receive a platform's webhook for a new direct message,
record it the same idempotent way as a comment, and thread it into a conversation, so
that multi-turn context (used by flows) is available for later messages from the same
person.

## Acceptance criteria

```gherkin
Feature: Direct message ingestion with conversation threading

  Scenario: First DM from a new participant starts a conversation
    Given no Conversation exists for tenure "tenure-1" and participant hash "hash-abc"
    When a DM webhook arrives from that participant
    Then an InboundEvent is created (same idempotent dedupe rules as task 014)
    And a new Conversation is created for (tenure-1, hash-abc)
    And a Message is appended to it recording the inbound text

  Scenario: Subsequent DM from the same participant reuses the conversation
    Given a Conversation already exists for (tenure-1, hash-abc)
    When another DM webhook arrives from that same participant
    Then no new Conversation is created
    And a new Message is appended to the existing Conversation
    And the Conversation's windowExpiresAt is refreshed

  Scenario: Duplicate DM webhook delivery is a no-op
    Given an InboundEvent already exists for this DM's dedupeKey
    When the same webhook is redelivered
    Then no second InboundEvent or Message is created
    And the response is still 200 OK
```

## Considerations

- **Identical to task 014's ingestion mechanics** (dedupe key, fast response, 200 on
  duplicate/no-subscription) — this task adds only the conversation-threading behavior
  on top. Don't re-derive the idempotency logic separately; reuse it.
- **`windowExpiresAt` refresh is DM-specific** — design doc §6.5: "DMs have continuity;
  comments generally do not." A comment ingestion (task 014) never touches a
  Conversation at all.
- **`participantHash`, not the raw platform user id, is what a Conversation is keyed
  on** — matches design doc §6.12's retention rule (platform user IDs are only kept
  while a conversation is open, then nulled; the hash is the durable, comparable-but-not
  -reversible identifier used for cooldown/threading).
- **This produces the two "flows can hook into" primitives** (`Conversation`,
  `Message`) that Phase 5 (flows) depends on — `FlowSession.conversationId` references
  what this task creates.

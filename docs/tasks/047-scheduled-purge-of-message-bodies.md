# 047 — Scheduled job purges message bodies past their retention TTL

**Phase:** 8 — Retention, purge, and log redaction · **Priority:** P2 · **Depends on:** [015](015-system-ingests-a-direct-message.md)
**Access control:** System-internal (scheduler job)

## Story

As the business, I want comment/DM bodies deleted after a fixed retention period while
keeping the metadata row, so that we don't hold onto personal conversation content
longer than necessary, while preserving enough history for analytics and disputes.

## Acceptance criteria

```gherkin
Feature: Message body retention purge

  Scenario: A message past its TTL has its body cleared, not its row deleted
    Given a RetentionPolicy for social account "sa-1" sets a 30-day TTL on message bodies
    And Message "msg-1" is 31 days old
    When the scheduled purge job runs
    Then "msg-1"'s rawText/normalizedText are cleared (e.g. set to null/empty)
    And "msg-1"'s row still exists with its other metadata (timestamps, conversationId, etc.)

  Scenario: A message within its TTL is untouched
    Given the same 30-day TTL
    And Message "msg-2" is 5 days old
    When the scheduled purge job runs
    Then "msg-2"'s body is left intact

  Scenario: Different social accounts can have different TTLs
    Given social account "sa-1" has a 30-day TTL and "sa-2" has a 90-day TTL
    When the scheduled purge job runs
    Then each account's messages are purged according to its own RetentionPolicy, not
      a single global TTL applied to everyone
```

## Considerations

- **`RetentionPolicy` already exists** (`accounts` module, built this session, keyed
  by `socialAccountId` + `dataClass`) — this task is the first real consumer of it.
  `dataClass` for this task would be something like `"message_body"` — confirm the
  exact string convention before multiple purge jobs (this one, and whatever purges
  InboundEvent bodies) invent inconsistent values.
- **Default TTL range from the design doc**: "TTL 30–90 days" (§6.12) — a proposed
  default range, not a fixed number; actual per-account values come from
  `RetentionPolicy` rows, which presumably need to be created with sensible defaults
  when a social account is first connected (not specified where that happens — flagging
  as a gap: does task 008/026's connect flow create a default RetentionPolicy row, or
  does this purge job need to handle "no policy exists yet" by doing nothing?).
- **InboundEvent bodies need the same treatment** — the design doc's retention table
  covers "Comment / DM body" generically, which includes `InboundEvent.rawText`/
  `normalizedText`, not just `Message`. Decide whether this is one job covering both
  tables or two — recommend one job iterating both, to keep the retention policy
  interpretation logic in one place.
- **Scheduler-owned, safe at N replicas** — same `SKIP LOCKED`-style claiming discipline
  as every other scheduled job in this backlog.

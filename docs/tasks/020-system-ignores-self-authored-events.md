# 020 — System ignores events authored by the managed account itself

**Phase:** 2 — Ingestion + Automation + Dispatch (the spine) · **Priority:** P0 · **Depends on:** [014](014-system-ingests-a-comment-webhook.md), [018](018-system-matches-an-event-against-rules.md)
**Access control:** System-internal

## Story

As the system, I want to drop any inbound event that was actually authored by the
managed account itself, so that an automated reply can never trigger the very rule
that produced it and loop forever.

## Acceptance criteria

```gherkin
Feature: Self-authorship loop prevention

  Scenario: An event authored by the managed account is dropped before matching
    Given social account "sa-1" is the managed account
    When an InboundEvent arrives whose authorExternalId is "sa-1"'s own platform id
    Then the event is not evaluated against any rule
    And no Execution is created for it
    And the InboundEvent may still be recorded (for audit/history), but produces no
      automation

  Scenario: An event authored by anyone else proceeds to normal matching
    When an InboundEvent arrives whose author is not the managed account
    Then it proceeds through rule matching as normal (task 018)

  Scenario: Automation sends a reply, and the platform's own webhook for that reply arrives
    Given a rule's action sent a message as social account "sa-1"
    And the platform delivers a webhook for that outbound message as if it were a new event
    When that webhook is ingested
    Then it is recognized as self-authored and dropped before matching
    And it cannot trigger the same or any other rule
```

## Considerations

- **This is exactly the failure mode design doc §6.4 names explicitly**: "Event
  authored by the managed account itself → dropped before matching. Without this, an
  automated reply triggers the rule that produced it." This is the loop-prevention
  half of design doc §9.4.
- **Check happens before rule matching, not as a rule condition** — unlike cooldown
  (task 019), this isn't something a manager configures per rule; it's a hard-coded
  system invariant that applies to every event unconditionally. Implement it as a
  filter in the ingestion/matching pipeline, not as an optional condition type a rule
  could theoretically omit.
- **Depends on correctly resolving "is this author the managed account"** — needs the
  connector's normalized event to expose the managed account's own platform identity
  comparably to `authorExternalId` (design doc §8's `NormalizedEvent.authorExternalId`
  vs the `SocialAccount.externalAccountId` it's compared against).
- **Interacts with task 015's conversation threading**: a self-authored DM (e.g. the
  bot's own reply, if the platform ever echoes it back as an inbound webhook) should
  still be recognized and dropped the same way — don't special-case comments only.

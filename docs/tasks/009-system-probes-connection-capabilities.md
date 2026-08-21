# 009 — System probes and stores a connection's capabilities on connect

**Phase:** 1 — Accounts & Channels · **Priority:** P0 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md)
**Access control:** System-internal

## Story

As the system, I want to determine what a newly connected channel can actually do
(send messages, hide comments, check followers, ...) at connect time, so that the rest
of the product never has to assume a capability that isn't really there.

## Acceptance criteria

```gherkin
Feature: Capability discovery on connect

  Scenario: A capability the adapter supports is recorded
    Given a ChannelConnection is being created for a platform whose adapter declares
      support for SEND_MESSAGE
    When the connection is established
    Then ChannelConnection.capabilities includes SEND_MESSAGE

  Scenario: A capability the platform/adapter does not support is absent
    Given the platform's official API cannot check whether a user follows the account
      (e.g. Instagram's official Graph API, per design doc §7)
    When the connection is established
    Then ChannelConnection.capabilities does NOT include FOLLOW_CHECK

  Scenario: Capabilities are re-probed on reconnection
    Given an existing ChannelConnection is reconnected with a new token (task 008)
    When the reconnection completes
    Then capabilities are re-probed and the stored set is refreshed, not left stale
      from the original connection
```

## Considerations

- **Never assume a capability — always probe.** Design doc §7: "Capability is
  discovered, never assumed." A `Capability` enum already exists conceptually in the
  design doc (`SEND_MESSAGE, SEND_DM, DELETE_COMMENT, HIDE_COMMENT, FOLLOW_CHECK,
  READ_POSTS`) — `ChannelConnection.capabilities` (already a `String[]` column in the
  schema, built this session) is where the resolved set lands.
  Each `PlatformAdapter` implementation declares its own `capabilities: Set<Capability>`
  (design doc §8's port interface) — the connect flow intersects/derives from that.
- **Downstream consumers depend on this being correct**: task 025 (a rule condition
  requiring `FOLLOW_CHECK`) and moderation's `HIDE_COMMENT` usage (task 045) both read
  this set to decide what's even offerable — getting this wrong silently breaks those
  features later rather than failing loudly now.
- **Depends on real connector adapters existing** (`src/connectors/`, deferred) — same
  blocking dependency as task 008.
- **Not itself a user-facing action** — happens as a step inside task 008 (and task
  026's Instagram equivalent), not a separately invoked endpoint. Kept as its own task
  because it's independently testable/specifiable behavior, not because it ships as a
  separate API call.

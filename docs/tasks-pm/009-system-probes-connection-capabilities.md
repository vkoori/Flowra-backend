# 009 — System probes and stores a connection's capabilities on connect

**Phase:** 1 — Accounts & Channels · **Priority:** P0
**Depends on:** Instagram connection flow for the first release; Telegram connection flow (Story 008) when Telegram ships
**Access control:** System-internal

## Product decision

Capability discovery is a **shared channel capability**, not a Telegram-specific feature.

For the first release, this behavior must work with Instagram.

Telegram will reuse the same capability-discovery mechanism later when Story 008
is implemented in the post-MVP phase.

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
    Given an existing ChannelConnection is reconnected with a new token
    When the reconnection completes
    Then capabilities are re-probed and the stored set is refreshed, not left stale
      from the original connection
```

## Considerations

- **Never assume a capability — always probe.** Design doc §7: "Capability is
  discovered, never assumed." A `Capability` enum already exists conceptually in the
  design doc (`SEND_MESSAGE, SEND_DM, DELETE_COMMENT, HIDE_COMMENT, FOLLOW_CHECK,
  READ_POSTS`) — `ChannelConnection.capabilities` is where the resolved set lands.
- Each `PlatformAdapter` implementation declares or resolves its own supported
  capabilities. The connection flow stores the resolved capability set.
- **Downstream consumers depend on this being correct**: automation rules and
  moderation features must only offer actions or conditions that the connected
  platform actually supports.
- **First-release scope**: this mechanism must work for Instagram in the MVP.
- **Post-MVP scope**: Telegram and future channels should reuse the same mechanism
  when their connectors are added.
- **Not itself a user-facing action** — capability discovery happens as part of the
  channel connection flow, not as a separate user action or endpoint.

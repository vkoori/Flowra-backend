# 011 — Manager disconnects a channel connection

**Phase:** 1 — Accounts & Channels (inferred) · **Priority:** P1 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md)
**Access control:** Social-network administrator (scoped to the target social account)

## Story

As a manager, I want to disconnect a channel I no longer want Flowra to manage, so that
it stops receiving events and executing automations for that channel.

## Acceptance criteria

```gherkin
Feature: Disconnect a channel connection

  Scenario: Successful disconnection is a soft delete
    Given I hold the active AccountTenure for social account "sa-1"
    And "sa-1" has an active ChannelConnection
    When I disconnect that connection
    Then the ChannelConnection's deletedAt is set and status becomes "revoked"
    And the row itself is not deleted from the database

  Scenario: Disconnecting an already-disconnected connection
    Given a ChannelConnection already has deletedAt set
    When I try to disconnect it again
    Then the request is rejected with a conflict error (ConnectionAlreadyDeactivatedError)

  Scenario: Cannot disconnect a channel on an account I don't manage
    Given a different manager holds the active AccountTenure for social account "sa-3"
    When I try to disconnect a ChannelConnection under "sa-3"
    Then the request is rejected with a forbidden error
```

## Considerations

- **Soft delete only** — design doc §4's explicit constraint: "channel_connections:
  soft delete only (deleted_at)... a hard delete cascades into data loss," since rules,
  events, and tenures all reference it. The `ChannelConnection.deactivate()` entity
  method (already built this session) enforces exactly this — this task is mostly
  wiring a use case + controller on top of existing domain logic.
- **What happens to rules/executions tied to this connection?** Design doc doesn't say
  disconnecting cascades into disabling rules automatically — likely rules should
  remain as configuration (they're scoped by `social_account_id`, not by connection)
  but any *pending* execution that needs this specific connection to send a message
  will simply fail at dispatch time once the connection is gone. Worth a product
  decision on whether disconnecting should proactively cancel pending executions for
  that connection, or let them fail/dead-letter naturally — flagging as open.
- **Idempotency**: calling disconnect twice should not silently succeed the second
  time — the entity already throws `ConnectionAlreadyDeactivatedError`, surface that as
  a real conflict response, not swallow it.

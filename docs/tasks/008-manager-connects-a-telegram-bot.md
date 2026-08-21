# 008 — Manager connects a Telegram bot to a social account

**Phase:** 1 — Accounts & Channels · **Priority:** P0 · **Depends on:** [002](002-manager-logs-in-with-email-and-password.md), [003](003-system-enforces-rbac-across-routes.md)
**Access control:** Social-network administrator (the connecting user becomes the tenure holder)

## Story

As a manager, I want to connect a Telegram bot by pasting its bot token, so that Flowra
can receive and respond to messages sent to that bot on my behalf.

## Acceptance criteria

```gherkin
Feature: Connect a Telegram bot

  Scenario: First-time connection creates the social account and an open tenure
    Given no social account exists for Telegram bot id "bot-123"
    When I submit a valid bot token that resolves to bot id "bot-123"
    Then a new SocialAccount is created with platform "telegram" and that external id
    And a new AccountTenure is opened for me, with no end date
    And a new ChannelConnection is created storing the token encrypted at rest
    And I receive a "connected" response

  Scenario: Reconnecting my own already-connected bot updates the token in place
    Given a social account for Telegram bot id "bot-123" already exists
    And I hold the active AccountTenure for it
    When I submit a (possibly new) valid bot token for bot id "bot-123"
    Then the existing ChannelConnection row is updated with the new token
    And no new ChannelConnection row is created (never delete-and-recreate)
    And I receive a "reconnected" response

  Scenario: Connecting a bot already owned by someone else opens a claim
    Given a social account for Telegram bot id "bot-123" already exists
    And a different user holds its active AccountTenure
    When I submit a valid bot token for bot id "bot-123"
    Then an AccountTransfer is opened in "pending" state (see task 039)
    And I receive a "claim submitted, pending" response
    And no ChannelConnection is modified

  Scenario: Invalid bot token
    When I submit a bot token that Telegram's API rejects
    Then the connection attempt fails with a validation error
    And no SocialAccount, AccountTenure, or ChannelConnection is created
```

## Considerations

- **Not OAuth.** Telegram bots authenticate via a static bot token issued by
  `@BotFather` — there is no authorization-code redirect. "Connecting" means: manager
  pastes the token, backend calls Telegram's `getMe` to resolve the bot's identity
  (`externalAccountId`, display name) and validate the token is live.
- **Requires the Telegram connector adapter** (`src/connectors/`, explicitly deferred
  in the module-build session) — this task cannot ship until a `PlatformAdapter`
  implementation for Telegram exists with at least `resolveAccountIdentity()` wired to
  the Bot API.
- **Matches design doc §6.1's generic ownership-resolution branches** (not
  found → create; found & owned by me → update in place; found & owned by someone
  else → open a claim) even though Telegram's *connection* mechanism itself isn't OAuth.
- **Token encryption**: the raw bot token must be encrypted at rest using the existing
  `Encryptor` port (`shared/application/ports/encryptor.port.ts`) before being stored in
  `ChannelConnection.accessTokenEncrypted` — never store it in plaintext, never log it.
- **Capability probing** (what this bot can/can't do) is a separate task (009) —
  keep this task focused on establishing the connection itself.
- **This is the first of the two build-order-#1 platforms** (Telegram, "the simplest
  official API" per design doc §12) — Instagram's OAuth-based equivalent is task 026,
  intentionally later.

# 008 — Account Manager connects a Telegram bot to a social account

**Phase:** Post-MVP — Additional Channels · **Priority:** P2 · **Status:** Planned — Not included in first release
**Depends on:** [002](002-manager-logs-in-with-mobile-number-and-otp.md), [003](003-system-enforces-rbac-across-public-account-manager-system-admin-routes.md)
**Access control:** Account Manager (the connecting user becomes the tenure holder)

## Product decision

Telegram integration is part of the planned product scope, but it will **not**
be included in the first public release.

The first release will focus on Instagram.

This story should remain in the backlog for a future phase and should not block
the MVP release.

## Story

As an Account Manager, I want to connect a Telegram bot by pasting its bot token,
so that Flowra can receive and respond to messages sent to that bot on my behalf.

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
  `@BotFather` — there is no authorization-code redirect. "Connecting" means the
  Account Manager pastes the token, and the backend calls Telegram's `getMe` to
  resolve the bot's identity (`externalAccountId`, display name) and validate
  that the token is live.
- **Requires the Telegram connector adapter** (`src/connectors/`) with at least
  `resolveAccountIdentity()` wired to the Telegram Bot API.
- **Ownership resolution** follows the same generic account model:
  not found → create; found & owned by me → update in place; found & owned by
  someone else → open a claim.
- **Token encryption**: the raw bot token must be encrypted at rest before being
  stored. It must never be stored in plaintext or written to logs.
- **Capability probing** (what this bot can/can't do) is a separate task (009).
  Keep this story focused on establishing the connection itself.
- **Release scope**: this story is planned for a post-MVP phase. Instagram remains
  the only required social platform for the first release.

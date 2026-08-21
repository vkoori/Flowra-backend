# 026 — Manager connects an Instagram account via OAuth

**Phase:** 3 — Instagram official adapter · **Priority:** P1 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md), [009](009-system-probes-connection-capabilities.md)
**Access control:** Social-network administrator (the connecting user becomes the tenure holder)

## Story

As a manager, I want to connect my Instagram business account via Instagram's OAuth
flow, so that Flowra can automate replies on a second platform, not just Telegram.

## Acceptance criteria

```gherkin
Feature: Connect an Instagram account

  Scenario: First-time connection creates the social account and an open tenure
    Given no social account exists for Instagram page id "ig-123"
    When I complete Instagram's OAuth flow and grant the required permissions
    Then a new SocialAccount is created with platform "instagram" and that external id
    And a new AccountTenure is opened for me
    And a new ChannelConnection is created with the OAuth tokens encrypted at rest
    And capabilities are probed and stored (task 009)

  Scenario: Reconnecting my own already-connected page updates tokens in place
    Given I hold the active AccountTenure for Instagram page "ig-123"
    When I complete Instagram's OAuth flow again for the same page
    Then the existing ChannelConnection is updated in place, never recreated

  Scenario: Connecting a page already owned by someone else opens a claim
    Given a different user holds the active AccountTenure for Instagram page "ig-123"
    When I complete Instagram's OAuth flow for that same page
    Then an AccountTransfer is opened in "pending" state (task 039)

  Scenario: OAuth flow fails or required permissions are denied
    When the OAuth flow fails, or I deny a permission Flowra needs
    Then no SocialAccount, AccountTenure, or ChannelConnection is created
    And I see a clear error naming what went wrong (e.g. "messaging permission required")
```

## Considerations

- **This is the generic OAuth flow the design doc's §6.1 sequence diagram is actually
  written for** — unlike Telegram (task 008), Instagram genuinely uses an
  authorization-code redirect. Reuse the same *ownership-resolution* branches
  (not-found/owned-by-me/owned-by-someone-else) as task 008 — that logic should be
  platform-agnostic (lives in `accounts`, not duplicated per connector).
- **Requires a real Instagram Graph API adapter** (`src/connectors/`, deferred) —
  same blocking dependency shape as task 008, but for a materially more complex API
  surface (Graph API scopes/permissions, page vs. business-account distinction).
- **Known official-API capability gap**: design doc §7 calls out explicitly that
  "Instagram's official Graph API cannot tell you whether a user follows an account" —
  `FOLLOW_CHECK` must NOT appear in this connection's probed capabilities (task 009),
  which is exactly the scenario that task's acceptance criteria already covers.
- **Required OAuth scopes/permissions**: Instagram Graph API messaging/comment
  permissions typically require app review before they work for real (non-test) users
  in production — this is an external, non-engineering dependency (Meta's app review
  process) worth flagging as a real lead-time risk for shipping this task, not just a
  coding task.

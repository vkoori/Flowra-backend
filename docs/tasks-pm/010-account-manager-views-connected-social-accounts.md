# 010 — Account Manager views their connected social accounts

**Phase:** 1 — Accounts & Channels (inferred) · **Priority:** P0
**Depends on:** Instagram connection flow
**Access control:** Account Manager (each row scoped to accounts the caller holds an active tenure on)

## Story

As an Account Manager, I want to see a list of the social accounts I currently manage
and their connection status, so that I know what's connected, what needs attention,
and what I can configure automations for.

## Acceptance criteria

```gherkin
Feature: List connected accounts

  Scenario: Account Manager sees only accounts they hold an active tenure on
    Given I hold the active AccountTenure for social accounts "sa-1" and "sa-2"
    And another Account Manager holds the active tenure for "sa-3"
    When I request my list of connected accounts
    Then the response includes "sa-1" and "sa-2"
    And the response does not include "sa-3"

  Scenario: Connection status is visible per account
    Given social account "sa-1" has a ChannelConnection with status "needs_reauth"
    When I request my list of connected accounts
    Then "sa-1" is shown with status "needs_reauth", not silently omitted

  Scenario: No connected accounts yet
    Given I hold no active AccountTenure on any social account
    When I request my list of connected accounts
    Then I receive an empty list, not an error
```

## Considerations

- **Read-only, no state change** — purely a query use case over `accounts` and
  `channels` data, composed in application code per the project's module boundaries.
- **Scoping**: must filter by the caller's active tenures and must never return another
  Account Manager's accounts.
- **Surface connection health, not just existence** — an Account Manager needs to see
  statuses such as `needs_reauth` or `revoked`, otherwise they may not understand why
  automations have stopped.
- **Pagination**: likely unnecessary at MVP scale, but the query should still use a
  defensive page-size limit rather than being unbounded.
- **First-release scope**: this story must work with Instagram. Telegram is planned for
  a later phase and must not block this story.
- **Billing is out of scope**: this story only lists connected accounts and their
  connection status. Subscription, payment, plan status, and billing eligibility are
  handled by separate billing/subscription stories.

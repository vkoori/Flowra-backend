# 010 — Manager views their connected social accounts

**Phase:** 1 — Accounts & Channels (inferred) · **Priority:** P1 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md)
**Access control:** Social-network administrator (each row scoped to accounts the caller holds a tenure on)

## Story

As a manager, I want to see a list of the social accounts I currently manage and their
connection status, so that I know what's connected, what needs attention, and what I
can configure automations for.

## Acceptance criteria

```gherkin
Feature: List connected accounts

  Scenario: Manager sees only accounts they hold an active tenure on
    Given I hold the active AccountTenure for social accounts "sa-1" and "sa-2"
    And another manager holds the active tenure for "sa-3"
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

- **Read-only, no state change** — purely a query use case over `accounts`' and
  `channels`' data, composed in application code per CLAUDE.md §2.2 (no cross-module
  SQL join — `accounts` and `channels` are separate modules).
- **Scoping**: must filter by the caller's active tenures, never return another
  manager's accounts — this is exactly the kind of filter CLAUDE.md §10 calls out as
  belonging in one shared `PrismaScope`-style layer, not reimplemented ad hoc per query.
- **Surface connection health, not just existence** — a manager needs to see
  `needs_reauth`/`revoked` status here, otherwise task 013 (parked executions) has no
  visible product surface and the manager never finds out why their automations stopped.
- **Pagination**: likely unnecessary at MVP scale (design doc's own team assumption:
  "< 100 connected accounts in the first year" and one manager rarely manages many
  pages), but don't hard-code an unbounded query — cap the page size defensively.

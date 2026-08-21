# 012 — System refreshes an access token ahead of expiry

**Phase:** 1 — Accounts & Channels · **Priority:** P1 · **Depends on:** [008](008-manager-connects-a-telegram-bot.md), [026](026-manager-connects-instagram-via-oauth.md)
**Access control:** System-internal (scheduler job)

## Story

As the system, I want to refresh a channel connection's access token before it expires,
so that automations never fail simply because nobody logged in recently to renew it.

## Acceptance criteria

```gherkin
Feature: Proactive token refresh

  Scenario: Token nearing expiry is refreshed
    Given a ChannelConnection has tokenExpiresAt within the refresh window (e.g. 24h out)
    And the connection's status is "active"
    When the scheduled refresh job runs
    Then the platform's refresh flow is invoked
    And the connection's token fields are updated in place with the new token/expiry
    And status remains "active"

  Scenario: Refresh fails because the token was revoked externally
    Given a ChannelConnection's token was revoked on the platform's side (outside Flowra)
    When the scheduled refresh job attempts to refresh it
    Then the refresh call fails
    And the connection's status becomes "needs_reauth"
    And pending executions for that connection are parked (see task 013)

  Scenario: Connection has no refresh token / doesn't support refresh
    Given a ChannelConnection's platform adapter has no refresh mechanism (e.g. Telegram
      bot tokens don't expire and have nothing to refresh)
    When the scheduled refresh job runs
    Then that connection is simply skipped, not treated as an error
```

## Considerations

- **Scheduler-owned, safe at N replicas**: per CLAUDE.md §1, this must use
  `SELECT ... FOR UPDATE SKIP LOCKED` (or an equivalent claiming pattern) when selecting
  which connections are due for refresh, so running multiple `scheduler` replicas never
  double-refreshes the same connection concurrently.
  - Correction from CLAUDE.md's own § numbering as used elsewhere in this backlog: this
    specific requirement is design doc §9.3 (dispatcher claiming) applied to a second,
    analogous use — same mechanism, different table.
- **Platform-specific**: only OAuth-based connectors (Instagram) have a real
  refresh-token flow; Telegram bot tokens are static and never expire — the job must
  handle "nothing to do here" gracefully per adapter, not assume every connection is
  refreshable.
- **On failure, transition to `needs_reauth`**, not silently retry forever — matches
  design doc §6.10 exactly (feeds directly into task 013).
- **Depends on real connector adapters** for the actual refresh call (`src/connectors/`,
  deferred) — this task's *scheduling and status-transition* logic can be built and
  tested against a fake/mock adapter ahead of a real one existing.

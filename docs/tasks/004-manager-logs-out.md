# 004 — Manager logs out

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** [002](002-manager-logs-in-with-email-and-password.md), [003](003-system-enforces-rbac-across-routes.md)
**Access control:** Social-network administrator (any authenticated manager, not scoped to a specific social account)

## Story

As a logged-in manager, I want to log out, so that my session token can no longer be
used if it's later exposed or if I'm on a shared device.

## Acceptance criteria

```gherkin
Feature: Manager logout

  Scenario: Successful logout revokes the refresh token
    Given I am logged in and hold a valid access token and refresh token
    When I log out
    Then my refresh token is revoked and can no longer be exchanged for a new access token
    And my current access token remains valid only until its own short expiry elapses

  Scenario: Logging out twice
    Given I have already logged out once
    When I try to log out again with the same (already-revoked) refresh token
    Then the request succeeds as a no-op rather than erroring
```

## Considerations

- **Depends entirely on task 002's refresh-token decision.** If task 002 ships
  access-token-only (no refresh token), "logout" for a stateless JWT has no
  server-side effect to perform beyond telling the client to discard the token — in
  that case this task reduces to a client-side instruction and a documented
  short-expiry window, not a real backend operation. If task 002 ships a server-side
  refresh token, this task revokes it (e.g. delete/invalidate its row or its Redis key).
- **Do not build a token blocklist for access tokens** unless a real requirement
  demands instant revocation — that reintroduces server-side state for something JWTs
  are specifically meant to avoid. Prefer: short access-token expiry + revocable
  refresh token, which is the standard trade-off.
- **Idempotent**: logging out twice, or logging out with an already-expired/revoked
  token, should not error — the end state ("not logged in") is already achieved.

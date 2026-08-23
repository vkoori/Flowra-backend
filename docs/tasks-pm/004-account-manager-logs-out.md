# 004 — Account Manager logs out

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** [002](002-manager-logs-in-with-mobile-number-and-otp.md), [003](003-system-enforces-rbac-across-public-account-manager-system-admin-routes.md)
**Access control:** Account Manager (any authenticated account manager, not scoped to a specific social account)

## Story

As a logged-in Account Manager, I want to log out, so that my session token can no longer be
used if it's later exposed or if I'm on a shared device.

## Acceptance criteria

```gherkin
Feature: Account Manager logout

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

- **Refresh token is required for the MVP authentication flow.** Story 002 should issue
  a short-lived access token together with a longer-lived, server-side revocable refresh
  token after successful mobile-number + OTP authentication.
- **Logout revokes the refresh token** so it can no longer be used to obtain a new
  access token.
- **Access tokens remain short-lived** and do not need to be immediately revoked on
  logout. The current access token remains valid only until its own expiry.
- **Do not build a token blocklist for access tokens** unless a future requirement
  demands instant revocation. Prefer short access-token expiry + revocable refresh token.
- **Idempotent**: logging out twice, or logging out with an already-expired/revoked
  refresh token, should not error — the end state ("not logged in") is already achieved.
- **Authentication method**: this logout behavior applies to the mobile-number + OTP
  authentication flow defined in Stories 001 and 002. Email/password authentication is
  not part of the MVP.

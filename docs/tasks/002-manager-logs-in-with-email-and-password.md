# 002 — Manager logs in with email or mobile number and password

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** [001](001-manager-registers-with-email-and-password.md)
**Access control:** Public

## Story

As a registered manager, I want to log in with either my email or my mobile number
plus my password, so that I receive a JWT I can use to call authenticated routes.

## Acceptance criteria

```gherkin
Feature: Manager login

  Scenario: Successful login with email
    Given a user is registered with email "manager@example.com" and password "Str0ng-Pass!"
    When I log in with email "manager@example.com" and password "Str0ng-Pass!"
    Then I receive a signed JWT access token
    And the token's claims include my user id and role
    And the token has a bounded expiry (not infinite)

  Scenario: Successful login with mobile number
    Given a user is registered with mobile number "+971501234567" and password "Str0ng-Pass!"
    When I log in with mobile number "+971501234567" and password "Str0ng-Pass!"
    Then I receive a signed JWT access token

  Scenario: Wrong password
    Given a user is registered with email "manager@example.com" and password "Str0ng-Pass!"
    When I log in with email "manager@example.com" and password "wrong-password"
    Then the login is rejected with an unauthorized error
    And no token is issued
    And the error message does not reveal whether the email exists or the password was wrong

  Scenario: Unknown identifier
    Given no user is registered with email "nobody@example.com"
    When I log in with email "nobody@example.com" and any password
    Then the login is rejected with the same unauthorized error as a wrong password
```

## Considerations

- **JWT**: access token signed with a server-held secret/key (HS256 or RS256 — pick one
  and document it; RS256 if any other service ever needs to verify tokens without
  sharing the signing secret). Claims: `sub` (user id), `role` (see task 003 — RBAC),
  `iat`, `exp`. Short-lived (e.g. 15–60 minutes) — see task 004 (logout) and the refresh
  strategy note below.
- **Refresh tokens**: a bare short-lived access token with no refresh mechanism forces
  re-login every expiry; decide whether to issue a longer-lived refresh token (stored
  server-side, revocable — Redis is already available in this stack for exactly this)
  or accept frequent re-logins for the MVP. Not blocking this task, but the answer
  shapes task 004 (logout) — document the choice made when this ships.
- **Identical error for "unknown identifier" vs "wrong password"**: prevents
  account-enumeration via the login endpoint.
- **Rate limiting**: brute-force protection on login attempts (per identifier and/or per
  IP) — reuse the Redis-backed rate-limiting infrastructure already planned for
  per-connection token buckets (design doc §9.6), namespaced separately (`rl:login:*`).
- **Password verification**: constant-time comparison via the hashing library's own
  `compare`/`verify` function — never a manual string comparison.
- **Schema**: depends on task 001's `phoneNumber` column addition to `User`.

# 006 — Manager signs in with a phone number (SMS OTP)

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P1 · **Depends on:** [001](001-manager-registers-with-email-and-password.md) (schema), [002](002-manager-logs-in-with-email-and-password.md), [003](003-system-enforces-rbac-across-routes.md)
**Access control:** Public

## Story

As a manager, I want to sign in using just my mobile number and a one-time code sent by
SMS, so that I can access my account without remembering a password, and so that a
first-time visitor can get an account without a separate registration step.

## Acceptance criteria

```gherkin
Feature: Phone OTP sign-in

  Scenario: Request a code for a new mobile number
    Given no user exists with mobile number "+971501234567"
    When I request an OTP for "+971501234567"
    Then a one-time code is generated and sent by SMS to that number
    And no user row is created yet (creation happens on successful verification)

  Scenario: Request a code for an existing mobile number
    Given a user already exists with mobile number "+971501234567"
    When I request an OTP for "+971501234567"
    Then a one-time code is generated and sent by SMS to that number

  Scenario: Verify a correct code for a new number creates an account and logs in
    Given an OTP was requested for "+971501234567" and no user exists for it yet
    When I submit the correct code before it expires
    Then a new user is created with that mobile number, no password set
    And I receive a signed JWT access token

  Scenario: Verify a correct code for an existing number logs in
    Given an OTP was requested for "+971501234567" and a user already exists for it
    When I submit the correct code before it expires
    Then I receive a signed JWT access token for that existing user
    And no duplicate user is created

  Scenario: Wrong or expired code
    Given an OTP was requested for "+971501234567"
    When I submit an incorrect code, or the correct code after it has expired
    Then the request is rejected with an unauthorized error
    And no token is issued

  Scenario: Repeated OTP requests are rate-limited
    Given an OTP was requested for "+971501234567" less than N seconds ago
    When I request another OTP for the same number immediately
    Then the request is rejected or throttled, rather than sending another SMS immediately
```

## Considerations

- **Implicit registration**: unlike task 001/002, this flow merges registration and
  login into one — there's no separate "sign up with phone" step, matching how OTP
  auth normally works (see README's note distinguishing this from task 001's
  password-based mobile registration).
- **A user created via OTP has no password.** `passwordHash` becomes properly optional
  on `User` (already implied by task 001's schema change, since email is also becoming
  optional) — enforce "at least one of {password set with an identifier, phone number
  verified}" rather than requiring a password universally.
- **SMS provider**: not yet chosen — this is a new external dependency (a gateway like
  Twilio or a regional SMS provider). Needs its own port (`SmsGateway` in
  `shared/application/ports/`) + adapter, following the same pattern as `StorageGateway`.
  Cost per SMS matters here (unlike email) — worth flagging as a real operating cost,
  not just an engineering task.
- **OTP properties**: numeric code (e.g. 6 digits), short expiry (e.g. 5 minutes),
  single-use, rate-limited per number and per IP (both to control SMS cost and to
  block brute-forcing the code — 6 digits is only 1,000,000 possibilities, so also cap
  verification attempts per requested code, not just requests).
- **Store the OTP hashed**, not in plaintext, same principle as passwords/reset tokens.

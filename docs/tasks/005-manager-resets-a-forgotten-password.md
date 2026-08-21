# 005 — Manager resets a forgotten password

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** [001](001-manager-registers-with-email-and-password.md)
**Access control:** Public

## Story

As a manager who forgot my password, I want to reset it using my email or mobile
number, so that I can regain access to my account without contacting support.

## Acceptance criteria

```gherkin
Feature: Password reset

  Scenario: Request a reset link/code for a known identifier
    Given a user is registered with email "manager@example.com"
    When I request a password reset for "manager@example.com"
    Then a single-use, time-limited reset token is created
    And a reset email is sent to "manager@example.com" containing that token
    And I receive a generic success response regardless of whether the email exists

  Scenario: Request a reset code for an unknown identifier
    When I request a password reset for "nobody@example.com"
    Then I receive the same generic success response as the known-identifier case
    And no reset token is created and no email is sent

  Scenario: Complete a reset with a valid token
    Given a valid, unexpired reset token exists for "manager@example.com"
    When I submit that token with a new password "New-Str0ng-Pass!"
    Then the user's password hash is updated
    And the reset token is invalidated (single-use)
    And all existing refresh tokens/sessions for that user are revoked

  Scenario: Reuse an already-used or expired token
    Given a reset token has already been used, or has expired
    When I submit that token with a new password
    Then the request is rejected with an error
    And the password is not changed
```

## Considerations

- **Generic response on request, always** — never reveal whether the identifier exists,
  for the same enumeration reasons as task 001/002.
- **Delivery channel**: email for the email-registered path; SMS for the
  mobile-registered path (depends on whichever provider task 006 picks for OTP delivery
  — reuse the same SMS gateway rather than integrating a second one).
- **Token properties**: single-use, short expiry (e.g. 15–30 minutes), cryptographically
  random, stored hashed (never store the raw reset token — same principle as passwords,
  in case the storage leaks).
- **Revoke sessions on successful reset**: if someone else gained account access, a
  successful password reset should also kill any refresh tokens issued before the
  reset, not just change the password. Depends on task 002's refresh-token mechanism.
- **Rate limit reset requests** per identifier and per IP to prevent using this endpoint
  as a spam/harassment vector (flooding someone's inbox/SMS with reset attempts).

# 005 — Manager resets a forgotten password

**Phase:** 0 — Identity & access control · **Priority:** Removed / Not Applicable
**Status:** Removed by product decision
**Depends on:** none
**Access control:** N/A

## Product decision

This story is intentionally **removed from the MVP**.

The product no longer supports email/password authentication.

Manager authentication is mobile-only and passwordless:

**Mobile number → OTP → Authenticate**

Because managers do not create or use passwords, there is no "Forgot Password"
or "Reset Password" flow to implement.

## Reason for removal

The original version of this story assumed that a manager could authenticate
using an email address or mobile number together with a password.

That authentication model has been replaced by the product decision defined in
Stories 001 and 002:

- Email is not used for registration or login.
- Passwords are not created, stored, or used.
- Registration and login use the manager's mobile number and OTP.
- The user-facing authentication flow does not require a separate password-recovery process.

As a result, the following behaviors are no longer required:

- Forgot Password screen or endpoint
- Password reset email
- Password reset SMS
- Password reset token
- New-password creation
- Password-hash update
- Password reset expiration/reuse logic
- Session revocation specifically caused by a password reset

## Acceptance criteria

```gherkin
Feature: Password reset is not part of the product

  Scenario: Manager looks for a forgotten-password flow
    Given the product uses mobile-number + OTP authentication
    When a manager wants to access their account
    Then the manager authenticates using their mobile number and OTP
    And no password-reset flow is required
```

## Future consideration — Account Recovery

A separate **Account Recovery** story may be required in a future phase.

For example, account recovery may be needed when a manager:

- loses access to their registered mobile number
- changes their mobile number and cannot receive OTP on the old number
- has a SIM card that is lost, disabled, or permanently unavailable

Account Recovery is **not the same as Forgot Password** and should be designed as
a separate product flow with its own identity-verification and security requirements.

It is outside the scope of the MVP unless explicitly prioritized by the PM.

## Note

This file is intentionally retained as Story 005 so that backlog numbering and
references remain stable. It should not be implemented unless the product
authentication model changes in the future.

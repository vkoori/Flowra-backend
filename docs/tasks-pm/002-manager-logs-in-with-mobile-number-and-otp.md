# 002 — Manager logs in with mobile number and OTP

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** [001](001-manager-registers-with-mobile-number-and-otp.md)
**Access control:** Public

## Product decision

For the MVP, authentication is **mobile-only and passwordless**.

Managers do not choose between separate "Register" and "Login" experiences.

The user-facing authentication flow is:

**Mobile number → OTP → Authenticate**

After successful OTP verification:

- If an account already exists for that mobile number, the manager is logged in.
- If no account exists for that mobile number, a new manager account is created and the manager is logged in.

Email and password authentication are not supported in the MVP.

## Story

As a manager, I want to enter my mobile number and verify it using a one-time
password (OTP), so that I can access the platform without needing to know whether
I should register or log in first.

## Acceptance criteria

```gherkin
Feature: Manager authentication with mobile number and OTP

  Scenario: OTP is sent to a valid mobile number
    When I submit mobile number "+989121234567"
    Then the mobile number is validated and normalized
    And a one-time password is generated
    And the OTP is sent to that mobile number
    And no authenticated session is created before OTP verification succeeds

  Scenario: Existing manager successfully logs in
    Given a manager already exists with mobile number "+989121234567"
    And a valid OTP has been sent to that mobile number
    When I submit the correct OTP
    Then the OTP is verified
    And no new user account is created
    And I receive a signed JWT access token
    And the token's claims include my user id and role
    And the token has a bounded expiry

  Scenario: New manager is automatically registered and authenticated
    Given no manager exists with mobile number "+989121234567"
    And a valid OTP has been sent to that mobile number
    When I submit the correct OTP
    Then a new manager account is created for that mobile number
    And the mobile number is stored in normalized format
    And I receive a signed JWT access token
    And the token's claims include my user id and role
    And the token has a bounded expiry

  Scenario: Mobile number is missing
    When I try to request an OTP without a mobile number
    Then the request is rejected with a validation error
    And no OTP is sent
    And no authenticated session is created

  Scenario: Mobile number is invalid
    When I submit an invalid mobile number
    Then the request is rejected with a validation error
    And no OTP is sent
    And no authenticated session is created

  Scenario: Incorrect OTP
    Given a valid OTP has been sent to mobile number "+989121234567"
    When I submit an incorrect OTP
    Then authentication is rejected with an unauthorized or validation error
    And no JWT access token is issued
    And no new user account is created

  Scenario: Expired OTP
    Given an OTP was sent to mobile number "+989121234567"
    And the OTP has expired
    When I submit that OTP
    Then authentication is rejected
    And no JWT access token is issued
    And no new user account is created

  Scenario: OTP cannot be reused
    Given I successfully authenticated using an OTP
    When I submit the same OTP again
    Then authentication is rejected
    And no additional session is created using that OTP

  Scenario: OTP resend is rate-limited
    Given an OTP has recently been sent to mobile number "+989121234567"
    When I repeatedly request another OTP within the resend cooldown period
    Then additional OTP requests are rate-limited
    And the response does not expose sensitive account information
```

## Considerations

- **Single authentication UX**: the product must not ask the manager to choose
  between "Register" and "Login" before entering their mobile number. The system
  determines the correct outcome after OTP verification.
- **Existing user**: successful OTP verification authenticates the existing manager.
- **New user**: successful OTP verification creates the manager account and
  authenticates it in the same flow.
- **Mobile-only identity**: email is not used as an authentication identifier in the MVP.
- **No password**: no password is collected, stored, hashed, verified, or required.
- **Mobile number format**: validate and normalize mobile numbers at the boundary.
  Iranian mobile numbers must be supported and a consistent representation such as
  E.164 (`+989121234567`) should be used.
- **OTP delivery**: the authentication flow requires an SMS provider that can reliably
  deliver OTP messages to Iranian mobile numbers.
- **OTP security**: OTPs must be short-lived, single-use, and must never be stored or
  logged in plain text. Verification attempts must be limited.
- **OTP resend protection**: enforce a resend cooldown and rate-limit OTP requests per
  mobile number and/or IP to reduce abuse and SMS cost.
- **Account creation timing**: for a new mobile number, the user account must only be
  created after successful OTP verification.
- **JWT**: after successful authentication, issue a signed access token with a bounded
  expiry. Claims should include at least `sub` (user id), `role`, `iat`, and `exp`.
- **Refresh tokens**: decide whether the MVP uses refresh tokens or requires
  re-authentication after access-token expiry. This decision should stay consistent
  with logout/session-management stories.
- **Enumeration risk**: the OTP-request endpoint should not unnecessarily reveal whether
  a mobile number already belongs to an account.
- **Rate limiting**: apply rate limiting to OTP requests and verification attempts.
- **Schema**: depends on Story 001 providing a unique mobile-number identifier for users.
- **Registration and login remain separate backend responsibilities if useful**, but
  they must appear as one seamless authentication journey to the manager.

## Out of scope for this story

- Email login
- Email registration
- Password login
- Password creation
- Password recovery
- Social login
- Multi-factor authentication beyond the mobile OTP flow

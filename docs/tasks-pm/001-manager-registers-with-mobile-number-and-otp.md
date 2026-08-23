# 001 — Manager registers with mobile number and OTP

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** none
**Access control:** Public

## Story

As a prospective social media manager, I want to create an account using my
mobile number and a one-time password (OTP), so that I can start connecting social
accounts and configuring automations without needing an email address or password.

## Acceptance criteria

```gherkin
Feature: Manager registration with mobile number and OTP

  Scenario: OTP is sent for a valid mobile number
    Given no user exists with the mobile number "+989121234567"
    When I start registration with mobile number "+989121234567"
    Then the mobile number is validated and normalized
    And a one-time password is generated
    And the OTP is sent to that mobile number
    And no user account is created before the OTP is successfully verified

  Scenario: Successful registration with mobile number and OTP
    Given no user exists with the mobile number "+989121234567"
    And a valid OTP has been sent to that mobile number
    When I submit the correct OTP and display name "Amir"
    Then a new user is created with that mobile number and display name
    And the mobile number is stored in normalized format
    And I receive a success response

  Scenario: Mobile number is not provided
    When I try to start registration without a mobile number
    Then the registration is rejected with a validation error
    And no OTP is sent
    And no user row is created

  Scenario: Invalid mobile number
    When I try to register with an invalid mobile number
    Then the registration is rejected with a validation error
    And no OTP is sent
    And no user row is created

  Scenario: Incorrect OTP
    Given a valid OTP has been sent to mobile number "+989121234567"
    When I submit an incorrect OTP
    Then the registration is rejected with a validation error
    And no user row is created

  Scenario: Expired OTP
    Given an OTP was sent to mobile number "+989121234567"
    And the OTP has expired
    When I submit that OTP
    Then the registration is rejected
    And no user row is created

  Scenario: Mobile number already registered
    Given a user already exists with the mobile number "+989121234567"
    When I try to register with mobile number "+989121234567"
    Then no duplicate user row is created
    And the request must follow the existing-user sign-in flow

  Scenario: OTP resend is rate-limited
    Given an OTP has recently been sent to mobile number "+989121234567"
    When I repeatedly request another OTP within the resend cooldown period
    Then additional OTP requests are rate-limited
    And the response does not expose sensitive account information
```

## Considerations

- **Mobile-only identity**: registration does not support email. The manager's mobile
  number is the primary account identifier.
- **No password**: registration is passwordless. No password is collected, stored,
  hashed, or required.
- **Mobile number format**: store mobile numbers in E.164 format (`+<country><number>`),
  validate and normalize them at the boundary. Iranian mobile numbers must be supported
  (for example `+989121234567`).
- **OTP delivery**: the system requires an SMS delivery provider capable of sending
  one-time passwords to Iranian mobile numbers.
- **OTP security**: OTPs must be short-lived, single-use, and must never be stored or
  logged in plain text. Verification attempts must be limited.
- **OTP resend protection**: enforce a resend cooldown and rate-limit OTP requests per
  mobile number and IP to reduce abuse and SMS cost.
- **User creation timing**: the user account must only be created after successful OTP
  verification.
- **Existing users**: if the mobile number already belongs to an account, the system
  must not create a duplicate account. That user should proceed through the sign-in
  flow using the same mobile-number-and-OTP authentication method.
- **Enumeration risk**: responses should not unnecessarily expose whether a mobile
  number already belongs to an account. Rate-limit authentication attempts.
- **Zod at the boundary**: registration DTOs should be validated at the controller
  boundary according to the project's existing conventions; controllers should map
  DTOs to plain use-case arguments.
- **Schema change required**: `User` must support a unique mobile-number identifier.
  Email and password are not required by this registration flow.
- **Login and registration use the same authentication method**: both are based on
  mobile number + OTP. No email/password authentication is required for the MVP.

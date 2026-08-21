# 001 — Manager registers with email or mobile number and password

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** none
**Access control:** Public

## Story

As a prospective social media manager, I want to create an account using either my
email or my mobile number, plus a password, so that I can start connecting social
accounts and configuring automations regardless of which identifier I prefer to use.

## Acceptance criteria

```gherkin
Feature: Manager registration

  Scenario: Successful registration with email
    Given no user exists with the email "manager@example.com"
    When I register with email "manager@example.com", password "Str0ng-Pass!", and display name "Amir"
    Then a new user is created with that email and display name
    And my password is stored as a salted hash, never in plain text
    And I receive a success response, not an auto-issued session (see task 002 for login)

  Scenario: Successful registration with a mobile number
    Given no user exists with the mobile number "+971501234567"
    When I register with mobile number "+971501234567", password "Str0ng-Pass!", and display name "Amir"
    Then a new user is created with that mobile number and display name
    And my password is stored as a salted hash, never in plain text

  Scenario: Neither identifier provided
    When I try to register with only a display name and password, no email and no mobile number
    Then the registration is rejected with a validation error
    And no user row is created

  Scenario: Email already registered
    Given a user already exists with the email "manager@example.com"
    When I try to register with email "manager@example.com"
    Then the registration is rejected with a conflict error
    And no new user row is created
    And the error does not reveal whether the email exists for a *different* reason (rate-limit
      registration attempts to reduce email/phone-enumeration risk — see Considerations)

  Scenario: Mobile number already registered
    Given a user already exists with the mobile number "+971501234567"
    When I try to register with mobile number "+971501234567"
    Then the registration is rejected with a conflict error
    And no new user row is created

  Scenario: Weak password rejected
    Given no user exists with the email "new@example.com"
    When I try to register with password "123"
    Then the registration is rejected with a validation error
    And no user row is created
```

## Considerations

- **Schema change required**: `User` (`users` table, `identity` module) currently has
  only `email @unique` — it does **not** yet have a `phoneNumber` column. This task
  requires a migration adding `phoneNumber String? @unique @map("phone_number")` and
  relaxing `email` to optional (`String? @unique`), since a user may register with
  either identifier but must have at least one. Add a check constraint or
  application-level validation ensuring at least one of `email`/`phoneNumber` is set.
- **Mobile number format**: store in E.164 format (`+<country><number>`), validate and
  normalize at the boundary (a `PhoneNumber` value object, mirroring the existing
  `Email` value object in `identity`).
- **Password hashing**: use a slow, salted hash (bcrypt or argon2) — never store or log
  the plaintext password. Hashing itself is a use-case-layer concern via a future
  `PasswordHasher` port (mirrors the existing `Encryptor` port pattern in `shared/`).
- **Validation**: reuse the existing `Email` value object for the email path; add a new
  `PhoneNumber` value object for the mobile path. Minimum password strength policy is a
  product decision not yet made; pick a reasonable default (e.g. 8+ chars) and document
  it as a follow-up if requirements tighten later.
- **Zod at the boundary**: registration DTO validated per CLAUDE.md §4.C.9 — the
  controller maps the DTO to plain use-case arguments, never passes a DTO into the
  use case itself.
- **Enumeration risk**: registering with an existing email/mobile must not let an
  attacker distinguish "already taken" from other failure reasons via timing or
  response shape; rate-limit the registration endpoint per IP.
- **Does not auto-login**: registration and login are separate steps/tasks (001 vs 002)
  even though many UIs chain them — kept separate here because they're independently
  testable behaviors.
- **Relationship to task 006 (phone OTP sign-in)**: this task's mobile-number path is
  still password-based (register once with a password, log in with that password
  later — see task 002). Task 006 is a *different*, passwordless mechanism (one-time
  code sent by SMS, no password at all) for a returning or first-time user. The two
  are independent and a user may end up eligible for both once both ship.
- **No email/SMS verification step is specified yet** — open question: should a new
  account be usable immediately, or does it need a confirmation step (verification
  email / SMS code) before login succeeds? Not blocking this task, but worth a product
  decision before shipping publicly.

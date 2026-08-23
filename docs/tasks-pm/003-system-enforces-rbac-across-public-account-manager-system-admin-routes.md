# 003 — System enforces RBAC across public / account-manager / system-admin routes

**Phase:** 0 — Identity & access control (inferred) · **Priority:** P0 · **Depends on:** [002](002-manager-logs-in-with-mobile-number-and-otp.md)
**Access control:** System-internal (this task builds the enforcement mechanism itself)

## Story

As the system, I want every route classified into exactly one of three access levels —
public, account manager, or system administrator — and enforced consistently by a
single mechanism, so that authorization is never an ad hoc, per-endpoint decision
that someone can forget.

## Acceptance criteria

```gherkin
Feature: Role-based access control

  Scenario: Public route requires no token
    Given a route is classified as "public" (e.g. webhook receipt)
    When a request arrives with no Authorization header
    Then the request is allowed to proceed to its handler

  Scenario: Account-manager route requires a valid token scoped to the target account
    Given a route is classified as "account-manager" for social account "sa-1"
    And a valid JWT belongs to a user who holds the active AccountTenure for "sa-1"
    When a request is made with that JWT against a resource under "sa-1"
    Then the request is allowed to proceed

  Scenario: Account-manager route rejects a manager without an active tenure on that account
    Given a route is classified as "account-manager" for social account "sa-1"
    And a valid JWT belongs to a user who does NOT hold the active AccountTenure for "sa-1"
    When a request is made with that JWT against a resource under "sa-1"
    Then the request is rejected with a forbidden error
    And no business logic for that route executes

  Scenario: System-administrator route requires the system-admin role
    Given a route is classified as "system-administrator"
    And a valid JWT belongs to a user without the system-admin role
    When a request is made with that JWT
    Then the request is rejected with a forbidden error

  Scenario: Missing or expired token on a protected route
    Given a route is classified as "account-manager" or "system-administrator"
    When a request arrives with no token, or an expired/invalid token
    Then the request is rejected with an unauthorized error (401), not a forbidden error (403)
```

## Considerations

- **Schema change required**: `User` has no role field today. Add a `role` column
  (e.g. an enum `UserRole { account_manager, system_admin }`, default `account_manager`) —
  a simple column is sufficient for two roles; do not build a full permissions-table
  RBAC system for this — that's over-engineering for the two roles this backlog actually needs.
- **"Account Manager" access is account-specific** — having the base `account_manager`
  role alone does not grant access to every social account. Access to a specific account
  is derived per request from whether the authenticated user holds the *currently active*
  `AccountTenure` (`endedAt IS NULL`) for the specific `social_account_id` the request targets.
  This means the guard needs the target account id (from a route param or the resource being
  loaded) to check tenure, not just the JWT's claims alone.
- **Mechanism**: a NestJS Guard + a decorator (e.g. `@AccessLevel('account-manager')` /
  `@AccessLevel('system-admin')` / explicit public access) applied per controller route.
  The guard reads the JWT (already verified by an upstream auth strategy), and for
  account-manager routes, checks the active tenure via `accounts` module's public API
  (never a direct Prisma query from the guard — respects module isolation, CLAUDE.md §2.1).
- **401 vs 403**: no/invalid/expired token is a 401 (authentication failure); a valid
  token lacking the right role/tenure is a 403 (authorization failure) — these are
  different `AppError`/`ErrorCode` cases and must not be conflated.
- **Fail closed**: a route with no explicit access-level decorator should default to
  the *most* restrictive interpretation during development (e.g. throw at boot/lint
  time if a controller route has no access-level annotation) rather than silently
  defaulting to public — an unannotated route becoming accidentally public is exactly
  the kind of mistake this mechanism exists to prevent.
- **This is infrastructure, not a single use case** — likely lands in
  `shared/presentation/` (a guard is a cross-cutting interface-adapter concern) or as
  its own small module, not inside `identity/`. Exact placement is an implementation
  decision for whoever picks this up, not fixed here.

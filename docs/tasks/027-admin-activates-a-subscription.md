# 027 — Admin activates a subscription for a social account

**Phase:** 4 — Entitlement · **Priority:** P1 · **Depends on:** [003](003-system-enforces-rbac-across-routes.md), [008](008-manager-connects-a-telegram-bot.md)
**Access control:** System administrator

## Story

As a system administrator, I want to manually activate a subscription for a social
account after a manager pays out of band, so that their automations can start running,
without needing a payment gateway integration to exist yet.

## Acceptance criteria

```gherkin
Feature: Manual subscription activation

  Scenario: Successful activation
    Given social account "sa-1" has no active subscription
    And a Plan "pro-plan" exists
    When a system administrator activates plan "pro-plan" for "sa-1", recording who paid
    Then a new Subscription is created with status "active" for "sa-1"
    And quota counters for the current period are reset/initialized

  Scenario: Cannot activate a second active subscription for the same account
    Given social account "sa-1" already has an active Subscription
    When a system administrator tries to activate another subscription for "sa-1"
    Then the request is rejected with a conflict error (the partial unique index on
      (social_account_id) WHERE status = 'active' already enforces this at the DB level)

  Scenario: Non-admin cannot activate a subscription
    Given I am a manager without the system-admin role
    When I try to activate a subscription for any social account
    Then the request is rejected with a forbidden error
```

## Considerations

- **`purchasedBy` records who paid; it does not grant ownership**, per design doc §6.2
  verbatim — the subscription's `socialAccountId` scoping and the `AccountTenure`
  ownership model remain completely separate concerns. Don't let this endpoint
  accidentally also grant/transfer account ownership.
- **The partial unique index already exists** (`Subscription`, hand-added to the
  migration this session) — this task's job is wiring a real use case on top of an
  already-enforced invariant, not building the invariant itself.
- **Payment is explicitly out of scope** (design doc §11, "Open decisions" — payment
  gateway integration undecided) — "entitlement is not" out of scope though (§6.2's own
  wording): this task's `assertAllowed()`-consuming behavior (task 028) must work
  correctly today even though how money changes hands is unresolved. "When a real
  gateway arrives, it writes the same subscription row and nothing else changes" — so
  build this activation path as if it's the permanent shape, not a throwaway stub.
- **Quota reset**: design doc §6.2's sequence diagram explicitly includes "reset quota
  counters for the period" as part of activation — don't activate a subscription
  without also initializing `QuotaCounter` rows for the new period.

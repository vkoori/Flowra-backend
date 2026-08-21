# 043 — Every ownership decision is written to an immutable audit log

**Phase:** 6 — Ownership transfer · **Priority:** P2 · **Depends on:** [041](041-current-owner-approves-or-objects.md)
**Access control:** System-internal (writing) / System administrator (reading, for dispute resolution — see Considerations)

## Story

As the business, I want every ownership-transfer decision recorded permanently and
immutably, so that when two customers claim the same page, there's an authoritative
record of exactly what happened and when.

## Acceptance criteria

```gherkin
Feature: Ownership audit trail

  Scenario: A claim being opened is audited
    Given a new AccountTransfer is created (task 039)
    Then an AuditLog entry is written with action "account_transfer.claimed",
      targetType "social_account", targetId "sa-1", and metadata identifying claimant
      and current owner

  Scenario: An approval is audited
    Given a transfer is approved (task 041)
    Then an AuditLog entry is written with action "account_transfer.approved",
      including whether configuration carried over (task 042)

  Scenario: A rejection is audited
    Given a transfer is rejected (task 041)
    Then an AuditLog entry is written with action "account_transfer.rejected"

  Scenario: Audit entries cannot be edited or deleted
    Given any AuditLog entry exists
    When any code path attempts to update or delete it
    Then no such operation exists to call — AuditLog has no mutation methods by design
```

## Considerations

- **`AuditLog` already exists and is deliberately write-once** — built this session
  with construction-only behavior (no update methods at all, "the immutability of an
  audit trail is the whole point"). This task is entirely about *which* events in the
  ownership-transfer flow call `AuditLogRepository.create()`, not about building new
  audit infrastructure.
- **This is what the design doc calls the actual dispute-resolution mechanism**
  (§6.3: "Every transfer is audited. That audit trail is what settles the dispute when
  two customers claim the same page.") — treat completeness here as a real requirement,
  not a nice-to-have: claim-opened, approved, rejected, and (once task 040's sweep
  exists) auto-approved-by-expiry should all produce distinct, identifiable entries.
- **Read access**: who can *view* the audit log for a disputed account isn't specified
  in the design doc. A system administrator resolving a real dispute plausibly needs
  read access regardless of which side's tenure is currently active; whether the
  current/former account owners themselves can see their own transfer's audit entries
  is a separate, unaddressed product question — flagging rather than assuming a
  specific read-access shape beyond "system administrator can, for dispute handling."
- **`targetType`/`targetId` are polymorphic by design** (no FK, can't be one) — this
  task is the first real consumer of that polymorphic shape; confirm the exact
  `targetType` string convention (e.g. `"social_account"` vs `"account_transfer"`
  itself) before multiple call sites invent inconsistent naming.

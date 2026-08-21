# audit

## Purpose

`audit` owns the execution log and ownership audit trail for the system
(`docs/social-assistant-design-v2.md` §3, §6.3). Every action worth being able to
reconstruct later — most notably every step of an ownership transfer/claim/objection
flow (§6.3) — is written here as an immutable, append-only record. Per §6.3, "that
audit trail is what settles the dispute when two customers claim the same page": the
`AuditLog` rows are the evidence trail other modules (and, eventually, support staff)
consult when ownership of a social account is contested. An audit log entry is never
edited or deleted once written — there is deliberately no update path anywhere in this
module.

## Owned tables

- `audit_logs` (`AuditLog` Prisma model) — `id`, `actorUserId` (nullable, plain scalar
  reference to `identity`'s `User`, never a Prisma relation — some entries are
  system-initiated with no human actor), `action`, `targetType` + `targetId`
  (polymorphic reference to any entity in any module — this can never be a real
  relation), `metadata` (free-form `Json?`), `createdAt` only (no `updatedAt` — rows are
  never mutated). Indexed on `[targetType, targetId]` for lookup by target.

## Public API (`index.ts`)

None yet. This pass only builds the domain entity (`AuditLog`) and the repository
(`AuditLogRepository` / `PrismaAuditLogRepository`) it would sit on top of — no
use-case exists yet. Every other module will eventually need to call an
application-layer service exposed from this barrel (e.g. something like
`AuditLogWriterService.record(...)`) to actually write audit entries; until that
use case and its barrel export exist, no other module can depend on `audit` for
writing audit trail entries.

## Published events

- None yet.

## Consumed events

- None yet — once a use case exists, it will likely be triggered by domain events
  published by `accounts` (ownership transfer/claim/objection), `automation`
  (execution dead-lettering), etc., rather than by direct calls, to keep those
  modules from needing a synchronous dependency on `audit`.

## Open questions

- `PrismaAuditLogRepository` is untested — infrastructure tests for this module need
  Testcontainers-backed Postgres, which is not set up in this pass. Add an
  infrastructure test (`prisma-audit-log.repository.spec.ts` or similar) once
  Testcontainers is wired up for the repo (CLAUDE.md §4.G).
- No application-layer use case or service exists yet for other modules to actually
  call to write an audit entry. This pass deliberately stops at `domain/` and
  `infrastructure/persistence/` + `infrastructure/mappers/` — the use case, its port
  wiring in `audit.module.ts`, and the public barrel export are follow-up work.

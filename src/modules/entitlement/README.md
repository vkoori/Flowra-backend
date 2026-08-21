# entitlement

## Purpose

`entitlement` owns billing entitlement state — `Plan`, `Subscription`, and
`QuotaCounter`, scoped per social account (`docs/social-assistant-design-v2.md` §3's
module list: "entitlement: Plan, Subscription, QuotaCounter (per social account)"; the
quota-enforcement rule itself is described in §6.2). This pass only fills in `domain/`
and `infrastructure/persistence|mappers` — rich `Subscription`, `Plan`, and
`QuotaCounter` entities, their repository ports, and Prisma implementations — no use
cases, controllers, DTOs, or module wiring yet.

Note in particular: `assertAllowed(socialAccountId, metric)`, the quota-check
described in design doc §6.2, is **not** implemented here. It's a use case (it
orchestrates a `QuotaCounter` lookup against a `Plan`'s `monthlyMessageQuota` and
decides pass/fail) and is deliberately deferred to whichever pass adds
`application/use-cases/`.

## Design notes

- `Subscription.SubscriptionStatus` (`'active' | 'expired' | 'cancelled'`) is declared
  locally in `domain/entities/subscription.entity.ts` rather than imported from the
  generated Prisma client. It mirrors the Prisma `SubscriptionStatus` enum by value, but
  domain must have zero imports from `generated/prisma` or `@prisma/client`
  (CLAUDE.md §3) — `infrastructure/mappers/subscription.mapper.ts` is the only place the
  two representations meet.

## Owned tables

- `plans` (Prisma model `Plan`) — `id`, `name`, `code` (unique), `monthlyMessageQuota`,
  `createdAt`. Has a real Prisma relation to `Subscription` (same module).
- `subscriptions` (Prisma model `Subscription`) — `id`, `socialAccountId` (cross-module
  scalar into `accounts`' `SocialAccount`, plain column, never joined), `planId` (real
  relation to `Plan`), `status` (`SubscriptionStatus`: active/expired/cancelled),
  `purchasedByUserId` (cross-module scalar into `identity`'s `User`, plain column),
  `currentPeriodStart`, `currentPeriodEnd`, `graceUntil` (nullable), timestamps.
  At most one `active` subscription per social account is enforced by a partial unique
  index hand-added to the migration (see the comment above the `Subscription` model in
  `prisma/schema.prisma`) — application code does not need to re-check this invariant,
  but should expect the DB to reject a second concurrent `active` row for the same
  social account.
- `quota_counters` (Prisma model `QuotaCounter`) — `id`, `socialAccountId`
  (cross-module scalar, plain column), `metric`, `periodStart`, `periodEnd`, `count`
  (default 0), timestamps. `@@unique([socialAccountId, metric, periodStart])`.

No other module may join against these tables directly (CLAUDE.md §2.2).

## Public API (`index.ts`)

- None yet. No application-layer use case has been built in this pass, so the barrel
  intentionally exports nothing. Once a use case exists (starting with
  `AssertAllowedUseCase`/similar for design doc §6.2's quota check), its interface and
  plain input/output types are the only things this barrel should re-export — never the
  `Plan`/`Subscription`/`QuotaCounter` entities or their repository ports directly.

## Published events

- TODO — none yet.

## Consumed events

- TODO — none yet.

## Open questions

- **Prisma repositories are only unit-tested against a mocked `PrismaService` so far.**
  `PrismaPlanRepository`, `PrismaSubscriptionRepository`, and
  `PrismaQuotaCounterRepository` each have a `*.repository.spec.ts` asserting the right
  Prisma delegate method and `where`/`upsert` shape, and their mappers each have a
  `*.mapper.spec.ts` round-tripping every field. Neither exercises a real Postgres
  instance, so the partial-unique-index invariant on `Subscription` and the
  `@@unique([socialAccountId, metric, periodStart])` constraint on `QuotaCounter` still
  need a Testcontainers-backed infrastructure test (CLAUDE.md §4.G) once Testcontainers
  is wired up in this repo.
- **Payment gateway integration is an explicitly open decision** per design doc §11 —
  entirely out of scope for this module pass and not assumed anywhere in this code.

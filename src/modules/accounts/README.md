# accounts

## Purpose

`accounts` owns the ownership model described in `docs/social-assistant-design-v2.md`
§3/§4: the permanent identity of a connected social account (`SocialAccount`), who
currently manages it (`AccountTenure`), the claim/objection flow for moving management
from one user to another (`AccountTransfer`), and per-account data-retention
configuration (`RetentionPolicy`). It deliberately does not own the OAuth token itself
(`channels/` owns `ChannelConnection` — OAuth proves current admin access, not
ownership) and does not own conversational data (scoped by `tenure_id`, owned by
`ingestion`/`automation`/`moderation`).

This pass fills in `domain/` and `infrastructure/persistence/` +
`infrastructure/mappers/` only. There is no `application/use-cases/` layer yet, so this
module has no public API and no module wiring beyond the empty scaffold.

## Owned tables

- `social_accounts` (`SocialAccount`) — permanent identity of a connected account.
- `account_tenures` (`AccountTenure`) — who manages a social account and for how long.
  Exactly one row per social account may have `ended_at IS NULL` at a time, enforced by
  a hand-added partial unique index (see the comment above the `AccountTenure` model in
  `prisma/schema.prisma`) — not re-implemented in application code.
- `account_transfers` (`AccountTransfer`) — pending/approved/rejected/expired ownership
  transfer requests, including the 48h objection window (`objection_deadline_at`).
- `retention_policies` (`RetentionPolicy`) — per-`(socialAccountId, dataClass)` TTL
  configuration.

`userId` (on `AccountTenure`) and `toUserId` (on `AccountTransfer`) are cross-module
scalar references into `identity`'s `User` table — plain `String` columns, never a
Prisma relation, so no join across the module boundary is possible even by accident
(CLAUDE.md §2.2).

## Public API (`index.ts`)

- None yet. This pass is domain + persistence only; the barrel stays empty
  (`export {}`) until an `application/use-cases/` layer exists to expose.

## Published events

- TODO — none yet. Ownership-transfer orchestration (below) will likely need to publish
  something like `AccountTransferApproved`/`AccountTenureClosed` once the use-case layer
  exists, so `channels`/`automation`/`entitlement` can react without a direct call.

## Consumed events

- TODO — none yet.

## Design notes

- **`infrastructure/mappers/*.mapper.ts` declare a local `*Row` interface** (e.g.
  `SocialAccountRow`) instead of importing the generated Prisma model type. Each row
  interface mirrors the scalar shape of its table; a Prisma row returned by the
  matching `Prisma*Repository` is structurally compatible with it. This keeps
  `@prisma/client` imports confined to `infrastructure/persistence/` (CLAUDE.md §4.D.10)
  rather than leaking into `infrastructure/mappers/`.

## Open questions

- **Prisma repositories only have mocked-`PrismaService` unit tests so far.**
  `infrastructure/persistence/prisma-*.repository.spec.ts` assert the right Prisma
  delegate method and `where` clause are used and that rows map correctly, but
  `PrismaAccountTenureRepository.save()` relying on the DB's partial unique index to
  reject a second concurrently-open tenure cannot be verified with a mock — that still
  needs an integration test against a real Postgres via Testcontainers (CLAUDE.md §4.G),
  not set up in this repository yet.
- **Ownership-transfer orchestration is not built here.** The 48h objection window, who
  is allowed to initiate a transfer, notifying the current tenure holder, and what
  happens to `AccountTransfer.fromTenureId` when the deadline passes without objection
  (design doc journey 6.3) are all use-case-layer decisions, deliberately out of scope
  for this pass. The `AccountTransfer` entity only enforces the terminal-state invariant
  (`approve`/`reject`/`expire` each requiring `status === 'pending'`); it has no opinion
  on when a use case should call `expire()` versus leaving a transfer pending past its
  deadline for a scheduler job to sweep.

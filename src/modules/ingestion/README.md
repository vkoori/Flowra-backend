# ingestion

## Purpose

The `ingestion` module is the anti-corruption boundary for everything that arrives from
the outside world: webhook receipt, pollers, and event normalisation into a
platform-agnostic shape (`docs/social-assistant-design-v2.md` §3, §8). Nothing downstream
of this module should ever see a platform-specific payload — that is `ingestion`'s job to
absorb. It also owns `conversations` and `messages`, the natural downstream of an inbound
event once it is grouped by participant into a running conversation: not explicitly
assigned to a module in the design doc's module map, so this was a judgment call made
when this module was scaffolded rather than an invented requirement.

This pass fills in only `domain/`, `infrastructure/persistence/`, and
`infrastructure/mappers/` — entities, the `DuplicateInboundEventError`, repository
interfaces/implementations, and DB mappers. Webhook controllers, signature verification,
and event normalisation logic are deliberately out of scope for this pass; see Open
questions.

## Owned tables

- `inbound_events` (`InboundEvent` in `prisma/schema.prisma`) — append-only fact record of
  one normalised inbound delivery (a comment, a DM), deduplicated via the unique
  `dedupe_key` column per docs/social-assistant-design-v2.md §9.1.
- `conversations` (`Conversation`) — a running thread between the account and one
  participant, keyed by `tenureId` + `participantHash`, with a refreshable
  `windowExpiresAt` messaging window (§6.5).
- `messages` (`Message`) — append-only fact record of one turn (inbound or outbound) in a
  `Conversation`. `inboundEventId` is a nullable, unenforced soft reference (outbound
  messages have no inbound event to point at).

Owning `conversations`/`messages` here was a judgment call, not something the design
doc's module map explicitly assigns — see the comment above the `// --- ingestion ---`
block in `prisma/schema.prisma`.

## Public API (`index.ts`)

- None yet — `application/use-cases/` is not built in this pass, so there is nothing to
  export. `tenureId` and `socialAccountId` on `InboundEvent`/`Conversation` are plain
  cross-module scalar references (no Prisma relation) to `accounts`' `AccountTenure` and
  `SocialAccount`, per CLAUDE.md §2.2 — this module must never join against those tables
  directly. `platform` is deliberately denormalized onto `Conversation` rather than
  derived by following `tenureId` across the module boundary, for the same reason.

## Design notes

- `InboundEvent` and `Message` are immutable, append-only fact records — once created
  they never change, so `InboundEventRepository` and `MessageRepository` deliberately
  expose only `create()`, not `save()`/an update path. `Conversation` is the one mutable
  entity in this module (its `windowExpiresAt` is refreshed via `refreshWindow()` per
  docs/social-assistant-design-v2.md §6.5), so `ConversationRepository.save()` is
  implemented as an upsert.
- `InboundEvent.dedupeKey` has a unique constraint at the DB level;
  `PrismaInboundEventRepository.create()` translates a `P2002` violation on that
  constraint into `DuplicateInboundEventError` rather than letting the raw Prisma error
  leak past the repository boundary (docs/social-assistant-design-v2.md §9.1).

## Published events

- TODO — none yet

## Consumed events

- TODO — none yet

## Open questions

- **Webhook controllers, signature verification, and event normalisation are deferred.**
  These are use-case/presentation-layer concerns (turning a raw webhook payload into an
  `InboundEvent` via a `NormalizedEvent` per design doc §8) and are not built in this
  pass — only the domain/infrastructure shape they will eventually write into exists so
  far.
- **All three repositories and their mappers have mocked-`PrismaService` unit coverage
  only, not a real-database test.** `PrismaInboundEventRepository`,
  `PrismaConversationRepository`, `PrismaMessageRepository`, and the three mappers each
  have unit tests against a mocked `PrismaService` (asserting the right Prisma method is
  called with the right shape, and that rows round-trip through `toDomain`/
  `toPersistence`, including the P2002 → `DuplicateInboundEventError` translation). None
  of this is exercised against real Postgres yet — that still needs an infrastructure-tier
  test via Testcontainers (CLAUDE.md §4.G), which is not set up in this repository yet.
- **Loop prevention (self-authored events, per-author cooldown) and window-expiry sweep
  scheduling** (design doc §9) are not implemented here — they belong to the
  normalisation use case and a `presentation/scheduler/` job respectively, both deferred.

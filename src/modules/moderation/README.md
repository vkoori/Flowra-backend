# moderation

## Purpose

`moderation` owns the review-queue side of the moderation flow described in
`docs/social-assistant-design-v2.md` §3 ("moderation: classification, review queue") and
walked through end-to-end in journey §6.7 ("Abusive comment goes to review"): a
deterministic layer of cheap checks (blocklist matching, link detection, repetition
detection) runs first and, for uncertain cases, an LLM classifier runs next; either
produces a `score`/`reasons` pair that gets written as a `moderation_decisions` row with
`state = pending`. A manager later resolves that row by either **approving** (agreeing
the content should stay actioned/hidden) or **restoring** (overriding the system and
unhiding the content) — both are terminal transitions out of `pending`.

**This pass is scoped to the deterministic-layer data model only**, per
`docs/social-assistant-design-v2.md` §12 build-order item 7 ("`moderation`, deterministic
layer only"). It fills in `domain/`, `infrastructure/persistence/`, and
`infrastructure/mappers/` for the `ModerationDecision` entity and its lifecycle
(`create` → `approve`/`restore`) only. It deliberately does **not** implement:

- the deterministic checks themselves (blocklist matching, link detection, repetition
  detection) — these are `application/use-cases/` work, out of scope here;
- the §6.7 LLM classifier step for uncertain cases — also out of scope here, and out of
  scope for this module "in its current form" until that use-case layer exists;
- any `application/use-cases/`, controllers, DTOs, or module wiring — the module has no
  public API yet (see below).

## Owned tables

- `moderation_decisions` (`ModerationDecision`) — one row per moderated inbound event,
  holding `state` (`pending`/`approved`/`restored`), the deterministic/LLM `score`
  (nullable — not every check produces a numeric score) and `reasons`, and who resolved
  it (`decidedByUserId`/`decidedAt`, both nullable until resolved).

  `eventId` (→ `ingestion`'s `InboundEvent`) and `decidedByUserId` (→ `identity`'s
  `User`) are cross-module scalar references — plain `String` columns, never a Prisma
  relation, so no join across the module boundary is possible even by accident
  (CLAUDE.md §2.2).

## Public API (`index.ts`)

- None yet. This pass is domain + persistence only; the barrel stays empty
  (`export {}`) until an `application/use-cases/` layer exists to expose.

## Published events

- TODO — none yet. Once a use-case layer exists, resolving a decision (`approve`/
  `restore`) will likely need to publish something like `ModerationDecisionApproved`/
  `ModerationDecisionRestored` so `dispatch`/connectors can react (e.g. unhide the
  comment on `restore`, per the §6.7 sequence diagram) without a direct call.

## Consumed events

- TODO — none yet. The use-case layer that creates a `pending` decision will presumably
  react to an `ingestion`-published inbound-event event, or be called directly by a rule
  action — an open decision left to that pass.

## Open questions

- **The deterministic checks are not built here.** Blocklist matching, link detection,
  and repetition detection (§6.7) are use-case-layer decisions — this pass only builds
  the `ModerationDecision` record and its `pending → approved`/`pending → restored`
  transitions, not what produces the `score`/`reasons` that go into it.
- **The LLM-assisted classifier for uncertain cases is not built here.** Also
  use-case-layer (and possibly `assistant/`-adjacent) work, deferred along with the
  deterministic checks above.
- **Prisma repository and mapper are covered by mocked-`PrismaService` unit tests only**
  (`infrastructure/persistence/prisma-moderation-decision.repository.spec.ts`,
  `infrastructure/mappers/moderation-decision.mapper.spec.ts`), per CLAUDE.md §4.G. An
  integration test against a real Postgres via Testcontainers is still open — not set up
  in this repository yet.
- **Whether `HIDE_COMMENT` happens synchronously or via `dispatch/`** on decision
  creation, and who calls `restore()`'s corresponding "unhide" side effect, is left to
  the use-case layer per the §6.7 sequence diagram ("this is still just a rule").

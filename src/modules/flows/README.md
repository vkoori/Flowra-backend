# flows

## Purpose

`flows` owns the guided-dialogue engine's durable state — `Flow`, `FlowVersion`, and
`FlowSession` — described in `docs/social-assistant-design-v2.md` §3 ("flows:
FlowVersion, FlowSession, step executor") and §6.6 (the flow graph, its step types, and
the immutability/versioning rules). This pass only fills in `domain/` and
`infrastructure/persistence|mappers` — rich `Flow`, `FlowVersion`, and `FlowSession`
entities, their repository ports, and Prisma implementations — no use cases,
controllers, DTOs, or module wiring yet.

Note in particular: the **step executor** — advancing a `FlowSession` through a
`FlowVersion`'s graph across `send`/`ask`/`branch`/`action`/`handoff`/`end` steps
(design doc §6.6) — is **not** implemented here. It orchestrates a `FlowVersion`
lookup, graph interpretation, and one or more `FlowSession` transitions, which makes it
application-layer (use-case) work, and is deliberately deferred to whichever pass adds
`application/use-cases/`.

## Owned tables

- `flows` (Prisma model `Flow`) — `id`, `socialAccountId` (cross-module scalar into
  `accounts`' `SocialAccount`, plain column, never joined), `name`, timestamps. Has a
  real Prisma relation to `FlowVersion` (same module).
- `flow_versions` (Prisma model `FlowVersion`) — `id`, `flowId` (real relation to
  `Flow`), `version` (int), `graph` (`Json`), `createdAt` only — **no `updatedAt`**,
  deliberately: design doc §6.6 point 4 states flow versions are immutable once
  created ("Editing a flow must not corrupt live dialogues; running sessions finish on
  the old version"). `@@unique([flowId, version])`. Has a real Prisma relation to
  `FlowSession` (same module).
- `flow_sessions` (Prisma model `FlowSession`) — `id`, `conversationId` (cross-module
  scalar into `ingestion`'s `Conversation`, plain column, never joined),
  `flowVersionId` (real relation to `FlowVersion`), `status` (`FlowSessionStatus`:
  awaiting/completed/closed/timed_out), `currentStepId`, `context` (`Json`, default
  `{}` — the saved answers from `ask` steps, e.g. `{in_uae: true}`), `repromptCount`
  (default 0), `expiresAt` (nullable), timestamps. At most one `awaiting` session per
  conversation is enforced by a partial unique index hand-added to the migration (see
  the comment above the `FlowSession` model in `prisma/schema.prisma`) — application
  code does not need to re-check this invariant, but should expect the DB to reject a
  second concurrent `awaiting` row for the same conversation.

No other module may join against these tables directly (CLAUDE.md §2.2).

## Design notes

- **`FlowVersion` has no mutation methods.** It is immutable once created
  (docs/social-assistant-design-v2.md §6.6 point 4): editing a flow must not corrupt
  live dialogues, so a running `FlowSession` keeps referencing the `FlowVersion` it
  started on and finishes on it. Construction only, via `create()`/`fromPersistence()`.
  `FlowVersionRepository` reflects this at the port level too — it exposes `create()`,
  not `save()`, since there is deliberately no update path.
- **`FlowVersion.graph` is `Record<string, unknown>` (`FlowGraph`), not a Zod-validated
  step registry.** The shape (nodes/edges for send/ask/branch/action/handoff/end steps,
  design doc §6.6) is typed loosely on purpose — a registry keyed on step `type` only
  earns its keep once the step executor that consumes it exists (see "Open questions").
  Domain must have zero imports from generated Prisma types (CLAUDE.md §3), so this
  isn't a Prisma `Json` type either.
- **`FlowSessionStatus` is a local string union, not the Prisma enum.** It mirrors
  `FlowSessionStatus` in `prisma/schema.prisma` (`awaiting`/`completed`/`closed`/
  `timed_out`) by value only — domain has zero imports from generated Prisma types
  (CLAUDE.md §3).
- **`FlowSessionRepository.findAwaitingByConversationId` backs the "at most one
  awaiting session per conversation" invariant.** The invariant itself is enforced by a
  partial unique index hand-added to the migration (see the comment above the
  `FlowSession` model in `prisma/schema.prisma`); this method is how callers query
  around it.

## Public API (`index.ts`)

- None yet. No application-layer use case has been built in this pass, so the barrel
  intentionally exports nothing. Once the step executor and its supporting use cases
  exist, their interfaces and plain input/output types are the only things this barrel
  should re-export — never the `Flow`/`FlowVersion`/`FlowSession` entities or their
  repository ports directly.

## Published events

- TODO — none yet.

## Consumed events

- TODO — none yet.

## Open questions

- **The step executor is out of scope for this pass.** Advancing a `FlowSession`
  through a `FlowVersion`'s graph (send/ask/branch/action/handoff/end steps, design doc
  §6.6) is explicitly deferred to the use-case layer. This module currently only
  persists the graph and the session state around it.
- **`FlowVersion.graph`'s Zod step registry is still missing.** See "Design notes" for
  why it's typed loosely for now. Building the real registry only earns its keep once
  the step executor that consumes it exists; whoever builds the executor should add the
  registry alongside it.
- **Prisma repositories have mocked-`PrismaService` unit tests only, not
  Testcontainers integration tests.** `PrismaFlowRepository.spec.ts`,
  `PrismaFlowVersionRepository.spec.ts`, and `PrismaFlowSessionRepository.spec.ts`
  assert each method calls the right Prisma delegate method with the right
  `where`/`orderBy` and maps the result correctly, but a mocked `PrismaService` cannot
  exercise real constraint semantics — in particular the partial-unique-index invariant
  on `FlowSession` and the `@@unique([flowId, version])` constraint on `FlowVersion`.
  Testcontainers isn't wired up in this repo yet (CLAUDE.md §4.G); once it is, those
  constraints deserve a real-Postgres test pass. `Flow` and `FlowVersion` have no
  state-transition logic worth testing in isolation beyond what their mapper/repository
  specs already cover (`Flow.rename()` is a trivial setter-with-a-name; `FlowVersion`
  has no mutation methods at all) — only `FlowSession` has entity-level unit tests
  (`domain/entities/flow-session.entity.spec.ts`).

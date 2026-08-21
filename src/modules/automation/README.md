# automation

## Purpose

`automation` owns `Rule`, `RuleMatcher`, and `Execution` — the rule-triggered
automation core described in `docs/social-assistant-design-v2.md` §3's module list, with
the execution state machine detailed in §5 and the (not-yet-built) matching engine in
§7. This pass only fills in `domain/` and `infrastructure/persistence|mappers` — rich
`Rule` and `Execution` entities, their repository ports, and Prisma implementations —
no use cases, controllers, DTOs, or module wiring yet.

Two things are deliberately **not** implemented in this pass, both called out
explicitly rather than left implicit:

- **The rule-matching engine** (design doc §7 — matching runs in memory over rules
  cached per account, never as a JSONB query in SQL). That's application/use-case work
  (it orchestrates `RuleRepository.findEnabledBySocialAccountId`, evaluates
  `triggerType`/`matcherMode`/`matcherValues`/`conditions` against a `NormalizedEvent`,
  and decides which `actions` to turn into `Execution` rows) and is deferred to whichever
  pass adds `application/use-cases/`.
- **The `ConditionNode`/`Action` Zod registry** (design doc §7 — "polymorphic JSONB
  validated by a Zod registry keyed on `type`"). That registry only earns its keep once
  the matching/execution engine that consumes it exists. For now, `Rule.triggerScope`,
  `Rule.conditions`, `Rule.actions`, and `Execution.actionParams` are typed loosely as
  `Record<string, unknown>` (or `null` where nullable) on the domain entities — see
  `domain/entities/rule.entity.ts` and `domain/entities/execution.entity.ts`.

## Design notes

- `ExecutionOriginType`, `ExecutionStatus`, `RuleTriggerType`, and `RuleMatcherMode` are
  declared locally in `domain/entities/` and mirror the Prisma enums of the same name
  by value only — the domain layer must have zero imports from `generated/prisma` or
  `@prisma/client` (CLAUDE.md §3).
- `ExecutionStatus`'s values encode the state machine from
  `docs/social-assistant-design-v2.md` §5:
  `pending -> dispatched -> running -> succeeded`, with
  `running -> failed -> (attempts < max) -> pending` and a terminal
  `failed -> dead_lettered`.
- `Rule.triggerScope`/`conditions`/`actions` and `Execution.actionParams` are
  polymorphic JSONB per design doc §7 — a Zod registry keyed on `type` will validate
  their real shape once the rule-matching engine exists. Typing them loosely as
  `Record<string, unknown>` (or `null` where nullable) on the domain entities is a
  deliberate, documented scope boundary for this pass — see "Open questions".
- `Rule.enable()`/`disable()` are idempotent by design: unlike `Execution`'s
  state-machine methods (`dispatch()`, `markRunning()`, ...), toggling `enabled` is not
  an irreversible transition, so calling either method when the rule is already in
  that state is a no-op rather than a thrown error.
- `ExecutionRepository.claimBatch()` claims up to `limit` executions that are `pending`
  and due (`scheduledAt <= now`) using `SELECT ... FOR UPDATE SKIP LOCKED`, so multiple
  `scheduler` replicas can poll concurrently without claiming the same row twice
  (design doc §9.3, CLAUDE.md §1). Claimed rows are transitioned to `dispatched` as
  part of the same transaction that claims them.
- `PrismaExecutionRepository.claimBatch()` implements the above via a raw query inside
  an explicit `$transaction`, because Prisma's query builder cannot express
  `FOR UPDATE SKIP LOCKED` (CLAUDE.md §0.1.6/§4.E). That raw query returns literal
  Postgres column names (snake_case) rather than the camelCase names the generated
  client normally maps to, which is why `RawExecutionRow` and
  `ExecutionMapper.toDomainFromRaw()` exist as a separate bridging path from the
  `PrismaExecution`-based `toDomain()`.

## Owned tables

- `rules` (Prisma model `Rule`) — `id`, `socialAccountId` (cross-module scalar into
  `accounts`' `SocialAccount`, plain column, never joined), `enabled`, `priority`,
  `triggerType` (`EventType`: comment_created/dm_received), `triggerScope` (nullable
  JSONB, polymorphic), `matcherMode` (`MatcherMode`: exact/contains/regex/any),
  `matcherValues` (`String[]`), `matcherCaseSensitive`, `conditions` (JSONB,
  polymorphic), `actions` (JSONB, polymorphic), timestamps.
- `executions` (Prisma model `Execution`) — `id`, `originType` (`ExecutionOriginType`:
  rule/flow), `originId` (`String` — polymorphic, points at this module's own `Rule.id`
  when `originType = rule`, or at `flows`' `FlowSession.id` when `originType = flow`;
  always a plain scalar, never a relation, both because it's polymorphic and because it
  can be cross-module), `eventId` (cross-module scalar into `ingestion`'s
  `InboundEvent`, plain column), `actionIndex`, `status` (`ExecutionStatus`:
  pending/dispatched/running/succeeded/failed/dead_lettered — the design doc §5 state
  machine), `actionType`, `actionParams` (JSONB, polymorphic), `scheduledAt`,
  `nextAttemptAt` (nullable), `attempts` (default 0), `maxAttempts` (default 5),
  `deadLetterReason` (nullable), timestamps.
  `@@unique([originType, originId, eventId, actionIndex])`,
  `@@index([status, nextAttemptAt])`.

No other module may join against these tables directly (CLAUDE.md §2.2).

## Public API (`index.ts`)

- None yet. No application-layer use case has been built in this pass, so the barrel
  intentionally exports nothing. `dispatch/` will eventually need to call into an
  `ExecutionsService`-style application service on this module's public barrel to claim
  due executions and update their outcome (per the design doc's `automation → dispatch`
  dependency direction, CLAUDE.md §2's module map) — that service is use-case-layer work,
  deferred to a later pass. `Rule`/`Execution` entities and the `RuleRepository`/
  `ExecutionRepository` ports must never be exported from the barrel directly.

## Published events

- TODO — none yet.

## Consumed events

- TODO — none yet.

## Open questions

- **The rule-matching engine and the `ConditionNode`/`Action` Zod registry are both
  deferred** — see "Purpose" above. `triggerScope`/`conditions`/`actions`/
  `actionParams` are typed as loose `Record<string, unknown>` shapes on the domain
  entities until that engine and its registry exist.
- **`PrismaExecutionRepository.claimBatch()` still has no real-Postgres coverage.**
  The unit test (`prisma-execution.repository.spec.ts`) mocks `PrismaService.$transaction`
  and its callback's `$queryRaw`/`execution.updateMany`, which verifies the repository's
  own logic (short-circuiting on an empty claim, mapping raw rows, calling `updateMany`
  with the right ids/status) but cannot exercise the actual
  `SELECT ... FOR UPDATE SKIP LOCKED` concurrency guarantee that makes it safe to run
  `scheduler` at N > 1 replicas (design doc §9.3). A Testcontainers-backed test that
  claims from two concurrent transactions and asserts no row is claimed twice is still a
  future addition, once Testcontainers is wired up in this repo.
- `Rule`/`Execution` entities, `RuleMapper`/`ExecutionMapper`, and
  `PrismaRuleRepository`/`PrismaExecutionRepository` all have unit tests now
  (`domain/entities/*.spec.ts`, `infrastructure/mappers/*.spec.ts`,
  `infrastructure/persistence/*.spec.ts`). All of the infrastructure tests use a mocked
  `PrismaService`; none hit a real database yet.

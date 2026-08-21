# dispatch

## Purpose

Outbox dispatcher, BullMQ job publishing, and rate limiting (docs/social-assistant-design-v2.md
§3). This module acts on `Execution` rows that `automation` owns — it never owns persistent
state of its own. Per the design doc's dependency direction (`automation → dispatch`) and
CLAUDE.md/AGENTS.md §0.1, `dispatch` claims pending executions via `automation`'s public API
(never Prisma directly), publishes deterministic-job-ID BullMQ jobs, and enforces the
per-connection token bucket (Redis) and circuit breaker before any outbound call.

## Owned tables

- None. `dispatch` reads and updates `automation`'s `executions` table exclusively through
  `automation`'s public API (e.g. `ExecutionRepository.claimBatch()`, `Execution` entity state
  transitions) — never a direct Prisma import, per CLAUDE.md/AGENTS.md §2.1/§2.2.

## Public API (`index.ts`)

- None yet — no use-case layer exists in this module yet (the outbox dispatch loop itself is
  deferred; see Open questions).

## Published events

- TODO — none yet

## Consumed events

- TODO — none yet

## Open questions

- The actual dispatch loop (claim → publish BullMQ job → consume rate-limit budget → call
  connector → mark succeeded/failed) is entirely use-case/application-service work, not built
  in this pass — this module currently has only the scaffolded folder structure.
- `automation` does not yet expose an application-layer service for `dispatch` to call (its
  `ExecutionRepository.claimBatch()` exists at the repository level, but the use-case/service
  wrapper that would be `automation`'s actual public API for this module doesn't exist yet).
  Building that service is a prerequisite for any real work here.
- Circuit breaker state (CLAUDE.md/AGENTS.md §0.1.7) is planned as application-layer state
  behind the same gateway port used for the HTTP call, not a Postgres table — no decision
  needed yet since no connector adapters exist (`src/connectors/` is out of scope for this pass).

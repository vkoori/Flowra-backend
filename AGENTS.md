# Flowra Backend — Engineering Constitution (Codex CLI edition)

This file is binding context for Codex and every human working in this repository. It
is not a style guide you may deviate from when convenient — it is the governance layer
for a Feature-Based Modular Monolith built with strict Clean Architecture. If a request
conflicts with this file, follow this file and say so.

This document carries the same architectural substance as `CLAUDE.md` at the repo root
(written for Claude Code), adapted to Codex CLI's own mechanisms in §6. **The two files
must agree on substance** — if you change an architectural rule in one, change it in the
other in the same turn. §8 explains the full mapping between the two toolchains.

Domain source of truth: [`docs/social-assistant-design-v2.md`](docs/social-assistant-design-v2.md).
That document describes *what* the system does (ownership model, execution state
machine, flow engine, journeys). This file describes *how* code must be structured and
which engineering invariants may never be violated. When in doubt about product
behavior, read the design doc before inventing behavior.

---

## 0. Stack

| Concern | Choice | Notes |
|---|---|---|
| Runtime | **Node v24.18.0** | Pinned via `.nvmrc` and the `engines` field once `package.json` exists. Do not write scripts (including `.agents/skills/*`) that assume an older Node — the skills in this repo rely only on Node 24-stable APIs (`fs`, `path`, no external deps), so this should never be a constraint in practice, but do not add a dependency that requires a different major. |
| Framework | NestJS | **Fastify adapter only.** `@nestjs/platform-express` must never be installed or imported. |
| Language | TypeScript, strict mode | No `any` except at deserialization boundaries, and even then prefer `unknown` + Zod. |
| Database | PostgreSQL | Single primary. Source of truth for durable state, including scheduling (see §0.1). |
| ORM | Prisma | Raw SQL / `prisma.$queryRaw` / TypedSQL permitted where Prisma's query builder is awkward, never to bypass module isolation (§2). |
| Vector search | pgvector inside the same Postgres instance | Do not introduce a second vector store. |
| Queue / jobs | **BullMQ + Redis** | See §0.1 for how BullMQ composes with Postgres-owned scheduling state. |
| Cache / rate limiting / locks | Redis | Same instance BullMQ uses; keep key namespaces separate (`rl:*`, `lock:*`, `cache:*`, `bull:*`). |
| Validation | Zod | At every boundary: HTTP DTOs, webhook payloads, action params, flow graphs, LLM structured output. |
| Testing | Jest + Supertest (Fastify `inject`) + Testcontainers | See §4.G. |

### 0.1 BullMQ is a delivery mechanism, not the source of truth — read before touching `dispatch/` or `automation/`

`docs/social-assistant-design-v2.md` specifies BullMQ as a dumb transport, with **all**
scheduling and retry state living in Postgres (its decision #4, explicitly marked
"Never — this is a durability property"). A BullMQ job existing, running, or completing
is never, by itself, what "status" means in this system — the `executions` row is.
Concretely:

1. **Postgres owns status.** The `executions` row (or equivalent outbox row) is the only
   place `status`, `attempts`, `next_attempt_at`, and `dead_letter_reason` are
   authoritative. A BullMQ job is a *trigger to go check that row*, never the record
   itself.
2. **Deterministic job IDs.** Every BullMQ job enqueued for an execution MUST use
   `jobId = executionId` (or `${originType}:${originId}:${eventId}:${actionIndex}`).
   This makes re-enqueueing idempotent at the queue layer, on top of the DB-level
   idempotency key.
3. **Cancellation is a DB write, not a queue operation.** Disabling a rule or cancelling
   a flow session updates the execution row. A worker that picks up a stale BullMQ job
   for an already-cancelled execution MUST check the row's status before acting and
   no-op if it's no longer `pending`/`dispatched`. Do not rely on `job.remove()` as the
   cancellation mechanism — jobs already in flight or in Redis but not yet consumed
   must still be safe to no-op.
4. **BullMQ retry ≠ blind retry.** Configure `attempts`/`backoff` on the job, but the
   processor MUST classify the error first (§4.E.17) and throw an `UnrecoverableError`
   (BullMQ's own class) for 400/401-class failures so BullMQ does not keep retrying
   something that can never succeed. Update the execution row's `dead_letter_reason` on
   terminal failure — a dead-lettered execution must be product-visible (design doc §9.9).
5. **Two queues, two runtimes.** `worker` consumes the default queue set; `worker-risky`
   consumes **only** the `risky` queue, using its own BullMQ `Worker` instance, own proxy
   pool, and own concurrency/rate-limit settings. Never let a job land on both queue
   consumers — route by `connector.risk` at enqueue time, not at consumption time.
6. **Per-conversation serialization is not a BullMQ concern.** BullMQ does not guarantee
   per-key ordering. Flow-session stepping MUST take a Postgres advisory lock
   (`pg_advisory_xact_lock(hashtext(conversationId))`) or `SELECT ... FOR UPDATE` on the
   session row inside the transaction that steps it — regardless of queue technology.
7. **Circuit breakers are application-layer state, not BullMQ state.** Implement per
   connection (e.g. keyed by `channelConnectionId`) in the infrastructure layer behind
   the same gateway port used for the HTTP call. BullMQ concurrency settings are not a
   substitute for a circuit breaker.

If you find yourself wanting BullMQ's delayed-job feature to *replace* `next_attempt_at`
on the execution row, stop — that reintroduces the exact failure mode decision #4 exists
to prevent (inspectability and cancellation become impossible with plain SQL).

---

## 1. Deployment topology — one image, four roles

One `Dockerfile`, one built image, launched as four services distinguished by `APP_MODE`
(and `QUEUES` for the risky worker). Do not create four Dockerfiles or four codebases.

| Service | `APP_MODE` | Responsibility | Scaling signal |
|---|---|---|---|
| `api` | `api` | HTTP, webhook receipt, admin panel | Request latency |
| `worker` | `worker` | Rule matching, flow stepping, official API actions, assistant | Queue depth |
| `worker-risky` | `worker` + `QUEUES=risky` | Unofficial connector actions only; owns its own proxy/session pool | Scaled separately, conservatively |
| `scheduler` | `scheduler` | Outbox dispatch, token refresh, flow timeouts, crawling, purging | Must be safe at N > 1 (use `SKIP LOCKED`) |

Consequences for code:

- `main.ts` (or a small bootstrap dispatcher) branches on `process.env.APP_MODE` to decide
  which Nest module tree / microservice context to start. Do not scatter `if (APP_MODE)`
  checks through business code — resolve the mode once, at the edge.
- Anything that must run exactly once regardless of `scheduler` replica count (outbox
  dispatch, token refresh sweep) uses `SELECT ... FOR UPDATE SKIP LOCKED` claiming, never
  an in-memory leader-election scheme.
- No PM2 or other process supervisor inside the container. SIGTERM must reach the Node
  process directly so `app.enableShutdownHooks()` and graceful BullMQ worker shutdown
  (`worker.close()`) actually run.

---

## 2. Module map and isolation rules

```
src/
  modules/
    identity/        auth, users
    accounts/        SocialAccount, AccountTenure, ownership transfer
    channels/        ChannelConnection, token refresh, capability discovery
    entitlement/     Plan, Subscription, QuotaCounter (per social account)
    automation/      Rule, RuleMatcher, Execution
    flows/           FlowVersion, FlowSession, step executor
    ingestion/       webhook controllers, pollers, event normalisation
    dispatch/        outbox dispatcher, BullMQ job publishing, rate limiting
    moderation/      classification, review queue
    assistant/       knowledge sources, retrieval, answering
    audit/           execution log and ownership audit trail
  connectors/        PlatformAdapter port + per-platform adapters (instagram, telegram, ...)
  shared/            crypto, text normalisation, idempotency, scoping, errors, money, clock
```

Allowed dependency direction between modules:

```
ingestion → automation → dispatch → connectors
     ↓          ↓
   flows    moderation, assistant (as action runners)
```

`automation` and `flows` must never contain a platform name (`Instagram`, `Telegram`, …)
anywhere — trigger types, action types, and capability checks are polymorphic. If you
find yourself writing `if (platform === 'instagram')` inside `automation/` or `flows/`,
the abstraction has leaked and the check belongs in a connector or capability instead.

### 2.1 Strict module isolation (rule #1 — the load-bearing rule of this codebase)

No module may import another module's repository implementation, Prisma models, entities,
or internal services directly. **The only two legal ways to cross a module boundary are:**

1. Importing the target module's **public API barrel** — `src/modules/<name>/index.ts` —
   which re-exports only the interfaces/DTOs the module owner intends for external use
   (typically an application-layer service interface + its DTOs). Nothing under
   `domain/`, `infrastructure/`, or `application/use-cases/` is reachable from outside the
   module except through that barrel.
2. **Domain events.** A module publishes an event; another module's use case subscribes.
   No caller-callee coupling, no shared transaction.

This is enforced mechanically by `validate-architecture.js` (see §6) and should be treated
as a build-breaking violation, not a style nit.

### 2.2 No cross-module SQL joins

No Prisma query and no raw SQL may join tables that belong to two different modules
(judge this by which module's `schema.prisma` block "owns" the table, tracked via the
`@@schema`/comment convention each module's README documents). If a report needs data
from two modules, either:

- denormalize into a read model owned by one module and kept in sync via domain events, or
- compose the result in application code with two calls through public APIs.

### 2.3 `shared/` is not a garbage drawer

`shared/` holds true cross-cutting, business-logic-free concerns: `shared/domain/money`,
`shared/crypto`, `shared/text-normalisation`, `shared/idempotency`, `shared/scoping`,
`shared/errors` (the `AppError` hierarchy), `shared/clock`. It must never contain a
`UserService`, an `OrderHelper`, or anything that encodes a business rule belonging to a
specific bounded context. If two modules need the same *business* concept, that is a sign
one of them should own it and expose it through its public API — not a sign it belongs in
`shared/`.

---

## 3. Clean Architecture module structure (mandatory, every module)

```
src/modules/<module-name>/
├── domain/
│   ├── entities/            # Rich entities — behavior + invariants, no getters/setters-as-logic
│   ├── value-objects/        # *.vo.ts
│   ├── errors/               # Pure domain errors, extend Error, no HTTP knowledge
│   └── repositories/         # Interfaces only, e.g. user.repository.ts
├── application/
│   ├── use-cases/            # *.use-case.ts — one class, one job
│   ├── dto/                  # class-validator DTOs for transport
│   ├── ports/                # Gateway/port interfaces (*.gateway.ts) for external systems
│   └── events/                # Domain event definitions + handlers that orchestrate use cases
├── infrastructure/
│   ├── controllers/          # Fastify/Nest controllers — transport only
│   ├── persistence/           # prisma-*.repository.ts + Prisma-specific query logic
│   ├── mappers/               # *.mapper.ts — toDomain()/toPersistence()
│   └── adapters/              # Concrete gateway implementations (*.gateway.ts impls)
├── <module-name>.module.ts    # NestJS DI wiring — providers keyed by Symbol tokens
├── index.ts                   # Public API barrel — the ONLY legal cross-module import surface
└── README.md                  # Module doc: owned tables, public API, published/consumed events
```

**Dependency direction:** `infrastructure → application → domain`. The `domain/` folder
must have zero imports of `@nestjs/*`, `@prisma/client`, `axios`, `fastify`, or anything
under `infrastructure/`. It must be importable and testable in plain Node with no
framework running. `validate-architecture.js` enforces this; do not weaken it to "make a
ticket go faster."

The `scaffold-clean-module` skill (§6) generates this exact skeleton, including a starter
`README.md`, so there is no excuse for a module missing a layer.

---

## 4. Golden rules

### A. Dependency & boundary rules
1. **Dependency direction:** `Infrastructure → Application → Domain`. Domain has zero
   framework/ORM/HTTP awareness and is testable via pure Node.js.
2. **Strict module isolation:** see §2.1. Public API barrel or domain event — nothing else.
3. **No cross-boundary SQL joins:** see §2.2.
4. **`shared/` is not a garbage drawer:** see §2.3.

### B. Domain modeling — rich entities & value objects
5. **Rich entities, no anemic models.**
   - Bad: `user.isActive = true`
   - Good: `user.activate()` — throws `UserAlreadyActiveError` if already active.
6. **Value objects for anything with validation or behavior.**
   - Bad: `email: string`
   - Good: `email: Email` — private constructor, `static create(value: string): Email`
     that throws `InvalidEmailError` on invalid input.

### C. Application layer — use cases over services
7. **Use cases, not god-services.** `CreateUserUseCase`, `CheckoutOrderUseCase` — never a
   `UserService` that accumulates every operation touching a user.
8. **Controllers are transport only.** Flow: `HTTP Request → DTO → Use Case → Response`.
   No business logic, no direct repository access, no direct Prisma access in a controller.
9. **DTOs and entities never mix.** `CreateUserDto` (class-validator, transport shape) is
   not `User` (domain model). A mapper sits between them.

### D. Infrastructure, ports & adapters
10. **Repository interfaces live in `domain/` or `application/ports/`; implementations
    live in `infrastructure/persistence/`.** `UserRepository` (interface) /
    `PrismaUserRepository` (implementation).
11. **External APIs are gateways.** Never call an HTTP client directly from a use case.
    Define a port (`PaymentGateway`, `PlatformAdapter`), implement an adapter
    (`StripePaymentGateway`, `InstagramAdapter`) in `infrastructure/adapters/`.
12. **Always map.** `UserMapper.toDomain(prismaUser)` / `UserMapper.toPersistence(user)`.
    Persistence and external-API shapes never leak past the mapper.
13. **DI via Symbol tokens.**
    ```ts
    export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
    // module:
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository }
    ```

### E. Distributed systems & reliability
14. **No sagas. Outbox + idempotency keys + compensation.** See §0.1 for how this is
    realized with BullMQ as the delivery mechanism and Postgres as the authority.
15. **Never assume atomicity between a DB transaction and an external API call.** If
    Stripe (or Instagram, or Telegram) succeeds and the DB write then fails, the external
    side effect will not roll back. Orchestrate explicitly: write intent first, call
    external API, record outcome, reconcile via idempotency key on retry.
16. **Resilient HTTP clients.** Every outbound call has connect/read/overall timeouts.
    High-traffic external dependencies (platform Graph APIs, Telegram Bot API, the LLM
    provider) get a circuit breaker keyed by connection/provider.
17. **Smart retries.** Retry on timeout, connection error, 429, 5xx. Never retry 400 or
    401 — these are permanent until a human or a token refresh intervenes. Classify
    before retrying; see §0.1.4 for the BullMQ-specific mechanism.
18. **Idempotency keys on every mutation that can be redelivered or double-submitted:**
    `POST` endpoints, inbound webhooks (`dedupe_key`), external side-effecting calls
    (payments, sends). Redelivery must be a no-op, not a duplicate action.

### F. Errors, logging, config
19. **Domain errors vs HTTP exceptions.** Domain throws plain `Error` subclasses with a
    stable `code` (e.g. `class InsufficientBalanceError extends AppError`). A single
    Fastify exception filter maps `AppError` → HTTP status. Domain code never imports
    `HttpException`.
20. **Logging.** Separate business logs (`INFO Order created`) from infra logs
    (`WARN API timeout`). Never log PII, tokens, message bodies, or passwords — a pino
    serializer must redact these (design doc §6.12: the log pipeline is the most common
    leak, not the database). Every log line in a request/job path carries `requestId`
    and/or `correlationId`/`eventId`.
21. **Config never reaches the domain.** `ConfigService` is an application/infrastructure
    concern. Pass resolved values into domain methods as plain arguments; the domain must
    not know `@nestjs/config` exists.

### G. Testing strategy
22. **Layered testing.**
    - Domain/application: fast unit tests, pure mocks for repositories and gateways —
      never mock pure logic.
    - Infrastructure: real Postgres/Redis via Testcontainers.
    - E2E: full HTTP flow via Supertest against the Fastify instance (`app.inject`).
    - Priority order (design doc §10): rule matching → condition evaluation → flow
      stepping (including timeout/reprompt paths) → idempotency/retry against real
      Postgres → adapters against recorded fixtures.
23. **Do not over-mock.** An interface earns its place when it wraps something genuinely
    external/impure: a DB, an external API, the system clock, randomness. Do not create
    `IWhatever` for a pure function.

### H. NestJS specifics
24. **Clean code.** No redundant comments explaining what the code already says. Code is
    self-documenting through naming; comments justify non-obvious *why*, never *what*.
25. **Singleton scope by default.** Do not use `Scope.REQUEST` — it defeats DI caching and
    is a standing memory/performance liability under load. If you believe you need
    request-scoped state, that's a signal to pass the value explicitly instead.
26. **Zero unhandled rejections.** Fastify/Node will crash the process on an unhandled
    promise rejection. Every `async` boundary (controller handler, BullMQ processor,
    event handler) must resolve or reject explicitly — no fire-and-forget `.then()`
    without a `.catch`, no bare `async` function invoked without `await`/`void` + local
    error handling.
27. **Naming conventions (enforced):**
    `*.use-case.ts`, `*.repository.ts`, `prisma-*.repository.ts`, `*.gateway.ts`,
    `*.mapper.ts`, `*.entity.ts`, `*.vo.ts`, `*.dto.ts`, `*.module.ts`.

---

## 5. Domain context you must not contradict

This is a condensed index into `docs/social-assistant-design-v2.md`. Do not re-derive or
reinvent these — read the linked section before writing code that touches them.

- **Ownership model (§4 of the doc):** `social_accounts` (permanent) vs `account_tenures`
  (who manages it now) vs `channel_connections` (the OAuth token, ephemeral, soft-delete
  only). Configuration data (rules/flows/knowledge) is scoped by `social_account_id` and
  does **not** transfer to a new owner by default. Conversational data (events,
  conversations, messages, moderation decisions) is scoped by `tenure_id` and **never**
  transfers. OAuth proves current admin access, not ownership — see journey 6.3 for the
  claim/objection flow.
- **Execution state machine (§5):**
  `pending → dispatched → running → succeeded`, with `failed → (attempts < max) →
  pending` and a `dead_lettered` terminal state. `scheduled_at` controls delay,
  `next_attempt_at` controls backoff — both are plain columns so disabling a rule cancels
  pending work with one `UPDATE` (see §0.1 for how this composes with BullMQ).
- **Rule/flow engine (§7):** matching runs **in memory** over rules cached per account,
  never as a JSONB query in SQL — pushing rule evaluation into the database leaks domain
  logic into the persistence layer. `ConditionNode` and `Action` are polymorphic JSONB
  validated by a Zod registry keyed on `type`. New platform capabilities register via
  `@RegisterAction(...)` and `NestJS DiscoveryService` — no migration, no engine change.
- **Capability discovery (§7):** never assume a platform can do something; adapters
  declare `capabilities: Set<Capability>`, connections store the resolved set, and the UI
  and the save-path both reject conditions/actions the connection can't support.
- **Connector boundary (§8):** `NormalizedEvent` is the anti-corruption layer — nothing
  downstream of ingestion should see a platform-specific payload shape. `unofficial`-risk
  adapters run only inside `worker-risky`.
- **Reliability rules (§9 of the doc):** idempotent ingestion via `dedupe_key`,
  transactional outbox, `SELECT ... FOR UPDATE SKIP LOCKED` claiming, loop prevention
  (ignore self-authored events, per-author cooldown), per-conversation locking during flow
  stepping, per-connection token bucket in Redis consumed *before* the call, circuit
  breaker per connection, graceful shutdown, dead-letter with a human-readable reason.
- **Conventions (§10):** one `PrismaScope` layer enforcing both `social_account_id` and
  `tenure_id` filtering in one place; text stored as `raw_text` + `normalized_text` with a
  versioned normalizer; Zod at every boundary including LLM structured output; one
  `AppError` hierarchy; expand/contract-only migrations (never drop a column in the same
  release that stops writing it).

---

## 6. Available tooling in this workspace (Codex CLI)

Codex CLI's governance mechanisms are different in kind from Claude Code's, not just in
location — read `.codex/README.md` for the full picture. Summary:

- **Skills** (`.agents/skills/`) — Codex discovers skills by walking from the current
  working directory up to the repo root, so these are visible from anywhere in `src/`.
  Same three skills as the Claude Code side: `validate-architecture` (import-boundary
  static analysis — run it after any change that adds or moves an import across a module
  or layer boundary), `scaffold-clean-module` (folder generator for a new module),
  `lint-leaks` (`Scope.REQUEST` / unhandled-promise sweep). Invoke explicitly with
  `$skill-name` or let Codex match one implicitly from its description — don't wait for
  it to be automatic if you know exactly which check you need.
- **Rules** (`.codex/rules/*.rules`) — Starlark `prefix_rule()` definitions that make the
  same allow/ask/forbid boundaries from `CLAUDE.md`'s Claude-side `settings.json`
  enforceable at the sandbox/exec layer for Codex: safe read commands and scoped
  `npm`/`prisma`/`jest`/`docker compose` calls are `allow`, destructive git/Prisma/Docker
  operations are `forbidden`, a middle tier (`git push`, `prisma migrate deploy`) is
  `prompt`. These only load when this project is **trusted** — see §6.1.
- **Subagents** (`.codex/agents/*.toml`) — `nestjs-clean-architect` (primary implementer,
  `workspace-write`), `architecture-guardian` (reviewer, **`sandbox_mode = "read-only"`**
  — enforced by the sandbox itself, not just by omitting tools, which is a stronger
  guarantee than the Claude Code side can give the equivalent agent),
  `reliability-outbox-specialist` (outbox/idempotency/BullMQ specialist for `dispatch/`,
  `automation/`, `ingestion/`, `flows/`). Spawn one by name when a task matches its
  description rather than doing everything in the root session.
  These are additive to Codex's built-in `explorer`/`worker`/`default` agents, not a
  replacement for them.
- **MCP servers** (`.codex/config.toml`, `[mcp_servers.*]`) — `postgres`
  (`crystaldba/postgres-mcp`, read-only `--access-mode=restricted`) and `prisma` (the
  official hosted server at `https://mcp.prisma.io/mcp`). Same rationale as the Claude
  Code side's `.claude/plugins/mcp-servers.json` — read-only schema/query introspection
  by default, never a bundled write credential.

### 6.1 Project trust

None of `.codex/rules/`, `.codex/agents/`, or the project-scoped keys in
`.codex/config.toml` take effect until this repository is marked **trusted** in Codex.
An untrusted run of Codex against this repo will ignore all of the above and fall back to
Codex's own defaults — treat a session that doesn't seem to be honoring these rules as a
sign to check trust status first, not a sign the config is broken.

---

## 7. What this file does not cover

Payment gateway integration, rule/flow builder UX, and the unofficial-adapter session/proxy
strategy are explicitly open decisions in the design doc (§11) — do not treat their
absence here as permission to invent an architecture for them ad hoc. Raise it as a
decision to make and get it resolved and recorded, the same way §0.1 records how BullMQ
composes with Postgres-owned scheduling, rather than silently assuming an answer.

## 8. Claude Code parity

This repository is also worked in via Claude Code. `CLAUDE.md` at the repo root carries
the same architectural rules as this file, adapted to Claude Code's own mechanisms
(`.claude/commands/`, `.claude/skills/`, `.claude/agents/`, `.claude/settings.json`). The
two files must stay in agreement on substance — if you change an architectural rule
here, make the same change there in the same turn, not "later." See `.codex/README.md`
for the concrete file-by-file mapping between the two toolchains.

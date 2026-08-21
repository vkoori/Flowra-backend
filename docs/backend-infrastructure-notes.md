# Backend infrastructure notes

Rationale for infrastructure and architectural choices that would otherwise live as
inline comments. `CLAUDE.md`/`AGENTS.md` is the binding governance layer (the rules);
this file is the "why" behind specific pieces of code that implement those rules.
Organized by file so it's easy to find the note for whatever you're reading.

## `docker-compose.yml`

Local dev infra only — Postgres (with pgvector) and Redis, plus SeaweedFS for S3-compatible
object storage. The application itself runs on the host via `npm run start:dev`, not from
this file. The four-role container topology (CLAUDE.md/AGENTS.md §1 — one Dockerfile, four
`APP_MODE`-selected instances) is a separate, later concern.

`docker/postgres-init/` creates a second database, `flowra_test`, alongside `flowra_dev` on
first container init — that's why only one `POSTGRES_DB` env var is set here but two
databases exist once the container has started.

## `src/main.ts`

`bootstrap()` resolves `APP_MODE` exactly once, at this single edge point (CLAUDE.md/AGENTS.md
§1) — business code must never branch on `APP_MODE` itself.

`env` is validated once here, before any bootstrap path runs, rather than being re-read ad
hoc from `process.env` inside each function. The ad-hoc pattern previously meant the pino
logger's level was read (and could silently misbehave on a typo) before `ConfigModule`'s own
`validate()` ever ran.

`genReqId` on the Fastify adapter sets `request.id` independently of whichever logger is
attached — that's why the response envelope (`shared/presentation/http/response-envelope.ts`)
can read `request.id` regardless of the pino wiring.

`bufferLogs: true` + `app.useLogger(app.get(PinoLogger))` replaces Nest's default console
`Logger` with nestjs-pino's, so every `Logger.log/error/warn` call in the app — not just
Fastify's own request/response access logs — goes through the same redacting pino instance
(CLAUDE.md/AGENTS.md §4.F.20). Without this, an exception filter logging a raw error object
could leak a token/password that only the HTTP-access-log redact config would have caught.

## `src/app.module.ts`

The single pino instance for the whole app is wired via `LoggerModule.forRootAsync` here; every
`Logger.log/error/warn` call goes through it with the same redact config once `main.ts` calls
`app.useLogger(app.get(Logger))` — a `Logger.error()` call anywhere that isn't redacted is
exactly the leak vector CLAUDE.md/AGENTS.md §4.F.20 warns about.

`I18nModule` is safe to wire eagerly (unlike `PrismaModule` — see below): it loads local JSON
files, no external service connection at startup. Its keys are validated by the `validate-i18n`
skill — no hardcoded Persian/Arabic literals in source, and every `t()`/`translate()` call site
must reference a key that actually exists.

`QueueModule` is also safe to wire eagerly — see `queue.module.ts` below for why this doesn't
force a Redis connection at boot the way importing `PrismaModule` would force a Postgres one.

Feature modules land in the `imports` array as they're scaffolded (docs/social-assistant-design-v2.md
§12 build order: identity/accounts/channels first) — it's deliberately empty until the first
one exists, not an oversight.

## `src/app.controller.ts`

Deliberately lives outside `src/modules/` — it's a liveness probe with no bounded context and
no business logic. CLAUDE.md/AGENTS.md §4.C.8 still applies: this is transport, nothing else.

## `src/shared/errors/app.error.ts` and `error-code.enum.ts`

Domain/application code throws `AppError` subclasses; only the exception filter
(`shared/presentation/filters/app-exception.filter.ts`) maps them to HTTP, since response
shaping/status codes are a presentation concern (CLAUDE.md/AGENTS.md §4.F.19). Domain code
must never import this file's subclasses for their HTTP concerns — the `httpStatus` field
lives on `AppError` only because `shared/errors` is the one place both the domain-error
hierarchy and its presentation-layer mapping are allowed to meet.

`code` is typed as the shared `ErrorCode` enum, not a bare string. Every module's domain
errors add their own member to that one enum rather than inventing their own, because codes
must be globally unique across the whole app — they double as the i18n key suffix
(`errors.<code>` in `src/i18n/<lang>/errors.json`), so a collision would silently show the
wrong message for two different failures. `ErrorCode` is a plain enum with zero framework
dependencies, so domain code importing it doesn't violate domain purity.

`INTERNAL_ERROR` and `HTTP_EXCEPTION` are the two codes the exception filter itself produces
for non-`AppError` cases; everything else belongs to whichever module's domain error owns it.

`HTTP_EXCEPTION` deliberately has **no** `errors.HTTP_EXCEPTION` key in `errors.json`, and
never should: a framework-thrown `HttpException` (404, a pipe's `BadRequestException`, ...)
already carries its own specific message. Adding a generic translation would override that
with one canned phrase for every such exception, destroying information a "not translated"
code is otherwise supposed to preserve.

`INTERNAL_ERROR` is the opposite case — deliberately generic on purpose, since leaking the
real cause of an unexpected exception to the client is exactly the failure mode §4.F.19
exists to prevent — so it's the one code that should always have a translation.

## `src/shared/presentation/filters/app-exception.filter.ts`

The only place an `AppError`'s `code` gets translated (CLAUDE.md/AGENTS.md §4.F.19) — domain
never imports `nestjs-i18n`. Convention: translation key is `errors.<code>`, registered in
`src/i18n/<lang>/errors.json`; ownership of which module registers which key is tracked by
convention, the same way `schema.prisma` tracks table ownership by comment, not by physically
splitting the file per module.

`translateErrorCode` falls back to the untranslated message rather than throwing if there's no
`I18nContext` — this filter only ever runs inside the HTTP request pipeline (`api` mode), but
`nestjs-i18n`'s per-request context still depends on that pipeline having actually run its
resolvers, so absence is treated as "not translatable right now," not as a bug. If
worker/scheduler code ever wants a translated `AppError` message for a log line outside any
HTTP request, it will hit this same fallback — that's expected, not a gap to fix.

## `src/shared/presentation/swagger/setup-swagger.ts`

Not mounted in production by default (see the call site in `main.ts`) — reduces attack surface
until this API has a stable public contract and auth in front of it.

`cleanupOpenApiDoc()` is required by `nestjs-zod` to post-process the document generated from
Zod schemas (`createZodDto`) into correct OpenAPI output — without it, schemas generated from
Zod v4's `z.toJSONSchema()` don't render correctly in the Swagger UI.

## `src/shared/infrastructure/bullmq/queue.module.ts`

`maxRetriesPerRequest: null` is BullMQ's own connection requirement, not a style choice — see
`node_modules/bullmq`'s `RedisConnection`, which throws/warns otherwise.

`lazyConnect: true` matters because zero queues exist yet (`dispatch`/`automation` aren't
built) — without it, ioredis dials Redis immediately at boot and retries forever, which is
wasted work and log noise when nothing is using the connection. BullMQ opens the connection for
real the moment a feature module registers an actual queue.

This module is safe to wire eagerly into `AppModule` despite the "don't connect until needed"
rule that keeps `PrismaModule` out of it (see below): `forRootAsync` only stores connection
options — BullMQ opens the actual Redis connection lazily, the first time a feature module
calls `BullModule.registerQueue()`/`@InjectQueue()`, of which none exist yet.

## `src/shared/infrastructure/prisma/prisma.module.ts` and `prisma.service.ts`

`PrismaModule` is not yet imported into `AppModule` — no module needs a database connection
until the first feature module (`identity`, per docs/social-assistant-design-v2.md §12 build
order) is scaffolded. Importing it unconditionally would force every local
`npm run start:dev` to require a live Postgres just to serve `/health`.

Prisma 7 requires a driver adapter at the client, not a `schema.prisma` URL — see
`prisma.config.ts` for the CLI-side counterpart. `PrismaService` is the one place in the
codebase that constructs a `PrismaClient`; every module's `prisma-*.repository.ts`
(CLAUDE.md/AGENTS.md §4.D.10) depends on this service, never on `PrismaClient` directly.

## `prisma.config.ts`

CLI-side config only (`migrate`/`studio`/`introspect`). The runtime client does not read this
file — it gets its connection via the driver adapter in `PrismaService` instead. Kept as a
plain `.ts` file at the repo root because that's where Prisma 7's CLI looks for it by default.

## `src/shared/text-normalisation/normalize-text.ts`

Unit-expression matching (e.g. `"256GB"` vs `"۲۵۶ گیگ"`) is out of scope here — that's
assistant-module product-spec matching, not general keyword normalization. Do not
half-implement it in this shared function; it belongs in `assistant/` once that module exists
(docs/social-assistant-design-v2.md §12).

## `eslint.config.js`

The module-isolation rule here is a defense-in-depth, editor-time layer on top of the
authoritative check — `.claude/skills/validate-architecture/validate-architecture.js` resolves
real file paths via the TypeScript AST and is immune to the string-matching edge cases
(alternate barrel import spellings, etc.) a glob-based ESLint rule can't fully cover.
`eslint-plugin-boundaries` was deliberately not adopted for this: at the time this was written
its docs were mid-migration to a new site and its exact current flat-config API couldn't be
confirmed, so core ESLint's `no-restricted-imports` was the safer choice.

The module-isolation `no-restricted-imports` patterns match `**/${other}/domain/**` etc. rather
than `**/modules/${other}/**` — a relative specifier like `../../../dispatch/domain/x` never
literally contains the word "modules" (it's elided by the `../` traversal), so requiring that
prefix would silently fail to catch the single most common violation shape. Matching on
`${other}/<layer>/` needs no barrel-form negation either: a bare `../../dispatch` or
`../../dispatch/index` import (the allowed barrel) never has `/domain/`, `/application/`, or
`/infrastructure/` as its next path segment, so it never matches.

`no-floating-promises`/`no-misused-promises` are enforced repo-wide per CLAUDE.md/AGENTS.md
§4.H.26 (Fastify/Node crashes the process on an unhandled promise rejection).
`Scope.REQUEST` is banned outright via `no-restricted-syntax` per §4.H.25.

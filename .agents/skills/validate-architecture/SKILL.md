---
name: validate-architecture
description: AST-based import-boundary and structure check for the NestJS Clean Architecture modular monolith. Use after adding, moving, or editing any file under src/, and before reporting any module-touching task as complete.
---

# validate-architecture

> Mirrored verbatim at `.claude/skills/validate-architecture/` for Claude Code discovery.
> The two copies must stay byte-identical — edit one, then copy it over the other in
> the same turn.

This skill runs `validate-architecture.js`, a TypeScript-compiler-API-based analyzer
(no regex guessing — real AST) that checks every `.ts` file under `src/` against
`CLAUDE.md`/`AGENTS.md` §2, §3, and §4. **This requires `node_modules/typescript`** (a
project devDependency already) — it will fail fast with an actionable message if run
before `npm install`, rather than silently degrading.

## Hard rules (violations — non-zero exit)

- **Domain/application purity** — `domain/` never imports `@nestjs/*`, `@prisma/client`,
  `fastify`, `axios`, `bullmq`, `ioredis`, or its own `application/`/`presentation/`/
  `infrastructure/`; `application/` never imports `@prisma/client`, `fastify`, `axios`,
  or its own `presentation/`/`infrastructure/` directly.
- **Module isolation** — no file in `src/modules/<A>/` may resolve an import into
  `src/modules/<B>/` unless it resolves exactly to `src/modules/<B>/index.ts`. This is
  checked for **both relative imports and tsconfig path-alias imports** — an alias
  can't be used to bypass isolation.
- **Barrel leaks** — a module's own `index.ts` may not re-export from its own `domain/`,
  `presentation/`, or `infrastructure/` — the barrel is application-layer-only, or
  anything importing it transitively reaches internals anyway.
- **Module structure** — every directory under `src/modules/` must have an `index.ts`;
  files directly under `domain/` must sit inside `entities/`, `value-objects/`,
  `errors/`, or `repositories/`; files directly under `presentation/` must sit inside
  `http/`, `queue/`, or `scheduler/` (see below) — nothing else, in either case.
- **`presentation/` shape** — `http/` and `queue/` each require a further "kind"
  subfolder (`http/{controllers,dto,mappers}/`, `queue/{consumers,dto,mappers}/`);
  `scheduler/` is flat (`*.job.ts` directly inside it, no subfolder). Only `http/`
  exists from day one — `queue/`/`scheduler/` are added by hand once a module actually
  gains a BullMQ consumer or a cron job, never speculatively.
- **Correct location by suffix** — `*.use-case.ts` → `application/use-cases/`;
  `*.repository.ts` (interface) → `domain/repositories/` or `application/ports/`;
  `prisma-*.repository.ts` (implementation) → `infrastructure/persistence/`.
- **Naming convention** — folder-to-suffix mapping from §4.H.27 plus the presentation
  conventions in §3: `.entity.ts`, `.vo.ts`, `.repository.ts`, `.use-case.ts`,
  `.gateway.ts`, `.dto.ts`, `.mapper.ts`, `.controller.ts` (`presentation/http/
  controllers/`), `.consumer.ts` (`presentation/queue/consumers/`), `.job.ts`
  (`presentation/scheduler/`); `infrastructure/persistence/*.repository.ts` files must
  be prefixed `prisma-`.
- **Controller/consumer/job layering** — any entry-point handler
  (`presentation/http/controllers/`, `presentation/queue/consumers/`,
  `presentation/scheduler/`) may not import `domain/`, `infrastructure/`, or Prisma
  directly — it must go through `application/use-cases/`.
- **Prisma boundary** — `@prisma/client` / the generated client may only be imported
  from `infrastructure/persistence/**` or the one sanctioned
  `src/shared/infrastructure/prisma/prisma.service.ts` — checked repo-wide, not just
  inside `src/modules/`.
- **`Scope.REQUEST`** — banned outright, anywhere under `src/` (§4.H.25), detected by AST
  (any `Scope.REQUEST` property access, including inside a decorator argument object).
- **Circular imports** — a DFS over the whole local (relative + alias-resolved) import
  graph under `src/`; any cycle is reported with its file chain.

## Heuristics (reported, don't fail unless `--strict`)

- **Anemic entities** — a public, non-readonly property on a class under
  `domain/entities/` (§4.B.5 — should usually be a named method with an invariant
  check instead).
- **Entry-point business logic** — more than one branching statement
  (`if`/`switch`/loop/ternary) inside a controller, consumer, or scheduled job file.
- **Stray `any`** — the `any` keyword used outside a `presentation/*/dto/` file or a
  `.spec.ts` file (§0 — prefer `unknown` + Zod).

These are judgment calls a script can get wrong in either direction, so they're
reported for a human/`architecture-guardian` to weigh, not auto-failed by default.

## What this still doesn't check

Rich-entity *behavior* correctness (does `activate()` actually throw on double-activate?),
DTO/entity conflation inside a use case's body, retry classification correctness, and
cross-module SQL joins (needs reading `schema.prisma` ownership comments alongside query
bodies) all still need `architecture-guardian` or a human. Persian/Arabic hardcoded
strings and i18n key registration are a separate concern — see the `validate-i18n`
skill.

## How to invoke

```bash
node .agents/skills/validate-architecture/validate-architecture.js
node .agents/skills/validate-architecture/validate-architecture.js --module automation
node .agents/skills/validate-architecture/validate-architecture.js --json
node .agents/skills/validate-architecture/validate-architecture.js --strict   # also fail on heuristics
node .agents/skills/validate-architecture/validate-architecture.js --quiet    # used by pre-commit
```

If `src/` does not exist yet, the script prints a one-line notice and exits `0`.

## When a violation looks like a false positive

Move the shared concept to `shared/`, export it through the owning module's `index.ts`,
or fix the actual layering — don't special-case the validator. Only add to
`ALLOWED_EXCEPTIONS` in the script (format: `path::rule-name`) with the user's explicit
sign-off, recorded with a comment explaining why.

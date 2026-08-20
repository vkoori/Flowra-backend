---
name: validate-architecture
description: Static import-boundary check for the NestJS Clean Architecture modular monolith. Use after adding, moving, or editing any file under src/modules/ to confirm domain/application layers stay framework-free and no module reaches into another module's internals. Also use before reporting any module-touching task as complete.
---

> Mirrored verbatim at `.claude/skills/validate-architecture/` for Claude Code discovery.
> The two copies must stay byte-identical — edit one, then copy it over the other in
> the same turn.

# validate-architecture

This skill runs `validate-architecture.js`, a dependency-free Node script that parses
every `.ts` file under `src/modules/` and flags import-boundary violations against the
rules in `CLAUDE.md`/`AGENTS.md` §2 and §3:

1. **Domain purity** — files under any `<module>/domain/` must not import `@nestjs/*`,
   `@prisma/client`, `fastify`, `axios`, or anything under that module's own
   `application/` or `infrastructure/`.
2. **Application purity** — files under `<module>/application/` must not import
   `@prisma/client`, `fastify`, `axios`, or anything under that module's own
   `infrastructure/`.
3. **Module isolation** — no file in `src/modules/<A>/` may import from
   `src/modules/<B>/` unless the import resolves exactly to `src/modules/<B>/index.ts`
   (the public API barrel). Imports from `src/shared/` and `src/connectors/` are exempt —
   those are not bounded-context modules.

## How to invoke

```bash
node .claude/skills/validate-architecture/validate-architecture.js
node .claude/skills/validate-architecture/validate-architecture.js --module automation
node .claude/skills/validate-architecture/validate-architecture.js --json
node .claude/skills/validate-architecture/validate-architecture.js --quiet   # used by the PostToolUse hook; silent when clean
```

Exit code is `1` if any violation is found (except in `--quiet` mode, which still exits
`1` but suppresses the "no violations" success line — it's meant for a hook, not a human).
If `src/modules/` does not exist yet, the script prints a one-line notice and exits `0` —
this is expected on a fresh scaffold and is not a failure.

## What this skill does NOT check

This is static-analysis-by-regex on import specifiers, not a type-aware boundary tool.
It cannot verify:

- rich-entity vs anemic-model modeling (CLAUDE.md/AGENTS.md §4.B),
- use-case granularity or DTO/entity separation (§4.C),
- retry classification or idempotency key usage (§4.E),
- cross-module SQL joins (§2.2 — that requires reading `schema.prisma` ownership
  comments and query bodies together).

For those, use the `architecture-guardian` agent (`.claude/agents/architecture-guardian.md`)
or the `/architecture-audit` command, which combines this script's output with a
narrative review.

## When a violation looks like a false positive

If the script flags a legitimate case (e.g. a type-only import of a shared enum that
happens to live under another module's `domain/` because it hasn't been promoted to
`shared/` yet), the correct fix is almost always to **move the shared concept to
`shared/`** or **export it through the owning module's `index.ts`** — not to special-case
the validator. Only edit the script's `ALLOWED_EXCEPTIONS` list if the user explicitly
approves a one-off exception and you record why in a comment at that list.

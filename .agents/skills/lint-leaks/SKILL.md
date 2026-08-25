---
name: lint-leaks
description: Sweep for unhandled-promise patterns and Scope.REQUEST usage — the two NestJS/Fastify footguns CLAUDE.md/AGENTS.md §4.H.25-26 calls out as process-crashing or memory-leaking. Use before finishing any task that adds async code, event/job handlers, or provider scope decorators.
---

> Mirrored at `.claude/skills/lint-leaks/` for Claude Code discovery. Keep the skill's
> behavior and executable implementation aligned across both copies; invocation paths
> are tool-specific.

# lint-leaks

Runs `lint-leaks.sh`, which does two things:

1. **If ESLint is configured** (an `eslint.config.*` or `.eslintrc*` exists and
   `npx eslint` resolves), runs it against `src/` and surfaces failures — this is the
   authoritative check once the project has `@typescript-eslint/no-floating-promises`
   and `eslint-plugin-promise` wired in.
2. **Always**, regardless of ESLint's presence, runs a set of grep-based heuristics as a
   floor-level safety net (useful before dependencies are even installed):
   - `Scope.REQUEST` anywhere in `src/` (CLAUDE.md/AGENTS.md §4.H.25 — banned).
   - `.then(` call sites with no `.catch(` within the same statement or the next couple
     of lines — a common shape for a floating promise that Fastify/Node will turn into
     an unhandled rejection crash (§4.H.26).
   - a bare, non-awaited call to a function whose name suggests it's async
     (`handle...`, `process...`, `dispatch...`, `send...`) at statement level with no
     `await`, `return`, or `void` — heuristic, expect some false positives, read the
     surrounding code before treating a hit as confirmed.

## How to invoke

```bash
bash .agents/skills/lint-leaks/lint-leaks.sh
bash .agents/skills/lint-leaks/lint-leaks.sh --quiet
bash .agents/skills/lint-leaks/lint-leaks.sh --strict   # exit 1 if any heuristic hit fires
```

Without `--strict` this is advisory (exit 0 always) because the grep heuristics are not
precise enough to gate a session on. Treat its output as "go look at these lines," not
as ground truth. Once real ESLint rules are configured, prefer fixing based on ESLint's
output over the heuristics — remove a heuristic once ESLint's typed analysis supersedes
it, rather than keeping both permanently.

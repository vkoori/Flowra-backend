---
description: Run the static architecture validator and a narrative audit against CLAUDE.md's golden rules
argument-hint: [module-name]
allowed-tools: Bash(node .claude/skills/validate-architecture/validate-architecture.js:*), Bash(bash .claude/skills/lint-leaks/lint-leaks.sh:*), Read, Grep, Glob, Agent
---

Run a full architecture audit, scoped to `$1` if given, otherwise the whole `src/` tree.

1. Run `node .claude/skills/validate-architecture/validate-architecture.js` (add
   `--module $1` if a module was given) and capture the exact violations reported —
   file, line, and which rule from CLAUDE.md §2/§3 was broken.
2. Run `bash .claude/skills/lint-leaks/lint-leaks.sh` and capture unhandled-promise and
   `Scope.REQUEST` findings.
3. Delegate a narrative review to the `architecture-guardian` subagent: hand it the raw
   findings from steps 1–2 plus the target scope, and ask it to check the golden rules
   that static analysis cannot (rich entities vs anemic models, use-case granularity,
   DTO/entity separation, retry classification, idempotency key usage) for the files in
   scope.
4. Merge both into one report, ranked by severity (module-isolation violations and
   domain-layer framework leaks first, since those break the architecture's core promise;
   naming/style issues last). Do not fix anything automatically unless I ask you to —
   this command reports, it does not remediate.

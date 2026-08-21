---
description: Scaffold a new Clean Architecture module under src/modules/
argument-hint: <module-name> ["one-line purpose"]
allowed-tools: Bash(bash .claude/skills/scaffold-clean-module/scaffold-clean-module.sh:*), Bash(node .claude/skills/validate-architecture/validate-architecture.js:*), Read, Edit
---

Scaffold a new bounded-context module named `$1` (kebab-case) inside
`src/modules/`. Purpose/description, if given as the remaining arguments: $ARGUMENTS

Steps:

1. Run `bash .claude/skills/scaffold-clean-module/scaffold-clean-module.sh $1` to
   generate the `domain/`, `application/`, `presentation/http/`, `infrastructure/`
   folders, the `$1.module.ts` DI wiring stub, the `index.ts` public API barrel, and
   `README.md`. Only `presentation/http/` is generated — add `presentation/queue/` or
   `presentation/scheduler/` by hand later if this module ever gains a BullMQ consumer
   or a cron job (CLAUDE.md/AGENTS.md §3).
2. Open the generated `README.md` and fill in the "Purpose" section using the
   description given above (or ask, if none was given). Do not invent business rules —
   if `docs/social-assistant-design-v2.md` describes this module, quote its relevant
   section; if it doesn't, leave the open questions explicit rather than guessing.
3. Do NOT add any use cases, entities, or controllers beyond the placeholder stubs the
   script creates. This command only scaffolds structure — implementation happens via
   `/new-usecase`, `/new-adapter`, etc., or direct implementation work in a follow-up turn.
4. Run `node .claude/skills/validate-architecture/validate-architecture.js` and confirm
   it reports zero violations for the new module before finishing.
5. Report the created file tree back to me, and remind me which module map entry in
   `CLAUDE.md` §2 this corresponds to (or flag if `$1` isn't one of the documented
   modules — new modules outside the documented map need a deliberate decision, not a
   silent addition).

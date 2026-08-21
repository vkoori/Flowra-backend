---
name: scaffold-clean-module
description: Generate the mandatory Clean Architecture folder skeleton (domain/application/infrastructure, module wiring, public API barrel, README) for a new bounded-context module under src/modules/. Use whenever starting a module that doesn't exist yet — never hand-create these folders one at a time.
---

> Mirrored verbatim at `.agents/skills/scaffold-clean-module/` for Codex CLI discovery.
> The two copies must stay byte-identical — edit one, then copy it over the other in
> the same turn.

# scaffold-clean-module

Runs `scaffold-clean-module.sh <module-name>` to generate the exact structure mandated
by `CLAUDE.md`/`AGENTS.md` §3 for a new module under `src/modules/`:

```
src/modules/<module-name>/
├── domain/{entities,value-objects,errors,repositories}/
├── application/{use-cases,ports,events}/
├── presentation/http/{controllers,dto,mappers}/
├── infrastructure/{persistence,mappers,adapters}/
├── <module-name>.module.ts
├── index.ts
└── README.md
```

Only `presentation/http/` is generated. `presentation/queue/{consumers,dto,mappers}/`
and `presentation/scheduler/` (flat, `*.job.ts`) are added by hand later, only once a
module actually gains a BullMQ consumer or a cron job — see `CLAUDE.md`/`AGENTS.md` §3.

Empty directories get a `.gitkeep` so the skeleton is committable before any real file
exists in them. `<module-name>.module.ts` and `index.ts` are minimal, compiling stubs —
this skill scaffolds structure, not behavior. `README.md` is generated from
`README.template.md` in this skill's directory with the module name substituted in.

## How to invoke

```bash
bash .claude/skills/scaffold-clean-module/scaffold-clean-module.sh <module-name>
```

`<module-name>` must be kebab-case (`account-tenures`, not `AccountTenures` or
`account_tenures`) — the script validates this and refuses to run otherwise, since every
generated path and class name derives from it.

The script refuses to overwrite an existing module directory. If the module already
exists and you need to add a missing piece (e.g. it's missing `infrastructure/mappers/`),
create that one directory by hand rather than re-running this script — it is not
idempotent by design, to avoid silently clobbering a module someone is mid-way through
writing.

## After running

1. Cross-check `<module-name>` against the module map in `CLAUDE.md`/`AGENTS.md` §2. If it's not one
   of the documented modules, that's a decision to flag explicitly, not something to
   scaffold silently.
2. Fill in `README.md`'s "Purpose" section.
3. Run the `validate-architecture` skill to confirm the new module starts clean.

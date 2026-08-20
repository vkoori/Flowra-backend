---
description: Add a domain event published by one module and (optionally) wire a consumer in another
argument-hint: <publishing-module> <EventName> [consuming-module]
allowed-tools: Read, Write, Edit, Bash(node .claude/skills/validate-architecture/validate-architecture.js:*)
---

Add a domain event named `$2` published by `src/modules/$1/`, and if a third argument
is given, wire a consumer inside `src/modules/$3/`.

This is the *only* mechanism (alongside a module's public API barrel — CLAUDE.md §2.1)
through which one module may react to another module's state changes.

1. Define the event shape in
   `src/modules/$1/application/events/<kebab-name>.event.ts` — a plain data class/type,
   no NestJS decorators required beyond what the chosen event bus needs (e.g.
   `@nestjs/event-emitter`'s `EventEmitter2`, if that's what's already in use — check
   before introducing a second event mechanism).
2. Publish it from inside a use case in `$1`, after the state change it describes has
   already been committed — never before, and never as a substitute for the outbox
   pattern described in CLAUDE.md §0.1 for anything that must reach an external system.
3. If `$3` was given: add a handler inside `src/modules/$3/application/events/` that
   subscribes to `$2` and invokes a use case in `$3`. The handler must import the event
   type only — never a repository, entity, or Prisma model belonging to `$1`.
4. Document the event in both modules' `README.md` under "Published events" /
   "Consumed events" so the cross-module contract is discoverable without reading code.
5. Run `node .claude/skills/validate-architecture/validate-architecture.js`.

If `$1` or `$2` is missing, ask me rather than guessing.

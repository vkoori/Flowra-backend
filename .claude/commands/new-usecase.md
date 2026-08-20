---
description: Scaffold a new application-layer use case with its unit test stub
argument-hint: <module-name> <UseCaseName>
allowed-tools: Read, Write, Edit, Bash(node .claude/skills/validate-architecture/validate-architecture.js:*)
---

Create a new use case named `$2` inside `src/modules/$1/application/use-cases/`.

Follow CLAUDE.md §4.C and §4.D strictly:

1. File name: kebab-case of `$2` with a `.use-case.ts` suffix
   (e.g. `CreateUser` → `create-user.use-case.ts`).
2. The class does exactly one job. Its constructor depends only on interfaces
   (repository interfaces from `domain/repositories/` or `application/ports/`, gateway
   ports, `shared/clock`, etc.) injected via Symbol tokens — never a concrete
   `Prisma*Repository` or a concrete HTTP client.
3. It orchestrates: load domain entities/value objects through repository interfaces,
   call behavior methods on rich entities (never mutate primitive flags directly), catch
   nothing that it can't meaningfully handle — let domain errors propagate to the
   exception filter.
4. It does not import anything from another module except that module's `index.ts`
   public API barrel, and does not import `@nestjs/common`'s HTTP decorators (this is
   application layer, not a controller).
5. Add a matching unit test in the same `use-cases/` directory
   (`<kebab-name>.use-case.spec.ts`) that mocks the repository/gateway interfaces —
   do not spin up Nest's DI container or touch a real database for this test tier.
6. Wire the use case into `$1.module.ts` as a provider if it isn't already reachable via
   existing DI wiring.
7. Run `node .claude/skills/validate-architecture/validate-architecture.js` and fix any
   reported violation before finishing.

If `$1` or `$2` is missing, ask me for it rather than guessing a name.

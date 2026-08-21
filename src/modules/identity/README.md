# identity

## Purpose

`identity` owns authentication and user accounts — the `User` credential/identity
record referenced across the system (per `docs/social-assistant-design-v2.md` §3's
module list: "identity: auth, users"). It is intentionally the thinnest module in the
map: no ownership semantics, no execution state, no flow/rule concepts — those belong to
`accounts`, `automation`, and `flows` respectively. This pass only fills in `domain/` and
`infrastructure/persistence|mappers` (rich `User` entity, `Email` value object, the
`UserRepository` port and its Prisma implementation) — no use cases, controllers, DTOs,
or module wiring yet.

## Owned tables

- `users` (Prisma model `User`) — `id`, `email` (unique), `passwordHash`, `displayName`,
  `createdAt`, `updatedAt`. No other module may join against this table directly
  (CLAUDE.md §2.2).

## Public API (`index.ts`)

- None yet. No application-layer use case has been built in this pass, so the barrel
  intentionally exports nothing. Once a use case (e.g. `CreateUserUseCase`,
  `AuthenticateUserUseCase`) exists, its interface and plain input/output types are the
  only things this barrel should re-export — never the `User` entity, `Email` VO, or
  `UserRepository` port themselves.

## Published events

- TODO — none yet

## Consumed events

- TODO — none yet

## Open questions

- **Password hashing strategy.** `passwordHash` is treated as an opaque, already-hashed
  string at this layer by design — hashing/verification is a future use-case-layer
  concern, mediated by a port (e.g. a `PasswordHasher`/`Encryptor`-style port under
  `application/ports/`) that does not exist yet. Domain code must never hash or validate
  password strength itself.
- **`PrismaUserRepository` has only mocked-`PrismaService` unit test coverage.**
  `infrastructure/persistence/prisma-user.repository.spec.ts` asserts the right Prisma
  method and `where`/`create`/`update` shape are called, with a mocked `PrismaService`,
  matching the precedent set by `ingestion`'s repository specs. It still needs a real
  Postgres instance (Testcontainers, per CLAUDE.md §4.G) to catch anything a mock can't
  — e.g. actual unique-constraint behavior on `email` — once Testcontainers is wired up
  in this repo.

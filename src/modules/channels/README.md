# channels

## Purpose

The `channels` module owns `ChannelConnection` — the OAuth-derived link between a
`SocialAccount` (owned by `accounts`) and a platform, including its access/refresh
tokens, its resolved capability set, and its lifecycle (`active` / `needs_reauth` /
`revoked`). It is described in `docs/social-assistant-design-v2.md` §4 (ownership model)
and §7 (capability discovery). A `ChannelConnection` proves *current admin access*, not
ownership — it is deliberately ephemeral and soft-delete only, unlike the permanent
`SocialAccount` it points at. Token refresh and capability *discovery* (actually probing
a platform adapter) are future work for this module; see Open questions.

## Design notes

- `ChannelConnection.deactivate()` soft-deletes (`deletedAt` set, `status = 'revoked'`)
  rather than hard-deleting the row, and `reauthorize()` updates tokens in place on the
  same row rather than creating a new connection. The identity of "this connection" must
  survive a token refresh or a re-consent flow, so the entity never recreates itself —
  see the ownership model in `docs/social-assistant-design-v2.md` §4.

## Owned tables

- `channel_connections` (`ChannelConnection` in `prisma/schema.prisma`)

## Public API (`index.ts`)

- None yet — `application/use-cases/` is not built in this pass, so there is nothing to
  export. `socialAccountId` and `authorizedByUserId` are stored as plain cross-module
  scalar references (no Prisma relation) to `accounts`' `SocialAccount` and `identity`'s
  `User` respectively, per CLAUDE.md §2.2 — this module must never join against those
  tables directly.

## Published events

- TODO — none yet

## Consumed events

- TODO — none yet

## Open questions

- **Token encryption/decryption is not orchestrated here.** `domain/entities/channel-connection.entity.ts`
  stores `accessTokenEncrypted` / `refreshTokenEncrypted` as opaque ciphertext strings.
  Encrypting a freshly-obtained token and decrypting one before an outbound call is
  use-case-layer work via the `Encryptor` port (`src/shared/application/ports/encryptor.port.ts`),
  which is not wired up in this pass.
- **Capability discovery is not implemented.** Actually probing a platform adapter for
  its `capabilities: Set<Capability>` (design doc §7) requires `src/connectors/`, which
  does not exist yet. This module currently just stores whatever capability list it is
  given.
- **`PrismaChannelConnectionRepository` is only unit-tested against a mocked
  `PrismaService`.** It still needs an infrastructure-tier test against real Postgres via
  Testcontainers (CLAUDE.md §4.G), which is not set up in this repository yet.

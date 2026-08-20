---
description: Scaffold a new platform connector adapter (ports & adapters pattern)
argument-hint: <platform-name> [official|unofficial]
allowed-tools: Read, Write, Edit, Bash(node .claude/skills/validate-architecture/validate-architecture.js:*)
---

Scaffold a new connector for platform `$1` under `src/connectors/$1/`, with risk level
given by the second argument (default `official` if omitted).

Follow CLAUDE.md §4.D.11 and the `PlatformAdapter` port defined in
`docs/social-assistant-design-v2.md` §8:

1. Create `src/connectors/$1/$1.adapter.ts` implementing the `PlatformAdapter` interface
   from `src/connectors/platform-adapter.port.ts` (create that shared port file first if
   it does not exist yet — it belongs in `connectors/`, not inside any single module).
2. Declare `readonly risk: 'official' | 'unofficial'` truthfully. If `unofficial`, add a
   comment-free but explicit note in the adapter's README that this adapter may only be
   invoked from `worker-risky` (per CLAUDE.md §1) — do not enforce this in the adapter
   itself; routing to the risky queue is `dispatch/`'s responsibility based on this flag.
3. Declare `capabilities: Set<Capability>` based on what this platform's API actually
   supports — do not copy another adapter's capability set. Capability is discovered,
   never assumed (design doc §7).
4. Implement `verifyWebhook`, `resolveAccountIdentity`, `normalize` (returning
   `NormalizedEvent[]` — the anti-corruption boundary; nothing platform-specific may leak
   past this method), `sendMessage`, `hideComment`, and `isFollower` only if the platform
   supports it.
5. Every outbound HTTP call in this adapter must set connect/read/overall timeouts
   (CLAUDE.md §4.E.16) and classify errors for retry (§4.E.17) — timeout/connection/429/5xx
   retryable, 400/401 not.
6. Add a fixture-based test using recorded sample payloads for `normalize()` — do not call
   the real platform API in tests.
7. Register the adapter in the connectors module's provider map, keyed by platform name.
8. Run `node .claude/skills/validate-architecture/validate-architecture.js`.

If `$1` is missing, ask me for the platform name rather than guessing.

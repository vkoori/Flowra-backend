# MCP server configuration

Claude Code loads project-scoped MCP servers from **`.mcp.json` at the repo root** — not
from `.claude/plugins/`. This directory holds `mcp-servers.json` as the documented,
rationale-bearing source of truth (JSON has no comment syntax, so the `$rationale` /
`$note` keys carry the "why" that would otherwise live in a comment); `.mcp.json` is the
plain mirror of it that Claude Code actually reads. **If you change one, change the
other** — there is no build step that syncs them.

## What's configured, and why

| Server | Kind | Access | Why it's here |
|---|---|---|---|
| `postgres` | local, stdio (`crystaldba/postgres-mcp` via `uvx`) | **read-only** (`--access-mode=restricted`) | Lets an agent inspect the real schema and data shape while working on module boundaries (`CLAUDE.md` §2.2 — no cross-module SQL joins) or the `executions`/outbox tables (§0.1, §4.E) without granting write access. |
| `prisma` | remote, HTTP (`https://mcp.prisma.io/mcp`) | OAuth, per-user | Official Prisma-hosted server for schema/migration help and Prisma Studio access. No secret is stored in this repo — it authenticates interactively against Prisma Console the first time it's used on a given machine. |

**Deliberately not included:** a GitHub MCP server. `gh` is already available as a CLI
via the Bash tool for issues/PRs/checks — adding an MCP server for the same surface
would be redundant and would just add another credential to manage.

## Setup

1. Install `uv`/`uvx` locally (`pipx install uv` or see the
   [postgres-mcp README](https://github.com/crystaldba/postgres-mcp)) if you want the
   Postgres server available — otherwise Claude Code will just fail to start that one
   server and continue without it.
2. Export `DATABASE_URI` (note: `URI`, not `URL` — this is the env var name
   `postgres-mcp` itself expects, kept intentionally distinct from the `DATABASE_URL`
   used by Prisma/the app so the two are never accidentally conflated) in the shell you
   launch Claude Code from, pointing at your **local dev** database. Never point this at
   a production connection string — the MCP server config in this repo has no way to
   enforce that, so it is a human responsibility.
3. The `prisma` server will prompt an interactive login the first time it's invoked.
   This means it will not work in unattended/headless/cron runs until that's done once.

## Escalating Postgres access

If a task genuinely needs write access (e.g. seeding test data), don't edit
`--access-mode` in these committed files — that would silently change everyone's
default. Instead, override it locally: add a `postgres` entry with
`--access-mode=unrestricted` to your own MCP config at the user level (`~/.claude.json`
or equivalent, outside this repo), or ask the user to run the write themselves. The
project default stays read-only.

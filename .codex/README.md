# Codex CLI workspace for Flowra Backend

This repository is worked in via both Claude Code and OpenAI's Codex CLI. The two tools
have genuinely different governance mechanisms — this file maps one to the other so a
change made for one toolchain doesn't quietly go missing for the other.

| Concern | Claude Code | Codex CLI | Notes |
|---|---|---|---|
| Master rulebook | `CLAUDE.md` | `AGENTS.md` | Same architectural substance. Keep in agreement — see each file's closing section for the cross-reference. |
| Reusable checks/generators | `.claude/skills/` | `.agents/skills/` | **Byte-identical scripts**, mirrored (not symlinked, for git portability). Codex discovers skills by walking from cwd up to the repo root; Claude Code loads from `.claude/skills/` specifically. Edit one copy, then `cp` it over the other in the same turn — don't hand-edit both independently. |
| Custom slash commands | `.claude/commands/` | *(no direct equivalent)* | Codex's old custom-prompts feature (`~/.codex/prompts/`) is deprecated in favor of skills, and skills are already covered above. There's nothing to port here. |
| Subagents | `.claude/agents/*.md` | `.codex/agents/*.toml` | Same three roles (`nestjs-clean-architect`, `architecture-guardian`, `reliability-outbox-specialist`), same responsibilities, different schema. `architecture-guardian`'s read-only guarantee is actually *stronger* on the Codex side — `sandbox_mode = "read-only"` is enforced by the OS-level sandbox, not just by omitting a tool from an allow-list. |
| Command permissions | `.claude/settings.json` `permissions.allow/ask/deny` | `.codex/rules/*.rules` (Starlark `prefix_rule()`) | Same destructive/risky command set is blocked or gated; Codex's rules engine only expresses literal-token prefix matches, so it does not attempt to allow-list every benign command the way `settings.json` does — see the comment at the top of `bash-permissions.rules`. |
| MCP servers | `.mcp.json` (+ `.claude/plugins/mcp-servers.json` as the documented source) | `.codex/config.toml` `[mcp_servers.*]` | Same two servers (`postgres` read-only, `prisma` official hosted), same rationale. Keep both in sync if you add a third. |
| Personal/local overrides | `.claude/settings.local.json` (gitignored) | `~/.codex/config.toml` (outside the repo entirely) | Codex **ignores** `approval_policy`, `sandbox_mode`, `model_provider`, `notify`, and a few other security-sensitive keys when they appear in the project-local `.codex/config.toml` — by design, so a repository can never grant itself broader permissions just by shipping a config file. Set those personally: |

```toml
# ~/.codex/config.toml — personal, outside this repo, not gitignored because it's
# simply not part of it.
approval_policy = "on-request"
sandbox_mode = "workspace-write"
```

## Project trust

Everything under `.codex/` in this repo — `config.toml`'s project-scoped keys,
`rules/`, and `agents/` — only takes effect once you mark this repository **trusted**
in Codex. This is intentional on OpenAI's part: it's the same mechanism that keeps
`approval_policy`/`sandbox_mode` out of project-local config, applied to the rest of the
`.codex/` layer too. If Codex doesn't seem to be honoring a rule or subagent from this
repo, check trust status before assuming the config is wrong.

## Why duplicate instead of symlink

Both the skills and the two rulebooks (`CLAUDE.md`/`AGENTS.md`) are duplicated as plain
files rather than symlinked. Symlinks complicate `git clone` on some platforms and tools,
and — more importantly — Codex and Claude Code each need their tool-specific sections
(§6 in each rulebook, the differing skill-discovery paths) to actually differ in a few
places, so a single shared file wouldn't be quite right for the parts that reference
each tool's own mechanisms. The trade-off is an explicit maintenance rule instead of an
implicit one: **when you change one side's copy of something in this table, change the
other side's copy in the same turn.** Don't defer it to "later" — that's how the two
toolchains drift and someone ends up debugging why an agent behaves differently in
Codex than it does in Claude Code.

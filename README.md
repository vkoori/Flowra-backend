# Flowra Backend

Social media automation platform — NestJS + Fastify, PostgreSQL, BullMQ, built as a
Feature-Based Modular Monolith under strict Clean Architecture.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — the engineering constitution: module boundaries, layering
  rules, naming conventions. Binding for any agent or human working in this repo.
- [`AGENTS.md`](AGENTS.md) — the same rules, adapted for Codex CLI.
- [`docs/social-assistant-design-v2.md`](docs/social-assistant-design-v2.md) — the product
  and domain design: ownership model, execution state machine, flow engine, journeys.
- [`docs/backend-infrastructure-notes.md`](docs/backend-infrastructure-notes.md) —
  infrastructure/architectural rationale that doesn't belong as inline code comments.

## Getting started

```bash
npm install
docker compose up -d
npx prisma migrate dev
npm run start:dev
```

`npm run check` runs the full verification suite (format, lint, architecture validator,
i18n validator, leak checks, build, tests) — the same checks enforced by the pre-commit hook.

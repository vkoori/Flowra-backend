---
name: validate-i18n
description: Check for hardcoded Persian/Arabic text in source and verify every i18n key used in code is actually registered in the nestjs-i18n resource files (and vice versa). Use after adding or editing any user-facing string, or any file under src/i18n/.
---

# validate-i18n

> Mirrored verbatim at `.claude/skills/validate-i18n/` for Claude Code discovery. The two
> copies must stay byte-identical — edit one, then copy it over the other in the same
> turn.

Runs `validate-i18n.js`, a TypeScript-AST-based checker (same technique as
`validate-architecture`, same `typescript` devDependency requirement) over the
project's nestjs-i18n setup: `src/i18n/<lang>/<namespace>.json`, keys referenced as
`namespace.key` via `i18n.t(...)` / `i18n.translate(...)`.

## Hard rules

- **No hardcoded Persian/Arabic text.** Any string literal containing a character in
  the Arabic Unicode blocks (which Persian also uses) is flagged, unless the file is a
  `.spec.ts`/`.e2e-spec.ts` test, lives under a `text-normalisation/` module (legitimate
  sample/reference text for the normalizer), or is itself under `src/i18n/`.
- **Every referenced key must be registered.** A call site's key (e.g.
  `i18n.t('common.hello')`) must exist somewhere in `src/i18n/en/` (the fallback
  language) — checked by flattening each namespace JSON file into dotted paths and
  matching against every `.t()`/`.translate()` call site found in `src/`.

## Heuristics (reported, don't fail unless `--strict`)

- **Locale gap** — a key exists in the fallback language (`en`) but is missing from
  another locale's resource file; it will silently fall back rather than error, which
  is a product bug (wrong-language text shown), not a crash — worth a human look, not
  an automatic build failure.
- **Unused key** — a key is registered but no call site references it, statically or
  dynamically. A call like `` i18n.t(`errors.${code}`) `` (used by the shared
  `AppExceptionFilter` to translate any `AppError`'s `code`) is recognized as a dynamic
  reference to the whole `errors.` namespace, so keys under it aren't flagged just
  because the runtime value can't be traced statically — only genuinely untouched
  namespaces get flagged.

## How to invoke

```bash
node .agents/skills/validate-i18n/validate-i18n.js
node .agents/skills/validate-i18n/validate-i18n.js --json
node .agents/skills/validate-i18n/validate-i18n.js --strict   # also fail on heuristics
node .agents/skills/validate-i18n/validate-i18n.js --quiet    # used by pre-commit
```

If `src/` doesn't exist yet, it prints a notice and exits `0`. If `src/i18n/` doesn't
exist, key-registration checks are skipped entirely (nothing to check against) but the
hardcoded-script check still runs.

## Adding a new locale

Add `src/i18n/<lang>/` with the same namespace filenames as `src/i18n/en/`. This skill
will immediately start reporting locale-gap heuristics for any key missing there — that
gap list is your translation to-do list for the new locale.

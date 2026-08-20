#!/usr/bin/env bash
set -uo pipefail

QUIET=false
STRICT=false
for arg in "$@"; do
  case "$arg" in
    --quiet) QUIET=true ;;
    --strict) STRICT=true ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"

SRC_DIR="src"
HITS=0

log() {
  if ! $QUIET; then echo "$@"; fi
}

if [ ! -d "$SRC_DIR" ]; then
  log "lint-leaks: src/ does not exist yet — nothing to check."
  exit 0
fi

log "lint-leaks: scanning $SRC_DIR ..."

# 1. Real ESLint, if configured and resolvable.
if [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ] || [ -f "eslint.config.cjs" ] || \
   [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f ".eslintrc" ]; then
  if command -v npx >/dev/null 2>&1; then
    log ""
    log "--- ESLint ---"
    if npx --no-install eslint "$SRC_DIR" --quiet > /tmp/lint-leaks-eslint.log 2>&1; then
      log "eslint: no errors."
    else
      cat /tmp/lint-leaks-eslint.log
      HITS=$((HITS + 1))
    fi
    rm -f /tmp/lint-leaks-eslint.log
  fi
else
  log "(no eslint config found — skipping real ESLint pass, running heuristics only)"
fi

# 2. Scope.REQUEST — CLAUDE.md/AGENTS.md §4.H.25 bans this outright.
log ""
log "--- Scope.REQUEST usage (banned, CLAUDE.md/AGENTS.md §4.H.25) ---"
SCOPE_HITS="$(grep -rn "Scope\.REQUEST" "$SRC_DIR" --include="*.ts" 2>/dev/null || true)"
if [ -n "$SCOPE_HITS" ]; then
  echo "$SCOPE_HITS"
  HITS=$((HITS + 1))
else
  log "none found."
fi

# 3. .then( with no nearby .catch( — a common shape of a floating promise.
log ""
log "--- .then( without a nearby .catch( (possible unhandled rejection) ---"
: > /tmp/lint-leaks-then.log
while IFS= read -r -d '' file; do
  awk '
    /\.then\(/ {
      thenLine = NR
      window = $0
      for (i = 1; i <= 2 && (getline nextline) > 0; i++) { window = window "\n" nextline }
      if (window !~ /\.catch\(/) {
        print FILENAME ":" thenLine
      }
    }
  ' "$file" >> /tmp/lint-leaks-then.log
done < <(find "$SRC_DIR" -name "*.ts" -not -name "*.spec.ts" -not -name "*.test.ts" -print0 2>/dev/null)
if [ -s /tmp/lint-leaks-then.log ]; then
  cat /tmp/lint-leaks-then.log
  HITS=$((HITS + 1))
else
  log "none found."
fi
rm -f /tmp/lint-leaks-then.log

# 4. Bare, non-awaited call to a function whose name suggests it's async.
log ""
log "--- bare non-awaited call to a likely-async function (heuristic — verify manually) ---"
BARE_HITS="$(grep -rnE '^\s*(handle|process|dispatch|send|publish|execute)[A-Za-z0-9_]*\([^)]*\)\s*;\s*$' "$SRC_DIR" --include="*.ts" 2>/dev/null | grep -vE 'await|void |return ' || true)"
if [ -n "$BARE_HITS" ]; then
  echo "$BARE_HITS"
  HITS=$((HITS + 1))
else
  log "none found."
fi

log ""
if [ "$HITS" -eq 0 ]; then
  log "lint-leaks: clean."
else
  log "lint-leaks: $HITS check group(s) reported findings — review above."
fi

if $STRICT && [ "$HITS" -gt 0 ]; then
  exit 1
fi
exit 0

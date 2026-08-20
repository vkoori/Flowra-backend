#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <module-name-kebab-case>" >&2
  echo "Example: $0 account-tenures" >&2
  exit 1
}

MODULE_NAME="${1:-}"
[ -z "$MODULE_NAME" ] && usage

if ! [[ "$MODULE_NAME" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
  echo "error: module name must be kebab-case (e.g. account-tenures), got: '$MODULE_NAME'" >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MODULE_ROOT="$REPO_ROOT/src/modules/$MODULE_NAME"

if [ -e "$MODULE_ROOT" ]; then
  echo "error: $MODULE_ROOT already exists — this script does not overwrite existing modules." >&2
  echo "Create the missing piece by hand instead." >&2
  exit 1
fi

pascal_case() {
  echo "$1" | awk -F'-' '{ for (i = 1; i <= NF; i++) { $i = toupper(substr($i,1,1)) substr($i,2) } print }' OFS=''
}
CLASS_PREFIX="$(pascal_case "$MODULE_NAME")"

DIRS=(
  "domain/entities"
  "domain/value-objects"
  "domain/errors"
  "domain/repositories"
  "application/use-cases"
  "application/dto"
  "application/ports"
  "application/events"
  "infrastructure/controllers"
  "infrastructure/persistence"
  "infrastructure/mappers"
  "infrastructure/adapters"
)

for d in "${DIRS[@]}"; do
  mkdir -p "$MODULE_ROOT/$d"
  touch "$MODULE_ROOT/$d/.gitkeep"
done

cat > "$MODULE_ROOT/$MODULE_NAME.module.ts" <<EOF
import { Module } from '@nestjs/common';

@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class ${CLASS_PREFIX}Module {}
EOF

cat > "$MODULE_ROOT/index.ts" <<EOF
// Public API barrel for the "$MODULE_NAME" module.
// Only export what other modules are meant to depend on (CLAUDE.md/AGENTS.md §2.1) —
// application-layer service interfaces and their DTOs, never domain internals,
// repositories, or Prisma models.
export {};
EOF

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE="$SCRIPT_DIR/README.template.md"
sed "s/__MODULE_NAME__/$MODULE_NAME/g" "$TEMPLATE" > "$MODULE_ROOT/README.md"

echo "Scaffolded src/modules/$MODULE_NAME:"
find "$MODULE_ROOT" -type f | sed "s|$REPO_ROOT/||" | sort

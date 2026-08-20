#!/usr/bin/env node
'use strict';

/**
 * validate-architecture.js
 *
 * Dependency-free static check of import boundaries for the Flowra backend's
 * Feature-Based Modular Monolith with Clean Architecture (see CLAUDE.md/AGENTS.md §2, §3).
 *
 * No external dependencies on purpose: this must run before `npm install` has ever
 * happened (e.g. immediately after `/scaffold-module`), and it must run fast enough to
 * sit in a PostToolUse hook on every Edit/Write.
 */

const fs = require('fs');
const path = require('path');

const CWD = process.cwd();
const MODULES_ROOT = path.join(CWD, 'src', 'modules');

// Specifiers that domain/ (and, for the '@prisma/client'/'fastify'/'axios' subset,
// application/) must never import. Matched as a prefix against the import specifier.
const DOMAIN_BANNED_PREFIXES = [
  '@nestjs',
  '@prisma/client',
  'fastify',
  'axios',
  'bullmq',
  'ioredis',
];

const APPLICATION_BANNED_PREFIXES = ['@prisma/client', 'fastify', 'axios'];

// One-off, explicitly-approved exceptions. Do not add to this without the user's
// explicit sign-off — see SKILL.md's note on false positives. Format: exact relative
// path from repo root.
const ALLOWED_EXCEPTIONS = new Set([
  // 'src/modules/example/domain/entities/example.entity.ts',
]);

const IMPORT_RE = /(?:^|\n)\s*import\s+(?:type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function layerOf(relPath) {
  // relPath like: modules/<mod>/domain/... or modules/<mod>/application/... etc.
  const parts = relPath.split(path.sep);
  const idx = parts.indexOf('modules');
  if (idx === -1 || !parts[idx + 2]) return { module: null, layer: null };
  const moduleName = parts[idx + 1];
  const layer = parts[idx + 2];
  if (['domain', 'application', 'infrastructure'].includes(layer)) {
    return { module: moduleName, layer };
  }
  return { module: moduleName, layer: 'root' };
}

function findImportsWithLines(content) {
  const results = [];
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    const singleLineRe = /(?:from\s+['"]([^'"]+)['"])|(?:require\(\s*['"]([^'"]+)['"]\s*\))|(?:import\(\s*['"]([^'"]+)['"]\s*\))/g;
    let m;
    while ((m = singleLineRe.exec(line)) !== null) {
      const spec = m[1] || m[2] || m[3];
      if (spec) results.push({ spec, line: i + 1 });
    }
  });
  return results;
}

function resolveRelative(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  // Doesn't exist on disk yet (common mid-edit) — return the un-extended guess so
  // module-isolation checks still work on the path shape.
  return candidates[1];
}

function checkFile(file, violations) {
  const relPath = path.relative(CWD, file);
  const relForExceptions = relPath.split(path.sep).join('/');
  if (ALLOWED_EXCEPTIONS.has(relForExceptions)) return;

  const { module: ownModule, layer } = layerOf(relPath);
  if (!ownModule) return;

  const content = fs.readFileSync(file, 'utf8');
  const imports = findImportsWithLines(content);

  for (const { spec, line } of imports) {
    // Rule: domain/application purity against framework/ORM/HTTP client specifiers.
    if (layer === 'domain') {
      for (const banned of DOMAIN_BANNED_PREFIXES) {
        if (spec === banned || spec.startsWith(banned + '/')) {
          violations.push({
            file: relPath,
            line,
            rule: 'domain-purity',
            message: `domain/ must not import "${spec}" (CLAUDE.md/AGENTS.md §3, §4.A.1) — domain must be testable in plain Node with no framework running.`,
          });
        }
      }
    }
    if (layer === 'application') {
      for (const banned of APPLICATION_BANNED_PREFIXES) {
        if (spec === banned || spec.startsWith(banned + '/')) {
          violations.push({
            file: relPath,
            line,
            rule: 'application-purity',
            message: `application/ must not import "${spec}" directly (CLAUDE.md/AGENTS.md §4.D.11) — go through a port/gateway interface implemented in infrastructure/.`,
          });
        }
      }
    }

    // Rule: domain/application must not reach into this module's own infrastructure/.
    if ((layer === 'domain' || layer === 'application') && spec.startsWith('.')) {
      const resolved = resolveRelative(file, spec);
      const resolvedRel = path.relative(CWD, resolved).split(path.sep).join('/');
      if (resolvedRel.includes(`/${ownModule}/infrastructure/`) || resolvedRel.startsWith(`src/modules/${ownModule}/infrastructure/`)) {
        violations.push({
          file: relPath,
          line,
          rule: 'dependency-direction',
          message: `${layer}/ must not import from this module's infrastructure/ (CLAUDE.md/AGENTS.md §4.A.1 — dependency direction is infrastructure → application → domain, never reversed).`,
        });
      }
      if (layer === 'domain' && resolvedRel.includes(`/${ownModule}/application/`)) {
        violations.push({
          file: relPath,
          line,
          rule: 'dependency-direction',
          message: `domain/ must not import from this module's application/ (CLAUDE.md/AGENTS.md §4.A.1) — domain is the innermost layer and must have zero outward dependencies.`,
        });
      }
    }

    // Rule: strict module isolation — no reaching into another module's internals.
    if (spec.startsWith('.')) {
      const resolved = resolveRelative(file, spec);
      const resolvedRel = path.relative(CWD, resolved).split(path.sep).join('/');
      const match = resolvedRel.match(/^src\/modules\/([^/]+)\//);
      if (match && match[1] !== ownModule) {
        const otherModule = match[1];
        const isPublicBarrel =
          resolvedRel === `src/modules/${otherModule}/index.ts` ||
          resolvedRel === `src/modules/${otherModule}/index.tsx`;
        if (!isPublicBarrel) {
          violations.push({
            file: relPath,
            line,
            rule: 'module-isolation',
            message: `reaches into src/modules/${otherModule}/ internals via "${spec}" (CLAUDE.md/AGENTS.md §2.1) — cross-module access must go through src/modules/${otherModule}/index.ts or a domain event, never a deep import.`,
          });
        }
      }
    }
  }
}

function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const json = args.includes('--json');
  const moduleFlagIdx = args.indexOf('--module');
  const onlyModule = moduleFlagIdx !== -1 ? args[moduleFlagIdx + 1] : null;

  if (!fs.existsSync(MODULES_ROOT)) {
    if (!quiet && !json) {
      console.log('validate-architecture: src/modules/ does not exist yet — nothing to check.');
    }
    process.exit(0);
  }

  let files = walk(MODULES_ROOT);
  if (onlyModule) {
    files = files.filter((f) => layerOf(path.relative(CWD, f)).module === onlyModule);
  }

  const violations = [];
  for (const file of files) checkFile(file, violations);

  if (json) {
    console.log(JSON.stringify({ violationCount: violations.length, violations }, null, 2));
  } else if (violations.length === 0) {
    if (!quiet) console.log(`validate-architecture: ${files.length} files checked, 0 violations.`);
  } else {
    console.log(`validate-architecture: ${violations.length} violation(s) across ${files.length} files checked:\n`);
    for (const v of violations) {
      console.log(`  ${v.file}:${v.line}  [${v.rule}]`);
      console.log(`    ${v.message}\n`);
    }
  }

  process.exit(violations.length > 0 ? 1 : 0);
}

main();

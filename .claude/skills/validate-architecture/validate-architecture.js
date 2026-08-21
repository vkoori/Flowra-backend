#!/usr/bin/env node
'use strict';

/**
 * validate-architecture.js
 *
 * AST-based static check of the Flowra backend's Feature-Based Modular Monolith with
 * Clean Architecture (see CLAUDE.md/AGENTS.md §2, §3, §4). Uses the TypeScript compiler
 * API (already a project devDependency) for accurate import/decorator/type extraction —
 * this intentionally supersedes the old regex-only version now that the project has a
 * real node_modules; if you're running this before `npm install` has ever happened
 * (e.g. a brand new scaffold), it will fail fast with an actionable message rather than
 * silently degrading to weaker checks.
 *
 * Layers: domain → application → {presentation, infrastructure}, where presentation
 * (controllers, and — once a module has them — BullMQ queue processors and
 * scheduler/cron triggers, i.e. any interface adapter, not just HTTP) and
 * infrastructure (persistence, mappers, adapters) are Clean Architecture's two outer
 * layers: both depend inward, neither depends on the other.
 *
 * Hard rules (violations, exit 1): domain/application purity, dependency direction,
 * module isolation (relative AND tsconfig-alias imports), missing index.ts, disallowed
 * domain/presentation subfolders, misplaced use-cases/repositories, controller
 * layering leaks, Prisma boundary, Scope.REQUEST, naming conventions, circular
 * imports, barrel leaks.
 *
 * Heuristics (reported, don't fail the build unless --strict): controller business
 * logic, anemic-entity public properties, stray `any` outside DTO boundaries.
 */

const fs = require('fs');
const path = require('path');

let ts;
try {
  ts = require('typescript');
} catch {
  console.error(
    'validate-architecture: the "typescript" package is required for AST analysis but is not installed.\n' +
      'Run `npm install` first (this check no longer runs before the project has its dependencies).',
  );
  process.exit(1);
}

const CWD = process.cwd();
const SRC_ROOT = path.join(CWD, 'src');
const MODULES_ROOT = path.join(SRC_ROOT, 'modules');

const DOMAIN_BANNED_PREFIXES = ['@nestjs', '@prisma/client', 'fastify', 'axios', 'bullmq', 'ioredis'];
const APPLICATION_BANNED_PREFIXES = ['@prisma/client', 'fastify', 'axios'];

// Files allowed to import the Prisma client / generated client directly. Everything
// else must go through a prisma-*.repository.ts in infrastructure/persistence/.
const PRISMA_ALLOWED_FILES = new Set([
  'src/shared/infrastructure/prisma/prisma.service.ts',
  'src/shared/infrastructure/prisma/prisma-unique-violation.ts',
  'src/shared/infrastructure/prisma/prisma-unique-violation.spec.ts',
]);

// One-off, explicitly-approved exceptions to any rule below. Do not add without the
// user's explicit sign-off — format: `${relativePath}::${ruleName}`.
const ALLOWED_EXCEPTIONS = new Set([
  // 'src/modules/example/domain/entities/example.entity.ts::domain-purity',
]);

const NAMING_RULES = [
  { dirSuffix: '/domain/entities', mustEndWith: ['.entity.ts'] },
  { dirSuffix: '/domain/value-objects', mustEndWith: ['.vo.ts'] },
  { dirSuffix: '/domain/repositories', mustEndWith: ['.repository.ts'] },
  { dirSuffix: '/application/use-cases', mustEndWith: ['.use-case.ts'] },
  { dirSuffix: '/application/ports', mustEndWith: ['.gateway.ts', '.repository.ts'] },
  { dirSuffix: '/presentation/http/controllers', mustEndWith: ['.controller.ts'] },
  { dirSuffix: '/presentation/http/dto', mustEndWith: ['.dto.ts'] },
  { dirSuffix: '/presentation/http/mappers', mustEndWith: ['.mapper.ts'] },
  { dirSuffix: '/presentation/queue/consumers', mustEndWith: ['.consumer.ts'] },
  { dirSuffix: '/presentation/queue/dto', mustEndWith: ['.dto.ts'] },
  { dirSuffix: '/presentation/queue/mappers', mustEndWith: ['.mapper.ts'] },
  { dirSuffix: '/presentation/scheduler', mustEndWith: ['.job.ts'] },
  { dirSuffix: '/infrastructure/mappers', mustEndWith: ['.mapper.ts'] },
];

const DOMAIN_ALLOWED_SUBFOLDERS = new Set(['entities', 'value-objects', 'errors', 'repositories']);

// presentation/ is one folder per interface adapter this module actually has — "http"
// exists from day one (scaffold-clean-module generates it); "queue" (BullMQ consumers)
// and "scheduler" (cron jobs) are added by hand only once a module has one. http/queue
// require a further "kind" subfolder; scheduler is flat (*.job.ts directly inside it) —
// see CLAUDE.md/AGENTS.md §3.
const PRESENTATION_TRANSPORTS = {
  http: { kinds: new Set(['controllers', 'dto', 'mappers']) },
  queue: { kinds: new Set(['consumers', 'dto', 'mappers']) },
  scheduler: { kinds: null }, // flat — no kind subfolder required
};

// Any file that receives an external trigger and translates it into a use-case call —
// not just HTTP controllers. Held to the same "route through application/use-cases/,
// never touch domain/infrastructure directly" rule.
const ENTRY_POINT_HANDLER_PATTERN =
  /\/presentation\/(http\/controllers|queue\/consumers|scheduler)\//;

// Clean Architecture's two outer layers (presentation, infrastructure) both depend
// inward on application/domain and never on each other. Domain is innermost and must
// have zero outward dependencies, including on presentation.
const FORBIDDEN_OWN_MODULE_TARGETS = {
  domain: ['application', 'presentation', 'infrastructure'],
  application: ['presentation', 'infrastructure'],
  presentation: ['infrastructure'],
};

// ---------------------------------------------------------------------------
// tsconfig path-alias resolution
// ---------------------------------------------------------------------------

function loadAliasConfig() {
  const tsconfigPath = path.join(CWD, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) return { baseUrl: CWD, paths: {} };
  const raw = fs.readFileSync(tsconfigPath, 'utf8');
  const parsed = ts.parseConfigFileTextToJson(tsconfigPath, raw);
  const co = (parsed.config && parsed.config.compilerOptions) || {};
  const baseUrl = path.resolve(CWD, co.baseUrl || '.');
  return { baseUrl, paths: co.paths || {} };
}

function resolveAliasSpecifier(spec, aliasConfig) {
  for (const [aliasPattern, targets] of Object.entries(aliasConfig.paths)) {
    if (!Array.isArray(targets) || targets.length === 0) continue;
    const prefix = aliasPattern.replace(/\*$/, '');
    if (aliasPattern.endsWith('*') ? spec.startsWith(prefix) : spec === aliasPattern) {
      const suffix = aliasPattern.endsWith('*') ? spec.slice(prefix.length) : '';
      const target = targets[0].replace(/\*$/, '');
      return path.join(aliasConfig.baseUrl, target, suffix);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Filesystem walking
// ---------------------------------------------------------------------------

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

function toRel(file) {
  return path.relative(CWD, file).split(path.sep).join('/');
}

function layerOf(relPath) {
  const parts = relPath.split('/');
  const idx = parts.indexOf('modules');
  if (idx === -1 || !parts[idx + 1]) return { module: null, layer: null };
  const moduleName = parts[idx + 1];
  const layer = parts[idx + 2];
  if (['domain', 'application', 'presentation', 'infrastructure'].includes(layer)) {
    return { module: moduleName, layer, subfolder: parts[idx + 3], kind: parts[idx + 4] };
  }
  return { module: moduleName, layer: 'root' };
}

function resolveWithExtensions(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[1];
}

// ---------------------------------------------------------------------------
// AST fact extraction (single pass per file)
// ---------------------------------------------------------------------------

function extractFacts(file, content) {
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const lineOf = (node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

  const facts = {
    imports: [], // { spec, line, kind }
    scopeRequestUses: [], // { line }
    anyTypeUses: [], // { line }
    classes: [], // { name, line, decoratorNames, members: [{name, line, isPublicMutable}] }
    controlFlowCount: 0,
  };

  function addClassFacts(node) {
    const decoratorNames = [];
    if (ts.canHaveDecorators(node)) {
      for (const dec of ts.getDecorators(node) || []) {
        const expr = dec.expression;
        const callee = ts.isCallExpression(expr) ? expr.expression : expr;
        if (ts.isIdentifier(callee)) decoratorNames.push(callee.text);
      }
    }
    const members = [];
    for (const member of node.members) {
      if (ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name)) {
        const modifiers = ts.canHaveModifiers(member) ? ts.getModifiers(member) || [] : [];
        const modifierKinds = modifiers.map((m) => m.kind);
        const isPrivateOrProtected =
          modifierKinds.includes(ts.SyntaxKind.PrivateKeyword) ||
          modifierKinds.includes(ts.SyntaxKind.ProtectedKeyword);
        const isReadonly = modifierKinds.includes(ts.SyntaxKind.ReadonlyKeyword);
        members.push({
          name: member.name.text,
          line: lineOf(member),
          isPublicMutable: !isPrivateOrProtected && !isReadonly,
        });
      }
    }
    facts.classes.push({
      name: node.name ? node.name.text : '(anonymous)',
      line: lineOf(node),
      decoratorNames,
      members,
    });
  }

  function visit(node) {
    if (ts.isImportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      facts.imports.push({ spec: node.moduleSpecifier.text, line: lineOf(node), kind: 'import' });
    } else if (
      ts.isExportDeclaration(node) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      facts.imports.push({ spec: node.moduleSpecifier.text, line: lineOf(node), kind: 're-export' });
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require';
      if ((isDynamicImport || isRequire) && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
        facts.imports.push({
          spec: node.arguments[0].text,
          line: lineOf(node),
          kind: isDynamicImport ? 'dynamic-import' : 'require',
        });
      }
    } else if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'Scope' &&
      node.name.text === 'REQUEST'
    ) {
      facts.scopeRequestUses.push({ line: lineOf(node) });
    } else if (node.kind === ts.SyntaxKind.AnyKeyword) {
      facts.anyTypeUses.push({ line: lineOf(node) });
    } else if (
      ts.isIfStatement(node) ||
      ts.isSwitchStatement(node) ||
      ts.isForStatement(node) ||
      ts.isForInStatement(node) ||
      ts.isForOfStatement(node) ||
      ts.isWhileStatement(node) ||
      ts.isDoStatement(node) ||
      ts.isConditionalExpression(node)
    ) {
      facts.controlFlowCount += 1;
    } else if (ts.isClassDeclaration(node) && node.name) {
      addClassFacts(node);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return facts;
}

// ---------------------------------------------------------------------------
// Violation collection
// ---------------------------------------------------------------------------

function isExcepted(relPath, rule) {
  return ALLOWED_EXCEPTIONS.has(`${relPath}::${rule}`);
}

function pushViolation(violations, relPath, rule, line, message) {
  if (isExcepted(relPath, rule)) return;
  violations.push({ file: relPath, line, rule, message, severity: 'error' });
}

function pushHeuristic(heuristics, relPath, rule, line, message) {
  if (isExcepted(relPath, rule)) return;
  heuristics.push({ file: relPath, line, rule, message, severity: 'heuristic' });
}

function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const json = args.includes('--json');
  const strict = args.includes('--strict');
  const moduleFlagIdx = args.indexOf('--module');
  const onlyModule = moduleFlagIdx !== -1 ? args[moduleFlagIdx + 1] : null;

  if (!fs.existsSync(SRC_ROOT)) {
    if (!quiet && !json) console.log('validate-architecture: src/ does not exist yet — nothing to check.');
    process.exit(0);
  }

  const aliasConfig = loadAliasConfig();
  const allFiles = walk(SRC_ROOT);
  const fileFacts = new Map(); // relPath -> facts
  for (const file of allFiles) {
    const relPath = toRel(file);
    fileFacts.set(relPath, { absPath: file, ...extractFacts(file, fs.readFileSync(file, 'utf8')) });
  }

  const violations = [];
  const heuristics = [];

  function resolveSpecifier(fromRelPath, spec) {
    const fromFile = fileFacts.get(fromRelPath).absPath;
    if (spec.startsWith('.')) {
      return { resolved: resolveWithExtensions(path.resolve(path.dirname(fromFile), spec)), viaAlias: false };
    }
    const aliasTarget = resolveAliasSpecifier(spec, aliasConfig);
    if (aliasTarget) return { resolved: resolveWithExtensions(aliasTarget), viaAlias: true };
    return null; // bare npm specifier, not a local file
  }

  // ---- Per-file checks -----------------------------------------------------
  for (const [relPath, facts] of fileFacts) {
    if (onlyModule && layerOf(relPath).module !== onlyModule) continue;

    const { module: ownModule, layer } = layerOf(relPath);
    const isModuleFile = relPath.startsWith('src/modules/');

    // Scope.REQUEST — repo-wide.
    for (const use of facts.scopeRequestUses) {
      pushViolation(
        violations,
        relPath,
        'scope-request',
        use.line,
        'Scope.REQUEST is banned (CLAUDE.md/AGENTS.md §4.H.25) — pass values explicitly instead of request-scoped DI.',
      );
    }

    // `any` outside DTO boundaries — heuristic, repo-wide.
    const isDtoFile = relPath.includes('/presentation/') && relPath.includes('/dto/');
    const isSpecFile = relPath.endsWith('.spec.ts') || relPath.endsWith('.e2e-spec.ts');
    if (!isDtoFile && !isSpecFile) {
      for (const use of facts.anyTypeUses) {
        pushHeuristic(
          heuristics,
          relPath,
          'any-type-usage',
          use.line,
          '`any` used outside a DTO/deserialization boundary (CLAUDE.md/AGENTS.md §0) — prefer `unknown` + Zod.',
        );
      }
    }

    // Prisma boundary — repo-wide except the one sanctioned service, persistence/, and
    // mappers/ (CLAUDE.md/AGENTS.md §3 assigns "DB row <-> domain entity" mapping to
    // infrastructure/mappers/, which necessarily types its input as the Prisma row).
    const inPersistence = relPath.includes('/infrastructure/persistence/');
    const inMappers = relPath.includes('/infrastructure/mappers/');
    const isAllowedPrismaFile = PRISMA_ALLOWED_FILES.has(relPath);
    if (!inPersistence && !inMappers && !isAllowedPrismaFile) {
      for (const imp of facts.imports) {
        const touchesPrisma =
          imp.spec === '@prisma/client' ||
          imp.spec.startsWith('@prisma/client/') ||
          /generated\/prisma/.test(imp.spec);
        if (touchesPrisma) {
          pushViolation(
            violations,
            relPath,
            'prisma-boundary',
            imp.line,
            `imports Prisma ("${imp.spec}") outside infrastructure/persistence/ — implement a prisma-*.repository.ts there instead (CLAUDE.md/AGENTS.md §4.D.10).`,
          );
        }
      }
    }

    // Anemic-entity heuristic — public mutable properties on domain entities.
    if (relPath.includes('/domain/entities/')) {
      for (const cls of facts.classes) {
        for (const member of cls.members) {
          if (member.isPublicMutable) {
            pushHeuristic(
              heuristics,
              relPath,
              'anemic-entity',
              member.line,
              `${cls.name}.${member.name} is a public, mutable property — consider a named method with an invariant check instead (CLAUDE.md/AGENTS.md §4.B.5).`,
            );
          }
        }
      }
    }

    // Entry-point-handler business-logic heuristic (controller, consumer, or job).
    if (ENTRY_POINT_HANDLER_PATTERN.test(relPath) && facts.controlFlowCount > 1) {
      pushHeuristic(
        heuristics,
        relPath,
        'controller-business-logic',
        1,
        `${facts.controlFlowCount} branching statements found — presentation handlers are transport only (CLAUDE.md/AGENTS.md §4.C.8); business branching belongs in a use case.`,
      );
    }

    if (!isModuleFile) continue; // everything below is module-structure specific

    // Domain/application purity.
    if (layer === 'domain') {
      for (const imp of facts.imports) {
        for (const banned of DOMAIN_BANNED_PREFIXES) {
          if (imp.spec === banned || imp.spec.startsWith(banned + '/')) {
            pushViolation(
              violations,
              relPath,
              'domain-purity',
              imp.line,
              `domain/ must not import "${imp.spec}" (CLAUDE.md/AGENTS.md §3, §4.A.1) — domain must be testable in plain Node with no framework running.`,
            );
          }
        }
      }
    }
    if (layer === 'application') {
      for (const imp of facts.imports) {
        for (const banned of APPLICATION_BANNED_PREFIXES) {
          if (imp.spec === banned || imp.spec.startsWith(banned + '/')) {
            pushViolation(
              violations,
              relPath,
              'application-purity',
              imp.line,
              `application/ must not import "${imp.spec}" directly (CLAUDE.md/AGENTS.md §4.D.11) — go through a port/gateway interface implemented in infrastructure/.`,
            );
          }
        }
      }
    }

    // Dependency direction + module isolation + controller layering + barrel leaks —
    // all keyed on resolving each import to a real local file (relative or alias).
    const isBarrel = relPath === `src/modules/${ownModule}/index.ts`;
    const isEntryPointHandler = ENTRY_POINT_HANDLER_PATTERN.test(relPath);

    for (const imp of facts.imports) {
      const resolution = resolveSpecifier(relPath, imp.spec);
      if (!resolution) continue; // bare npm package, not a local-file concern
      const resolvedRel = toRel(resolution.resolved);
      const aliasNote = resolution.viaAlias ? ' (via tsconfig path alias)' : '';

      const forbiddenTargets = FORBIDDEN_OWN_MODULE_TARGETS[layer];
      if (forbiddenTargets) {
        for (const targetLayer of forbiddenTargets) {
          if (resolvedRel.includes(`/modules/${ownModule}/${targetLayer}/`)) {
            pushViolation(
              violations,
              relPath,
              'dependency-direction',
              imp.line,
              `${layer}/ must not import from this module's ${targetLayer}/${aliasNote} (CLAUDE.md/AGENTS.md §4.A.1 — presentation/infrastructure depend inward on application/domain, never the reverse, and never on each other).`,
            );
          }
        }
      }

      const otherModuleMatch = resolvedRel.match(/^src\/modules\/([^/]+)\//);
      if (otherModuleMatch && otherModuleMatch[1] !== ownModule) {
        const otherModule = otherModuleMatch[1];
        const isPublicBarrel = resolvedRel === `src/modules/${otherModule}/index.ts`;
        if (!isPublicBarrel) {
          pushViolation(
            violations,
            relPath,
            'module-isolation',
            imp.line,
            `reaches into src/modules/${otherModule}/ internals via "${imp.spec}"${aliasNote} (CLAUDE.md/AGENTS.md §2.1) — cross-module access must go through src/modules/${otherModule}/index.ts or a domain event, never a deep import.`,
          );
        }
      }

      if (isEntryPointHandler) {
        const bypassesUseCase =
          resolvedRel.includes(`/modules/${ownModule}/domain/`) ||
          resolvedRel.includes(`/modules/${ownModule}/infrastructure/`) ||
          /generated\/prisma/.test(imp.spec) ||
          imp.spec === '@prisma/client';
        if (bypassesUseCase) {
          pushViolation(
            violations,
            relPath,
            'controller-layering',
            imp.line,
            `imports "${imp.spec}" directly — controllers/consumers/jobs are transport only (CLAUDE.md/AGENTS.md §4.C.8); route through application/use-cases/ instead.`,
          );
        }
      }

      const leakedLayer = ['domain', 'presentation', 'infrastructure'].find((l) =>
        resolvedRel.includes(`/modules/${ownModule}/${l}/`),
      );
      if (isBarrel && leakedLayer) {
        pushViolation(
          violations,
          relPath,
          'barrel-leak',
          imp.line,
          `this module's public index.ts re-exports from ${leakedLayer}/ — the barrel must only surface application-layer interfaces and plain input/output types (CLAUDE.md/AGENTS.md §2.1); other modules importing this barrel would transitively reach internals.`,
        );
      }
    }

    // Naming convention. A co-located spec file (foo.entity.spec.ts) is checked against
    // the same suffix as its subject (foo.entity.ts) — de-spec the name first.
    const despecedPath = relPath
      .replace(/\.e2e-spec\.ts$/, '.ts')
      .replace(/\.spec\.ts$/, '.ts');
    for (const rule of NAMING_RULES) {
      if (relPath.includes(rule.dirSuffix + '/')) {
        const ok = rule.mustEndWith.some((suffix) => despecedPath.endsWith(suffix));
        if (!ok) {
          pushViolation(
            violations,
            relPath,
            'naming-convention',
            1,
            `file under .../${rule.dirSuffix.replace(/^\//, '')}/ should end with ${rule.mustEndWith.join(' or ')} (CLAUDE.md/AGENTS.md §4.H.27).`,
          );
        }
      }
    }
    if (relPath.includes('/infrastructure/persistence/') && relPath.endsWith('.repository.ts')) {
      const fileName = path.basename(relPath);
      if (!fileName.startsWith('prisma-')) {
        pushViolation(
          violations,
          relPath,
          'naming-convention',
          1,
          `repository implementation in infrastructure/persistence/ should be named prisma-*.repository.ts (CLAUDE.md/AGENTS.md §4.H.27), found "${fileName}".`,
        );
      }
    }

    // Misplaced use-cases / repository interfaces / repository implementations.
    if (relPath.endsWith('.use-case.ts') && !relPath.includes('/application/use-cases/')) {
      pushViolation(
        violations,
        relPath,
        'use-case-misplaced',
        1,
        'a *.use-case.ts file must live under application/use-cases/ (CLAUDE.md/AGENTS.md §3).',
      );
    }
    if (
      relPath.endsWith('.repository.ts') &&
      !path.basename(relPath).startsWith('prisma-') &&
      !relPath.includes('/domain/repositories/') &&
      !relPath.includes('/application/ports/')
    ) {
      pushViolation(
        violations,
        relPath,
        'repository-interface-misplaced',
        1,
        'a *.repository.ts interface must live under domain/repositories/ or application/ports/ (CLAUDE.md/AGENTS.md §4.D.10).',
      );
    }
    if (path.basename(relPath).startsWith('prisma-') && relPath.endsWith('.repository.ts') && !relPath.includes('/infrastructure/persistence/')) {
      pushViolation(
        violations,
        relPath,
        'repository-impl-misplaced',
        1,
        'a prisma-*.repository.ts implementation must live under infrastructure/persistence/ (CLAUDE.md/AGENTS.md §4.D.10).',
      );
    }

    // Domain: only the four documented subfolders are allowed.
    const { subfolder } = layerOf(relPath);
    if (layer === 'domain') {
      if (!subfolder) {
        pushViolation(
          violations,
          relPath,
          'domain-disallowed-folder',
          1,
          'file sits directly under domain/ — must be inside entities/, value-objects/, errors/, or repositories/ (CLAUDE.md/AGENTS.md §3).',
        );
      } else if (!DOMAIN_ALLOWED_SUBFOLDERS.has(subfolder)) {
        pushViolation(
          violations,
          relPath,
          'domain-disallowed-folder',
          1,
          `domain/${subfolder}/ is not one of the documented domain subfolders (entities, value-objects, errors, repositories — CLAUDE.md/AGENTS.md §3).`,
        );
      }
    }

    // Presentation: one folder per interface adapter transport (http/queue/scheduler),
    // and — except for scheduler, which is flat — a further "kind" subfolder within it.
    if (layer === 'presentation') {
      const transport = subfolder;
      const kind = layerOf(relPath).kind;
      if (!transport) {
        pushViolation(
          violations,
          relPath,
          'presentation-disallowed-folder',
          1,
          'file sits directly under presentation/ — must be inside http/, queue/, or scheduler/ (CLAUDE.md/AGENTS.md §3).',
        );
      } else if (!PRESENTATION_TRANSPORTS[transport]) {
        pushViolation(
          violations,
          relPath,
          'presentation-disallowed-folder',
          1,
          `presentation/${transport}/ is not a documented transport (http, queue, scheduler — CLAUDE.md/AGENTS.md §3).`,
        );
      } else {
        const allowedKinds = PRESENTATION_TRANSPORTS[transport].kinds;
        if (allowedKinds) {
          if (!kind) {
            pushViolation(
              violations,
              relPath,
              'presentation-disallowed-folder',
              1,
              `file sits directly under presentation/${transport}/ — must be inside one of: ${[...allowedKinds].join(', ')} (CLAUDE.md/AGENTS.md §3).`,
            );
          } else if (!allowedKinds.has(kind)) {
            pushViolation(
              violations,
              relPath,
              'presentation-disallowed-folder',
              1,
              `presentation/${transport}/${kind}/ is not documented for the ${transport} transport (expected one of: ${[...allowedKinds].join(', ')} — CLAUDE.md/AGENTS.md §3).`,
            );
          }
        }
        // transport === 'scheduler': flat by design, no kind subfolder required.
      }
    }
  }

  // ---- Module-level structural checks (filesystem, not per-file) ----------
  if (fs.existsSync(MODULES_ROOT)) {
    const moduleDirs = fs
      .readdirSync(MODULES_ROOT, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !onlyModule || name === onlyModule);

    for (const mod of moduleDirs) {
      const indexPath = path.join(MODULES_ROOT, mod, 'index.ts');
      if (!fs.existsSync(indexPath)) {
        pushViolation(
          violations,
          `src/modules/${mod}`,
          'module-missing-index',
          1,
          `module "${mod}" has no index.ts public API barrel (CLAUDE.md/AGENTS.md §2.1, §3).`,
        );
      }
    }
  }

  // ---- Circular dependency detection (whole src/ local-file graph) --------
  const graph = new Map(); // relPath -> [relPath, ...]
  for (const [relPath, facts] of fileFacts) {
    const edges = [];
    for (const imp of facts.imports) {
      const resolution = resolveSpecifier(relPath, imp.spec);
      if (resolution) edges.push(toRel(resolution.resolved));
    }
    graph.set(relPath, edges);
  }

  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map();
  const stack = [];
  const reportedCycles = new Set();

  function dfs(node) {
    color.set(node, GRAY);
    stack.push(node);
    for (const next of graph.get(node) || []) {
      if (!graph.has(next)) continue; // resolved outside src/ (shouldn't happen) or missing file
      const nextColor = color.get(next) || WHITE;
      if (nextColor === WHITE) {
        dfs(next);
      } else if (nextColor === GRAY) {
        const cycleStart = stack.indexOf(next);
        const cycle = stack.slice(cycleStart).concat(next);
        const key = [...cycle].sort().join('|');
        if (!reportedCycles.has(key)) {
          reportedCycles.add(key);
          pushViolation(
            violations,
            cycle[0],
            'circular-dependency',
            1,
            `import cycle: ${cycle.join(' → ')}`,
          );
        }
      }
    }
    stack.pop();
    color.set(node, BLACK);
  }

  for (const node of graph.keys()) {
    if ((color.get(node) || WHITE) === WHITE) dfs(node);
  }

  // ---- Output ---------------------------------------------------------------
  const allFindings = [...violations, ...heuristics];

  if (json) {
    console.log(
      JSON.stringify(
        { violationCount: violations.length, heuristicCount: heuristics.length, violations, heuristics },
        null,
        2,
      ),
    );
  } else if (allFindings.length === 0) {
    if (!quiet) console.log(`validate-architecture: ${fileFacts.size} files checked, 0 findings.`);
  } else {
    console.log(
      `validate-architecture: ${violations.length} violation(s), ${heuristics.length} heuristic finding(s) across ${fileFacts.size} files checked:\n`,
    );
    for (const v of violations) {
      console.log(`  ${v.file}:${v.line}  [${v.rule}]`);
      console.log(`    ${v.message}\n`);
    }
    if (heuristics.length > 0) {
      console.log('--- heuristics (review, not auto-failing unless --strict) ---\n');
      for (const h of heuristics) {
        console.log(`  ${h.file}:${h.line}  [${h.rule}]`);
        console.log(`    ${h.message}\n`);
      }
    }
  }

  const shouldFail = violations.length > 0 || (strict && heuristics.length > 0);
  process.exit(shouldFail ? 1 : 0);
}

main();

#!/usr/bin/env node
'use strict';

/**
 * validate-i18n.js
 *
 * Two checks over the nestjs-i18n setup (src/i18n/<lang>/<namespace>.json,
 * used via i18n.t('namespace.key') / i18n.translate('namespace.key')):
 *
 * 1. No hardcoded Persian/Arabic string literals in source — user-facing text in those
 *    scripts must go through i18n, not be typed directly into a .ts file.
 * 2. Every i18n key referenced in source actually exists in the resource files (hard
 *    rule), and every key that exists in the fallback locale also exists in every other
 *    locale (heuristic — a missing translation silently falls back, which is a product
 *    bug, not a crash, so it's reported but doesn't fail the build by default).
 */

const fs = require('fs');
const path = require('path');

let ts;
try {
  ts = require('typescript');
} catch {
  console.error('validate-i18n: the "typescript" package is required. Run `npm install` first.');
  process.exit(1);
}

const CWD = process.cwd();
const SRC_ROOT = path.join(CWD, 'src');
const I18N_ROOT = path.join(SRC_ROOT, 'i18n');
const FALLBACK_LANGUAGE = 'en';

// Arabic (U+0600-06FF), Arabic Supplement (U+0750-077F), Arabic Extended-A
// (U+08A0-08FF), Arabic Presentation Forms A/B (U+FB50-FDFF, U+FE70-FEFF) — covers
// Persian too (Persian uses the Arabic script plus a few extra letters already inside
// these blocks). Written as explicit \u escapes, not literal characters, so this file
// stays correct regardless of how it's viewed/edited.
const ARABIC_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

// Paths where literal Arabic/Persian text is expected and legitimate: test fixtures,
// and any text-normalisation module's own sample/reference data.
const EXCEPTION_PATH_SUBSTRINGS = ['/text-normalisation/', '/i18n/'];

function isExceptedPath(relPath) {
  if (relPath.endsWith('.spec.ts') || relPath.endsWith('.e2e-spec.ts')) return true;
  return EXCEPTION_PATH_SUBSTRINGS.some((s) => relPath.includes(s));
}

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
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile() && /\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function toRel(file) {
  return path.relative(CWD, file).split(path.sep).join('/');
}

function flattenKeys(obj, prefix, out) {
  for (const [key, value] of Object.entries(obj)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flattenKeys(value, nextPrefix, out);
    } else {
      out.add(nextPrefix);
    }
  }
}

function loadLocaleKeys() {
  // language -> Set<dotted.key>
  const localeKeys = new Map();
  if (!fs.existsSync(I18N_ROOT)) return localeKeys;
  for (const lang of fs.readdirSync(I18N_ROOT, { withFileTypes: true })) {
    if (!lang.isDirectory()) continue;
    const keys = new Set();
    const langDir = path.join(I18N_ROOT, lang.name);
    for (const file of fs.readdirSync(langDir)) {
      if (!file.endsWith('.json')) continue;
      const namespace = path.basename(file, '.json');
      let parsed;
      try {
        parsed = JSON.parse(fs.readFileSync(path.join(langDir, file), 'utf8'));
      } catch (err) {
        console.error(`validate-i18n: failed to parse ${path.join('src/i18n', lang.name, file)}: ${err.message}`);
        process.exit(1);
      }
      flattenKeys(parsed, namespace, keys);
    }
    localeKeys.set(lang.name, keys);
  }
  return localeKeys;
}

function collectStringLiteralsAndKeyUsages(file, content) {
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const lineOf = (node) => sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;

  const stringLiterals = []; // { text, line }
  const keyUsages = []; // { key, line }
  const dynamicKeyPrefixes = []; // { prefix, line } — e.g. "errors." from `errors.${code}`

  function visit(node) {
    if (ts.isStringLiteralLike(node) && !ts.isImportDeclaration(node.parent) && node.parent.kind !== ts.SyntaxKind.ImportSpecifier) {
      stringLiterals.push({ text: node.text, line: lineOf(node) });
    }
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      (node.expression.name.text === 't' || node.expression.name.text === 'translate') &&
      node.arguments[0]
    ) {
      const arg = node.arguments[0];
      if (ts.isStringLiteralLike(arg)) {
        keyUsages.push({ key: arg.text, line: lineOf(node) });
      } else if (ts.isTemplateExpression(arg)) {
        // Dynamic key, e.g. `errors.${code}` — the exact key isn't known statically,
        // but the literal head ("errors.") tells us which namespace/prefix is live,
        // so keys under it shouldn't be flagged as unused just because we can't trace
        // the runtime value.
        dynamicKeyPrefixes.push({ prefix: arg.head.text, line: lineOf(node) });
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return { stringLiterals, keyUsages, dynamicKeyPrefixes };
}

function main() {
  const args = process.argv.slice(2);
  const quiet = args.includes('--quiet');
  const json = args.includes('--json');
  const strict = args.includes('--strict');

  if (!fs.existsSync(SRC_ROOT)) {
    if (!quiet && !json) console.log('validate-i18n: src/ does not exist yet — nothing to check.');
    process.exit(0);
  }

  const localeKeys = loadLocaleKeys();
  const fallbackKeys = localeKeys.get(FALLBACK_LANGUAGE) || new Set();

  const violations = [];
  const heuristics = [];
  const usedKeys = new Set();
  const dynamicKeyPrefixes = new Set();

  const files = walk(SRC_ROOT);
  for (const file of files) {
    const relPath = toRel(file);
    if (relPath.startsWith('src/i18n/')) continue;

    const content = fs.readFileSync(file, 'utf8');
    const { stringLiterals, keyUsages, dynamicKeyPrefixes: filePrefixes } = collectStringLiteralsAndKeyUsages(
      file,
      content,
    );
    for (const dyn of filePrefixes) dynamicKeyPrefixes.add(dyn.prefix);

    if (!isExceptedPath(relPath)) {
      for (const lit of stringLiterals) {
        if (ARABIC_SCRIPT_RE.test(lit.text)) {
          violations.push({
            file: relPath,
            line: lit.line,
            rule: 'hardcoded-arabic-script',
            message: `hardcoded Persian/Arabic text "${lit.text}" — route user-facing text through i18n (nestjs-i18n) instead of a literal in source.`,
          });
        }
      }
    }

    for (const usage of keyUsages) {
      usedKeys.add(usage.key);
      if (localeKeys.size > 0 && !fallbackKeys.has(usage.key)) {
        violations.push({
          file: relPath,
          line: usage.line,
          rule: 'unregistered-i18n-key',
          message: `i18n key "${usage.key}" is not registered in src/i18n/${FALLBACK_LANGUAGE}/ — add it before shipping this string.`,
        });
      }
    }
  }

  // Locale gaps: a key exists in the fallback language but is missing elsewhere.
  for (const [lang, keys] of localeKeys) {
    if (lang === FALLBACK_LANGUAGE) continue;
    for (const key of fallbackKeys) {
      if (!keys.has(key)) {
        heuristics.push({
          file: `src/i18n/${lang}/`,
          line: 1,
          rule: 'locale-gap',
          message: `key "${key}" exists in ${FALLBACK_LANGUAGE}/ but not in ${lang}/ — will silently fall back to ${FALLBACK_LANGUAGE} for that locale.`,
        });
      }
    }
  }

  // Unused keys: registered but never referenced in source, statically or dynamically
  // (heuristic — may be reserved for imminent use).
  for (const key of fallbackKeys) {
    if (usedKeys.has(key)) continue;
    const coveredByDynamicUsage = [...dynamicKeyPrefixes].some((prefix) => key.startsWith(prefix));
    if (coveredByDynamicUsage) continue;
    heuristics.push({
      file: `src/i18n/${FALLBACK_LANGUAGE}/`,
      line: 1,
      rule: 'unused-i18n-key',
      message: `key "${key}" is registered but never referenced via .t()/.translate() in src/ — verify it's still needed.`,
    });
  }

  if (json) {
    console.log(
      JSON.stringify({ violationCount: violations.length, heuristicCount: heuristics.length, violations, heuristics }, null, 2),
    );
  } else if (violations.length === 0 && heuristics.length === 0) {
    if (!quiet) console.log(`validate-i18n: ${files.length} files checked, 0 findings.`);
  } else {
    console.log(`validate-i18n: ${violations.length} violation(s), ${heuristics.length} heuristic finding(s):\n`);
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

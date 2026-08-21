// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

// Must match the module map in CLAUDE.md/AGENTS.md §2 — see
// docs/backend-infrastructure-notes.md for why this duplicates validate-architecture.js.
const MODULE_NAMES = [
  'identity',
  'accounts',
  'channels',
  'entitlement',
  'automation',
  'flows',
  'ingestion',
  'dispatch',
  'moderation',
  'assistant',
  'audit',
];

const DOMAIN_APPLICATION_PURITY_PATHS = [
  { name: '@nestjs/common', message: 'domain/application must not import NestJS (CLAUDE.md/AGENTS.md §4.A.1).' },
  { name: '@nestjs/core', message: 'domain/application must not import NestJS (CLAUDE.md/AGENTS.md §4.A.1).' },
  { name: '@prisma/client', message: 'go through infrastructure/persistence/ instead (CLAUDE.md/AGENTS.md §4.D.10).' },
  { name: 'fastify', message: 'domain/application must not import Fastify (CLAUDE.md/AGENTS.md §4.A.1).' },
  { name: 'axios', message: 'define a gateway port instead (CLAUDE.md/AGENTS.md §4.D.11).' },
  { name: 'bullmq', message: 'domain/application must not import BullMQ directly (CLAUDE.md/AGENTS.md §0.1).' },
  { name: 'ioredis', message: 'domain/application must not import ioredis directly (CLAUDE.md/AGENTS.md §0.1).' },
];

const moduleIsolationOverrides = MODULE_NAMES.map((mod) => ({
  files: [`src/modules/${mod}/domain/**/*.ts`, `src/modules/${mod}/application/**/*.ts`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        paths: DOMAIN_APPLICATION_PURITY_PATHS,
        patterns: [
          {
            group: ['**/infrastructure/**'],
            message: 'must not import infrastructure/ (CLAUDE.md/AGENTS.md §4.A.1 — dependency direction is infrastructure → application → domain).',
          },
          {
            group: ['**/presentation/**'],
            message: 'must not import presentation/ (CLAUDE.md/AGENTS.md §4.A.1 — dependency direction is presentation → application → domain; request validation lives in presentation/*/dto/, use cases take plain arguments).',
          },
          ...MODULE_NAMES.filter((other) => other !== mod).flatMap((other) => [
            {
              group: [
                `**/${other}/domain/**`,
                `**/${other}/application/**`,
                `**/${other}/presentation/**`,
                `**/${other}/infrastructure/**`,
              ],
              message: `cross-module import into "${other}" — use its public index.ts barrel or a domain event (CLAUDE.md/AGENTS.md §2.1).`,
            },
          ]),
        ],
      },
    ],
  },
}));

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'generated/**', 'node_modules/**', 'eslint.config.js'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintConfigPrettier,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      // CLAUDE.md/AGENTS.md §4.H.26 — Fastify/Node crashes the process on an
      // unhandled promise rejection.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // CLAUDE.md/AGENTS.md §4.H.25 — Scope.REQUEST is banned outright.
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Scope'][property.name='REQUEST']",
          message:
            'Scope.REQUEST is banned (CLAUDE.md/AGENTS.md §4.H.25) — pass values explicitly instead of request-scoped DI.',
        },
      ],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
  ...moduleIsolationOverrides,
);

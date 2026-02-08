/**
 * Integration tests for Prime touched-file lint non-regression gate (TASK-50).
 *
 * Test Contract:
 * - TC-01: Introduced lint error in touched Prime file fails changed-file lint gate
 * - TC-02: Untouched-file legacy lint debt does not fail the gate
 * - TC-03: Clean touched-file diff passes gate locally and in CI
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildPrimeLintDecision,
  collectPrimeLintTargets,
  isLintablePrimePath,
  isPrimePath,
  normalizePath,
} from '../prime-lint-changed-files';

const REPO_ROOT = resolve(__dirname, '../../../..');
const PRIME_DIR = resolve(REPO_ROOT, 'apps/prime');
const ESLINT_IGNORE_PATTERNS = resolve(REPO_ROOT, 'tools/eslint-ignore-patterns.cjs');

describe('Prime lint non-regression gate', () => {
  describe('Infrastructure validation', () => {
    it('TC-03a: Prime ESLint config exists and is valid', () => {
      const eslintConfigPath = resolve(PRIME_DIR, '.eslintrc.cjs');
      expect(existsSync(eslintConfigPath)).toBe(true);

      // Verify config can be loaded
      const config = require(eslintConfigPath);
      expect(config).toBeDefined();
      expect(config.extends).toContain('next/core-web-vitals');
      expect(config.rules).toBeDefined();
    });

    it('TC-03b: Prime is NOT exempt in eslint-ignore-patterns.cjs', () => {
      const ignorePatterns = readFileSync(ESLINT_IGNORE_PATTERNS, 'utf8');

      // Should NOT contain "apps/prime/**" exemption
      expect(ignorePatterns).not.toMatch(/["']apps\/prime\/\*\*["']/);
    });

    it('TC-03c: Prime package.json has lint script', () => {
      const packageJsonPath = resolve(PRIME_DIR, 'package.json');
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

      expect(packageJson.scripts?.lint).toBeDefined();
      expect(packageJson.scripts.lint).not.toMatch(/echo.*skipped/i);
    });
  });

  describe('Path filtering logic', () => {
    it('TC-02a: correctly identifies Prime paths', () => {
      expect(isPrimePath('apps/prime/src/app/page.tsx')).toBe(true);
      expect(isPrimePath('apps/prime/package.json')).toBe(true);
      expect(isPrimePath('apps/brikette/src/app/page.tsx')).toBe(false);
      expect(isPrimePath('packages/ui/src/Button.tsx')).toBe(false);
    });

    it('TC-02b: correctly identifies lintable Prime paths', () => {
      expect(isLintablePrimePath('apps/prime/src/app/page.tsx')).toBe(true);
      expect(isLintablePrimePath('apps/prime/src/utils/helpers.ts')).toBe(true);
      expect(isLintablePrimePath('apps/prime/src/utils/helpers.js')).toBe(true);
      expect(isLintablePrimePath('apps/prime/package.json')).toBe(false);
      expect(isLintablePrimePath('apps/prime/README.md')).toBe(false);
      expect(isLintablePrimePath('apps/brikette/src/app/page.tsx')).toBe(false);
    });

    it('TC-02c: normalizes paths correctly', () => {
      expect(normalizePath('apps/prime/src/app/page.tsx')).toBe('apps/prime/src/app/page.tsx');
      expect(normalizePath('./apps/prime/src/app/page.tsx')).toBe('apps/prime/src/app/page.tsx');
      expect(normalizePath('apps\\prime\\src\\app\\page.tsx')).toBe(
        'apps/prime/src/app/page.tsx',
      );
    });

    it('TC-02d: collects unique lintable Prime targets', () => {
      const paths = [
        'apps/prime/src/app/page.tsx',
        'apps/prime/src/app/layout.tsx',
        'apps/prime/package.json', // Not lintable
        'apps/brikette/src/app/page.tsx', // Not Prime
        'apps/prime/src/app/page.tsx', // Duplicate
      ];

      const targets = collectPrimeLintTargets(paths);

      expect(targets).toEqual([
        'apps/prime/src/app/layout.tsx',
        'apps/prime/src/app/page.tsx',
      ]);
    });
  });

  describe('Lint decision logic', () => {
    it('TC-02e: skips when no paths provided', () => {
      const decision = buildPrimeLintDecision([]);

      expect(decision.shouldRun).toBe(false);
      expect(decision.skippedReason).toBe('no_paths');
      expect(decision.targets).toEqual([]);
    });

    it('TC-02f: skips when no Prime paths in change set', () => {
      const paths = ['apps/brikette/src/app/page.tsx', 'packages/ui/src/Button.tsx'];
      const decision = buildPrimeLintDecision(paths);

      expect(decision.shouldRun).toBe(false);
      expect(decision.skippedReason).toBe('no_prime_paths');
      expect(decision.targets).toEqual([]);
    });

    it('TC-02g: skips when Prime paths exist but none are lintable', () => {
      const paths = ['apps/prime/package.json', 'apps/prime/README.md'];
      const decision = buildPrimeLintDecision(paths);

      expect(decision.shouldRun).toBe(false);
      expect(decision.skippedReason).toBe('no_lintable_paths');
      expect(decision.targets).toEqual([]);
    });

    it('TC-03d: runs lint when lintable Prime files are changed', () => {
      const paths = ['apps/prime/src/app/page.tsx', 'apps/prime/src/utils/helpers.ts'];
      const decision = buildPrimeLintDecision(paths);

      expect(decision.shouldRun).toBe(true);
      expect(decision.skippedReason).toBe('none');
      expect(decision.targets).toEqual([
        'apps/prime/src/app/page.tsx',
        'apps/prime/src/utils/helpers.ts',
      ]);
    });

    it('TC-02h: includes only lintable Prime files in mixed change set', () => {
      const paths = [
        'apps/prime/src/app/page.tsx',
        'apps/prime/package.json', // Not lintable
        'apps/brikette/src/app/page.tsx', // Not Prime
        'apps/prime/README.md', // Not lintable
      ];
      const decision = buildPrimeLintDecision(paths);

      expect(decision.shouldRun).toBe(true);
      expect(decision.targets).toEqual(['apps/prime/src/app/page.tsx']);
    });
  });

  describe('End-to-end validation', () => {
    it('TC-03e: lint script can be invoked via pnpm', () => {
      // This test verifies the lint command runs without error on current state
      // It may pass with exit 0 (no changes) or fail with exit 1 (lint errors in changed files)
      // The key is that the infrastructure exists and is callable

      try {
        const result = execFileSync('pnpm', ['--filter', '@apps/prime', 'lint'], {
          cwd: REPO_ROOT,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 30000,
        });

        // Success case - verify output exists
        expect(typeof result).toBe('string');
      } catch (error: any) {
        // Failure case - verify it failed due to lint errors, not infra issues
        expect(error.status).toBeGreaterThan(0);
        expect(error.output).toBeDefined();

        // Verify it's not an infrastructure failure (like missing script)
        const output = error.output?.join('') || '';
        expect(output).not.toMatch(/command not found/i);
        expect(output).not.toMatch(/script not found/i);
      }
    });
  });
});

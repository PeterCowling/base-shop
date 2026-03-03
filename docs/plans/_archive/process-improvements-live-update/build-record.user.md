---
Status: Complete
Feature-Slug: process-improvements-live-update
Business-Unit: BOS
Build-date: 2026-02-26
artifact: build-record
---

# Build Record

## What was built

A pre-commit hook that automatically regenerates `process-improvements.user.html` and `process-improvements.json` whenever a `results-review.user.md`, `build-record.user.md`, or `reflection-debt.user.md` file is staged. The operator no longer needs to manually run the generation script after editing plan source files.

Also added a `--check` mode to the generator for future CI drift detection, with full unit test coverage.

## Deliverables

- `scripts/git-hooks/generate-process-improvements.sh` — new conditional hook script
- `scripts/git-hooks/pre-commit.sh` — wired hook into chain (after lint-staged-packages, before validate:agent-context)
- `scripts/src/startup-loop/generate-process-improvements.ts` — added `runCheck()` export + `--check` CLI flag
- `scripts/package.json` — added `check-process-improvements` script
- `scripts/src/startup-loop/__tests__/generate-process-improvements.test.ts` — TC-13, TC-14, TC-15 added (5/5 pass)

## Test results

- 5/5 tests pass (`pnpm -w run test:governed -- jest -- --config scripts/jest.config.cjs --testPathPattern=generate-process-improvements --no-coverage`)
- TC-04 verified manually: hook exits 0 with skip message when no relevant files staged
- TC-09 verified: `check-process-improvements` exits 0 on up-to-date files
- TC-10 verified: `check-process-improvements` exits 1 when files are stale

## Key design decisions

- Pre-commit hook approach chosen over CI job or file-watcher — keeps generated files in same commit as the changes that triggered them
- Two-class error handling: hard-fail only on HTML-marker corruption; warn-only for all other generator errors
- `--check` mode compares only the three array variable blocks (not full HTML) to avoid false positives from the date-stamp footer
- Hook runs the generator via `pnpm --filter scripts run startup-loop:generate-process-improvements` which correctly resolves cwd to repo root

## Commits

- `7d2a6f15b6` — Wave 1: hook script + generator --check mode + package.json script + HTML regeneration
- `d23f167a85` — Wave 2: pre-commit.sh wiring + unit tests (bundled with Phase 4 reception polish commit)

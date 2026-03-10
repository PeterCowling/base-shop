# Build Record — prime-client-logger

**Plan:** `docs/plans/prime-client-logger/plan.md`
**Date:** 2026-03-09
**Status:** All tasks complete

## Outcome Contract

- **Why:** Prime maintained a duplicate logger with env-var reading and log-level logic that belongs in a shared utility. The shared `@acme/lib` server logger cannot run in a browser, leaving prime to maintain its own.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime app `logger.ts` is replaced by a shared client-compatible logger utility, eliminating duplicate env-var reading and log-level logic.
- **Source:** operator

## What Was Built

**TASK-01** — Added `packages/lib/src/logger/client.ts` to `@acme/lib`:
- New file exports: `LogLevel` type, `setLogLevel`, `getLogLevel`, default `logger` (variadic debug/info/warn/error)
- No forbidden imports (`server-only`, `pino`, `getRequestContext`) — client-safe
- New `./logger/client` entry added to `packages/lib/package.json` exports map
- 9 unit tests (TC-01–TC-09) covering level filtering, env var initialisation, `silent` mapping, default fallback, and non-ZodError passthrough

**TASK-02** — Migrated prime to `@acme/lib/logger/client`:
- Deleted `apps/prime/src/utils/logger.ts` (72-line hand-rolled logger)
- Updated all 27 production import sites from `@/utils/logger` to `@acme/lib/logger/client`
- Updated all 4 test mock call sites from `@/utils/logger` to `@acme/lib/logger/client`
- Added `@acme/lib: workspace:*` as explicit declared dependency in `apps/prime/package.json`
- Scout confirmed: no production caller passes raw ZodError to `logger.error` — the implicit ZodError formatting was internal to the old logger only; no behaviour change for callers
- `zodErrorToString.ts` retained (still used by callers that format ZodErrors before logging)

## Validation Evidence

- `pnpm --filter @acme/lib build` (tsc -b): 0 errors
- `pnpm --filter @acme/lib lint`: 0 errors
- `pnpm --filter @apps/prime typecheck`: 0 errors
- `pnpm --filter @apps/prime lint`: 0 errors (34 pre-existing i18n warnings, out of scope)
- Grep checks: 0 remaining `@/utils/logger` imports; 27 `@acme/lib/logger/client` production imports; 4 test mock paths updated
- CI test run: pending (push to dev branch and monitor via `gh run watch`)

## Commits

- `fdd01b53a3` — TASK-01: `packages/lib/src/logger/client.ts` + test + package.json export
- `cf7b46ce3c` — TASK-02: all 27 production imports + 4 test mocks + logger.ts deletion + package.json dep

## Notes

- Codex offload was attempted but not available in the non-interactive shell; inline execution used (fallback per protocol)
- TASK-02 commit was bundled with a concurrent writer lock commit from another agent process; all TASK-02 files verified present in HEAD

---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-09
Last-reviewed: 2026-03-09
Last-updated: 2026-03-09 (all tasks complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: prime-client-logger
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 87%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Prime Client Logger Plan

## Summary

The prime PWA maintains a hand-rolled 72-line logger (`apps/prime/src/utils/logger.ts`) with env-var reading, log-level filtering, and ZodError handling. The shared `@acme/lib/logger` entry is server-only (pino + `import "server-only"`) and cannot run in a browser. This plan adds a client-compatible `./logger/client` export to `@acme/lib`, then migrates prime's 31 consumer references (27 production imports + 4 test mocks) to use it, and deletes the local logger file. The ZodError special-case stays prime-local. No new package is created; the `./http` / `./http/server` pattern in `@acme/lib` is the direct precedent.

## Active tasks
- [x] TASK-01: Add `packages/lib/src/logger/client.ts` shared client logger
- [x] TASK-02: Migrate prime to `@acme/lib/logger/client`

## Goals
- Eliminate duplicate env-var reading and log-level logic in prime
- Provide a shared client-compatible logger at `@acme/lib/logger/client`
- Add `@acme/lib` as an explicit declared dependency of prime (correctness fix for undeclared usage)
- Add unit tests for the shared client logger

## Non-goals
- Modifying the existing `@acme/lib` server logger
- Creating a new `@acme/logger` package
- Migrating brikette or reception to use the shared client logger (separate future work)
- Moving `zodErrorToString` to a shared package
- Adding ZodError transformation to the shared client logger

## Constraints & Assumptions
- Constraints:
  - `client.ts` must NOT import `server-only`, pino, or `getRequestContext`
  - `@acme/lib` `tsconfig.json` uses `"types": ["node"]` — client.ts must not use node-only global types that break browser TypeScript
  - `tsc -b` single-pass: new `client.ts` is picked up automatically via `include: src/**/*.ts`
  - `jest.moduleMapper.cjs` catch-all `"^@acme/lib/(.*)$"` → `" /packages/lib/src/$1"` resolves `@acme/lib/logger/client` to `packages/lib/src/logger/client.ts` — file must be named `client.ts`, not `index.client.ts`
  - CI-governed test runner only; no local Jest execution per project policy
- Assumptions:
  - `zodErrorToString` stays prime-local; shared logger takes `unknown[]` variadic args
  - No other app or package imports from `@acme/lib/logger/client` after this plan — prime is sole initial consumer
  - `NEXT_PUBLIC_LOG_LEVEL` env var is already understood across the prime deployment; no `.env.example` update needed

## Inherited Outcome Contract

- **Why:** Prime duplicates logger infrastructure that should be shared. The right solution depends on how many other apps need a client logger and whether `@acme/lib` is the right home — that's a scoping decision that needs fact-finding before building.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime app `logger.ts` is replaced by a shared client-compatible logger utility, eliminating duplicate env-var reading and log-level logic.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/prime-client-logger/fact-find.md`
- Key findings used:
  - Prime logger API is variadic (`...args: unknown[]`); server logger is message+meta — must not merge
  - `@acme/lib` already has client-safe files (`http/fetchJson.ts`) alongside server-only counterparts — confirmed pattern
  - `jest.moduleMapper.cjs` catch-all resolves `@acme/lib/logger/client` → `packages/lib/src/logger/client.ts` automatically
  - 27 production import sites + 4 test mock call sites = 31 references requiring updates
  - Prime has 5 existing undeclared `@acme/lib` imports; explicit dep is a correctness fix, not cosmetic

## Proposed Approach

- Option A: Add `./logger/client` entry to `@acme/lib` (chosen)
- Option B: New `@acme/logger` package with server/client exports
- Option C: Keep prime-local, improve it

Chosen approach: **Option A** — matches the `./http` / `./http/server` precedent already in `@acme/lib`; avoids the package creation overhead of Option B; option C leaves the duplication in place. Decision made based on evidence; no operator input required.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add `packages/lib/src/logger/client.ts` shared client logger | 90% | S | Complete (2026-03-09) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Migrate prime to `@acme/lib/logger/client` | 85% | M | Complete (2026-03-09) | TASK-01 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel.
Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Creates the shared file and exports; no prime changes |
| 2 | TASK-02 | Wave 1: TASK-01 | Migrates prime; requires TASK-01 built and `@acme/lib` typechecking clean |

**Max parallelism:** 1 (fully sequential — each wave has 1 task)
**Critical path:** TASK-01 → TASK-02 (2 waves)
**Total tasks:** 2

## Tasks

---

### TASK-01: Add `packages/lib/src/logger/client.ts` shared client logger
- **Type:** IMPLEMENT
- **Deliverable:** New file `packages/lib/src/logger/client.ts`; updated `packages/lib/package.json` exports map; new test file `packages/lib/src/logger/__tests__/logger.client.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-09)
- **Affects:** `packages/lib/src/logger/client.ts` (new), `packages/lib/package.json`, `packages/lib/src/logger/__tests__/logger.client.test.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02
- **Build Evidence:**
  - Offload: inline execution (codex not available in non-interactive shell; fallback to inline per protocol)
  - Exit: clean (`pnpm --filter @acme/lib build` 0 errors, `pnpm --filter @acme/lib lint` 0 errors)
  - Files present: `packages/lib/src/logger/client.ts` ✓, `packages/lib/src/logger/__tests__/logger.client.test.ts` ✓, `packages/lib/package.json` updated with `./logger/client` entry ✓
  - No forbidden imports (server-only, pino, getRequestContext): verified ✓
  - Committed in: `fdd01b53a3` (fdd01b53a39a7a8e1f7c328160c4745a98004955)
- **Confidence:** 90%
  - Implementation: 95% — the source logic is fully specified in `apps/prime/src/utils/logger.ts`; the only work is extracting it into a new file and removing the ZodError import. Held-back test: no single unknown would drop this below 80 — the `tsc -b` build picks up new files automatically, the catch-all jest mapper resolves the path, and no new deps are needed.
  - Approach: 90% — direct precedent in `packages/lib/src/http/fetchJson.ts` for client-safe file in same package. `package.json` export addition is the same shape as existing entries.
  - Impact: 85% — this task produces a new export that has no consumers until TASK-02 completes; the blast radius on `@acme/lib` existing consumers is zero (additive only).
- **Acceptance:**
  - `packages/lib/src/logger/client.ts` exists and exports: `LogLevel` type, `setLogLevel`, `getLogLevel`, `default logger` (variadic debug/info/warn/error)
  - `client.ts` does NOT import `server-only`, `pino`, or `getRequestContext`
  - `packages/lib/package.json` has new entry `"./logger/client": { "types": "./dist/logger/client.d.ts", "import": "./dist/logger/client.js" }`
  - `packages/lib/src/logger/__tests__/logger.client.test.ts` covers: level filtering (debug/info/warn/error/none), `setLogLevel`/`getLogLevel`, default level from `NEXT_PUBLIC_LOG_LEVEL`, `LOG_LEVEL` fallback, `"silent"` mapped to `"none"`, default `"info"` when no env var
  - `pnpm --filter @acme/lib typecheck` passes
  - `pnpm --filter @acme/lib lint` passes
- **Validation contract (TC-01):**
  - TC-01: `logger.debug('x')` when currentLevel=`info` → `console.debug` not called
  - TC-02: `logger.debug('x')` when currentLevel=`debug` → `console.debug` called with `'x'`
  - TC-03: `setLogLevel('warn')` then `logger.info('x')` → `console.info` not called
  - TC-04: `getLogLevel()` after `setLogLevel('error')` → returns `'error'`
  - TC-05: `NEXT_PUBLIC_LOG_LEVEL='debug'` set in env → initial level is `'debug'`
  - TC-06: `LOG_LEVEL='warn'` set (no NEXT_PUBLIC) → initial level is `'warn'`
  - TC-07: `NEXT_PUBLIC_LOG_LEVEL='silent'` → initial level is `'none'`
  - TC-08: No env var set → initial level is `'info'`
  - TC-09: `logger.error` receives a non-ZodError arg → passed through to `console.error` unchanged
- **Execution plan:** Red → Green → Refactor
  - Red: Write `logger.client.test.ts` with TC-01–TC-09 using jest spy on `console.*`; confirm fails with no source
  - Green: Write `client.ts` extracting `LogLevel`, `levelOrder`, `readEnv`, `setLogLevel`, `getLogLevel`, `shouldLog`, `logger` from prime's logger — omit ZodError import/handling
  - Refactor: Add `./logger/client` export to `packages/lib/package.json`; confirm `pnpm --filter @acme/lib typecheck` and `lint` pass
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:**
  - Scout: confirm `readEnv` globalThis fallback uses no node-only type that would fail browser TypeScript — `globalThis` is a standard Web API; `Record<string, unknown>` cast is safe.
  - Scout: confirm `@acme/lib` tsconfig `"types": ["node"]` does not emit browser-breaking types into the compiled output — types annotation is for ambient type resolution only, not injected into emitted `.d.ts` files; safe.
- **Edge Cases & Hardening:**
  - `setLogLevel` called with invalid string → guarded by `if (level in levelOrder)` — invalid values are silently ignored (matches current prime behaviour)
  - `readEnv` called in an environment where `process` is defined but `process.env` is undefined → `typeof process !== 'undefined' && process.env` guard handles it
  - Module initialisation race (log level read before env is set) → module-level IIFE; same initialisation pattern as current prime logger; not changed
- **What would make this >=90%:** Already at 90% composite; impact is capped at 85% because the new export has zero consumers until TASK-02. Once TASK-02 is complete, the impact dimension would reach 90%+.
- **Rollout / rollback:**
  - Rollout: additive — new export in `@acme/lib`; no existing consumers affected; deploy `@acme/lib` before TASK-02
  - Rollback: remove the export entry from `package.json` and delete `client.ts`; no downstream code changed until TASK-02
- **Documentation impact:** None: internal utility, no public API docs
- **Notes / references:**
  - Source: `apps/prime/src/utils/logger.ts` (verbatim logic to extract minus ZodError import)
  - Precedent: `packages/lib/src/http/fetchJson.ts` + `packages/lib/src/http/buildResponse.server.ts` pattern
  - Test environment: use `@jest-environment node` (matching existing `logger.test.ts`) to avoid jsdom `console.*` noise

---

### TASK-02: Migrate prime to `@acme/lib/logger/client`
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/prime/package.json`; deleted `apps/prime/src/utils/logger.ts`; 27 production imports updated; 4 test mocks updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-09)
- **Affects:** `apps/prime/package.json`, `apps/prime/src/utils/logger.ts` (deleted), `apps/prime/src/app/(guarded)/chat/GuestDirectory.tsx`, `apps/prime/src/components/settings/ChatOptInControls.tsx`, `apps/prime/src/hooks/data/useGuestProfiles.ts`, `apps/prime/src/hooks/dataOrchestrator/useDateInfo.ts`, `apps/prime/src/hooks/dataOrchestrator/useOccupantTransform.ts`, `apps/prime/src/hooks/mutator/useCompletedTaskMutator.ts`, `apps/prime/src/hooks/mutator/useGuestProfileMutator.ts`, `apps/prime/src/hooks/mutator/usePreArrivalMutator.ts`, `apps/prime/src/hooks/mutator/useQuestProgressMutator.ts`, `apps/prime/src/hooks/pureData/useFetchBagStorageData.ts`, `apps/prime/src/hooks/pureData/useFetchBookingsData.client.ts`, `apps/prime/src/hooks/pureData/useFetchCheckInCode.ts`, `apps/prime/src/hooks/pureData/useFetchCityTax.ts`, `apps/prime/src/hooks/pureData/useFetchCompletedTasksData.ts`, `apps/prime/src/hooks/pureData/useFetchFinancialsRoom.ts`, `apps/prime/src/hooks/pureData/useFetchGuestByRoom.ts`, `apps/prime/src/hooks/pureData/useFetchGuestDetails.ts`, `apps/prime/src/hooks/pureData/useFetchGuestProfile.ts`, `apps/prime/src/hooks/pureData/useFetchLoans.ts`, `apps/prime/src/hooks/pureData/useFetchPreArrivalData.ts`, `apps/prime/src/hooks/pureData/useFetchPreordersData.ts`, `apps/prime/src/hooks/pureData/useFetchQuestProgress.ts`, `apps/prime/src/hooks/useUuid.ts`, `apps/prime/src/lib/messaging/useMessagingQueue.ts`, `apps/prime/src/services/firebase.ts`, `apps/prime/src/services/useFirebase.ts`, `apps/prime/src/utils/dateUtils.ts`, `[test] apps/prime/src/app/(guarded)/chat/__tests__/guest-directory.test.tsx`, `[test] apps/prime/src/components/__tests__/remaining-components-ds-migration.test.tsx`, `[test] apps/prime/src/components/onboarding/__tests__/chat-optin-controls.test.tsx`, `[test] apps/prime/src/hooks/dataOrchestrator/useOccupantTransform.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Build Evidence:**
  - Offload: inline execution (codex not available in non-interactive shell; fallback to inline per protocol)
  - Scout result: no raw ZodError passed to `logger.error` in any production file — implicit ZodError formatting behaviour was only in the logger itself, not depended upon by callers. Zero callers affected.
  - Import path migration: 27 production files updated via `sed` + `eslint --fix` for import-sort corrections; 4 test mock paths updated
  - Controlled expansion: `language-selector/page.tsx` import-sort autofix (not in Affects; fixed to satisfy lint gate, caused by adjacent concurrent commit)
  - Typecheck: `pnpm --filter @apps/prime typecheck` → 0 errors
  - Lint: `pnpm --filter @apps/prime lint` → 0 errors (34 pre-existing i18n warnings, out of scope)
  - Acceptance checks: logger.ts deleted ✓, 27 production imports updated ✓, 4 test mocks updated ✓, `@acme/lib: workspace:*` in package.json ✓
  - Committed in: `cf7b46ce3c` (bundled with concurrent writer lock commit)
- **Confidence:** 85%
  - Implementation: 90% — mechanical find-and-replace of import paths; TypeScript typecheck catches any typo; all 31 references explicitly enumerated in Affects above
  - Approach: 85% — ZodError special-case confirmed scoped out (stays in `apps/prime/src/utils/zodErrorToString.ts`). Held-back test: what single unresolved unknown would drop this below 80? If `apps/prime/src/services/firebase.ts` uses `import { LogLevel }` (named export) rather than `import logger` (default), the migration needs an extra named-export line. Verified by reading the source — `firebase.ts` uses `import logger` and `setLogLevel` (checking now).
  - Impact: 80% — Held-back test: what single unresolved unknown would drop this below 80? If the test mock updates break a currently-passing test (e.g., a test that checks the mock shape), that test would fail at CI. However, the mock shape produced by `jest.mock('@acme/lib/logger/client', () => ({ ... }))` is functionally identical to the current mock shape `jest.mock('@/utils/logger', () => ({ ... }))` — the mock factory callback is the same in both cases, only the module path changes. No mock-shape mismatch expected.
- **Acceptance:**
  - `apps/prime/package.json` includes `"@acme/lib": "workspace:*"` in `dependencies`
  - `apps/prime/src/utils/logger.ts` no longer exists
  - All 27 production files import from `'@acme/lib/logger/client'`
  - All 4 test files use `jest.mock('@acme/lib/logger/client', ...)` not `jest.mock('@/utils/logger', ...)`
  - `apps/prime/src/utils/zodErrorToString.ts` remains unchanged
  - `pnpm --filter @apps/prime typecheck` passes
  - `pnpm --filter @apps/prime lint` passes
  - CI test run passes (push to dev and monitor via `gh run watch`)
- **Validation contract (TC-02):**
  - TC-01: `pnpm --filter @apps/prime typecheck` → 0 errors
  - TC-02: `pnpm --filter @apps/prime lint` → 0 errors
  - TC-03: `grep -r "@/utils/logger" apps/prime/src/` → 0 matches (logger.ts deleted, all imports updated)
  - TC-04: `grep -r "from '@acme/lib/logger/client'" apps/prime/src/` → 27 matches in production files
  - TC-05: `grep -r "jest.mock('@acme/lib/logger/client'" apps/prime/src/` → 4 matches in test files
  - TC-06: CI test run → all prime test suites pass (no mock resolution failures)
- **Execution plan:** Red → Green → Refactor
  - Red: (conceptual) delete `apps/prime/src/utils/logger.ts` — this breaks the 27 production imports and 4 test mocks (TypeScript errors confirm breakage)
  - Green: update `apps/prime/package.json` (add `@acme/lib`), update all 27 production files (change import path), update all 4 test mock paths
  - Refactor: verify `pnpm --filter @apps/prime typecheck` and `lint` pass clean; confirm `zodErrorToString.ts` still imports from `'./zodErrorToString'` (unchanged — it's `firebase.ts` that calls `logger.error` with processed args)
- **Planning validation (required for M/L):**
  - Checks run:
    - Confirmed all 27 production files by grep (listed above in Affects)
    - Confirmed 4 test files by grep
    - Confirmed `firebase.ts` uses `import logger from '@/utils/logger'` and `setLogLevel` (both are exported by `client.ts`)
    - Confirmed `jest.moduleMapper.cjs` catch-all resolves `@acme/lib/logger/client` → `packages/lib/src/logger/client.ts`
    - Confirmed `apps/prime/src/utils/zodErrorToString.ts` has no import of logger (one-way dependency: logger → zodErrorToString, not vice versa); after migration zodErrorToString is unused by the logger but remains used by any prime code that still handles ZodErrors
  - Validation artifacts:
    - `grep -r "from '@/utils/logger'" apps/prime/src/` → 27 production lines (verified)
    - `grep -r "jest.mock.*@/utils/logger" apps/prime/src/` → 4 test lines (verified)
  - Unexpected findings:
    - `apps/prime/src/services/firebase.ts` uses both `import logger` (default) AND `setLogLevel` (named export) — both are exported by `client.ts`, so no issue
- **Consumer tracing (new outputs check):**
  - `@acme/lib/logger/client` default export `logger`: consumed by 27 prime production files → all updated in this task
  - `LogLevel` type from `@acme/lib/logger/client`: used in prime tests via mock shape (no structural impact — mock overrides the module)
  - `setLogLevel` from `@acme/lib/logger/client`: used in `apps/prime/src/services/firebase.ts` → import path updated
  - `getLogLevel` from `@acme/lib/logger/client`: confirm any usage... (verified: not directly imported in any prime file; only used internally by `shouldLog`)
  - `zodErrorToString`: imported from `./zodErrorToString` by the OLD logger; after deletion, `zodErrorToString.ts` is still present and valid, but the logger no longer calls it. Any prime caller that passed a ZodError to `logger.error()` expecting auto-formatting must now call `zodErrorToString` itself before passing the string. **Note:** this is a subtle behaviour change — the current logger auto-processes ZodError args; the new shared logger does not. Callers that relied on this implicit behaviour need to be identified.
- **Scouts:**
  - Scout: scan all 27 production files for `ZodError` arg passed directly to `logger.error(err)` — if any caller passes a raw ZodError, that caller must be updated to call `zodErrorToString(err)` explicitly before passing to the logger.
- **Edge Cases & Hardening:**
  - ZodError implicit auto-formatting: current `logger.error` in prime auto-processes ZodError args; new shared logger does not. The scout above must confirm whether any caller depends on this before deleting the old logger.
  - Import of `setLogLevel` in `firebase.ts`: confirmed it uses the named export; `client.ts` must export it as a named export (not only default)
- **What would make this >=90%:**
  - Confirm no caller passes raw ZodError directly to `logger.error` (scout result) — if no such caller exists, implementation confidence rises to 95%
- **Rollout / rollback:**
  - Rollout: once TASK-01 is merged and `@acme/lib` is built, apply TASK-02 in a single commit; typecheck gate must pass before pushing
  - Rollback: revert the import-path changes and restore `apps/prime/src/utils/logger.ts` from git history; remove `@acme/lib` from prime `package.json`
- **Documentation impact:** None: internal refactor, no user-visible change
- **Notes / references:**
  - The 27 production file list is exhaustive (verified by grep at planning time — see Affects)
  - `apps/prime/src/utils/zodErrorToString.ts` is NOT deleted by this task — it may still be used by prime callers that want to format ZodErrors before logging

---

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `client.ts` accidentally imports server-only module | Low | High | ESLint `no-restricted-imports` on `server-only`; review in TASK-01 |
| ZodError auto-formatting silently removed | Low | Medium | TASK-02 scout scans all 27 files for `logger.error(zodErrorInstance)` before deletion |
| Import path typo in one of 31 references | Low | Low | TypeScript typecheck gate catches all production files; CI test run catches test mock paths |
| Turbopack dual-module identity (src vs dist) | Low | Medium | New export resolves via exports map to `dist/logger/client.js` consistently; no resolveAlias change needed |
| `@acme/lib` build not run before prime migration | Low | Medium | TASK-01 must complete and `pnpm --filter @acme/lib build` must pass before TASK-02 starts |

## Observability
- Logging: None: this task IS the logging layer; no meta-logging needed
- Metrics: None: internal refactor
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] `packages/lib/src/logger/client.ts` exists and exports `LogLevel`, `setLogLevel`, `getLogLevel`, default `logger`
- [ ] `packages/lib/package.json` has `"./logger/client"` export entry
- [ ] `packages/lib/src/logger/__tests__/logger.client.test.ts` covers TC-01 through TC-09 and passes in CI
- [ ] `apps/prime/src/utils/logger.ts` deleted
- [ ] All 27 prime production files import from `@acme/lib/logger/client`
- [ ] All 4 prime test files mock `@acme/lib/logger/client`
- [ ] `apps/prime/package.json` lists `@acme/lib: workspace:*` as explicit dep
- [ ] `pnpm --filter @acme/lib typecheck` passes
- [ ] `pnpm --filter @apps/prime typecheck` passes
- [ ] `pnpm --filter @acme/lib lint` passes
- [ ] `pnpm --filter @apps/prime lint` passes
- [ ] CI test run passes (prime test suites green)

## Decision Log
- 2026-03-09: Chose Option A (add `./logger/client` to `@acme/lib`) over Option B (new package) and Option C (prime-local). Evidence: `http` module precedent; Option B has disproportionate package plumbing overhead for single consumer; Option C leaves duplication in place.
- 2026-03-09: ZodError auto-formatting scoped out of shared logger. Stays prime-local. Rationale: the shared logger should be zero-dependency on ZodError; callers are responsible for formatting.

## Overall-confidence Calculation
- TASK-01: confidence 90%, effort S (weight 1)
- TASK-02: confidence 85%, effort M (weight 2)
- Overall = (90×1 + 85×2) / (1+2) = (90 + 170) / 3 = 260 / 3 ≈ **87%**

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `client.ts` + export entry + tests | Yes — no prior task needed; `packages/lib/src/logger/` dir exists; `package.json` exports map has precedent entries | None | No |
| TASK-02: Migrate prime 31 references | Yes — depends on TASK-01 completion; `@acme/lib/logger/client` export must exist before prime can typecheck | None — TASK-01 gates this correctly; ZodError scout identified as an edge case, handled in task | No |

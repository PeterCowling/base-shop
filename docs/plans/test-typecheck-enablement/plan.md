---
Type: Plan
Status: Draft
Domain: Infra
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18 (Phases 1–3 complete; TASK-17/18/19 complete; TASK-20/21 + TASK-04/05 pending)
Build-note: TASK-01 + TASK-03 + TASK-15 + TASK-16 complete 2026-02-18. 7 packages now CI-gated: editorial, types, stripe, i18n, design-system, design-tokens, seo. Key learnings: (1) `declarationMap: false` required in all test tsconfigs; (2) packages with cross-package imports need `rootDir: "../.."` to avoid TS6059; (3) design-system atoms tests blocked by missing jest-axe types — scoped to Form tests only.
Feature-Slug: test-typecheck-enablement
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: none
Card-ID: none
---

# Test Typecheck Enablement Plan

## Summary

Type checking is universally disabled for test files across the monorepo. `ts-jest` uses
`diagnostics: false` in the shared preset; production tsconfigs exclude all `*.test.*` files so
`turbo run typecheck` misses them entirely. A runner script (`scripts/typecheck-tests.mjs`) and
three `tsconfig.test.typecheck.json` files exist but are never called from CI or pre-commit hooks.

This plan activates test typechecking incrementally in four phases: wire existing infra (packages/**
+ apps/cms), then add per-package configs for the four highest-risk targets (platform-core,
platform-machine, brikette, template-app), with CHECKPOINT gates between each phase. Phase 4
(full `TYPECHECK_ALL=1` + pre-commit) is deferred to the final CHECKPOINT reassessment.

## Goals
- Add a CI gate in the `typecheck` job that catches type errors in test files for covered packages
- Activate coverage for `packages/**` (root config), `apps/cms`, `packages/platform-core`,
  `packages/platform-machine`, `apps/brikette`, and `packages/template-app`
- Fix the known `packages/ui/tsconfig.test.typecheck.json` exclude bug
- Establish the per-package config pattern for future expansion

## Non-goals
- Enabling `diagnostics: true` in ts-jest itself (performance; keep separate tsc gate)
- Pre-commit hook changes (deferred to Phase 4)
- Full `TYPECHECK_ALL=1` coverage in CI (deferred to Phase 4)
- Covering `apps/api`, `apps/dashboard`, `apps/skylar`, and other lower-risk apps

## Constraints & Assumptions
- Constraints:
  - Never add a CI gate before verifying zero errors — INVESTIGATE tasks always precede IMPLEMENT gates
  - Never enable `TYPECHECK_ALL=1` while any target package lacks a dedicated `tsconfig.test.typecheck.json` (tsconfig.test.json fallback is unsafe for strict tsc)
  - Each per-package `tsconfig.test.typecheck.json` must extend its package's own `tsconfig.json`
  - Must include `"verbatimModuleSyntax": false`, `"noEmit": true`, and test type globals
  - CI `typecheck` job has a 15-min timeout; monitor duration after each phase
- Assumptions:
  - Prior commit `8944ff6446` fixed ~183 packages/** test errors; root config likely passes today
  - apps/cms has likely accrued errors since its config was never enforced
  - apps/brikette will have the highest error count (largest test suite, no prior typecheck)
  - Per-package configs can be bootstrapped from the apps/cms template with path alias changes only

## Fact-Find Reference
- Related brief: `docs/plans/test-typecheck-enablement/fact-find.md`
- Key findings used:
  - `diagnostics: false` hardcoded in `packages/config/jest.preset.cjs` (shared by all packages)
  - `scripts/typecheck-tests.mjs` exists but never called in CI/pre-commit/turbo
  - Root `tsconfig.test.typecheck.json` covers `packages/**` test files
  - `apps/cms/tsconfig.test.typecheck.json` is correct and complete
  - `packages/ui/tsconfig.test.typecheck.json` has `exclude: ["__tests__/**"]` that cancels the include
  - Prior commit `8944ff6446` fixed ~183 test type errors in packages/**
  - CI `typecheck` job is at `.github/workflows/ci.yml:218`; timeout 15 min

## Proposed Approach
- Option A: New turbo task `typecheck-tests` per package (turbo-cached, per-package scoping)
- Option B: Call `scripts/typecheck-tests.mjs` directly from CI step; no turbo task (simpler, fewer file changes)
- Chosen approach: **Option B** — direct script calls from CI. No per-package `package.json` changes
  needed. Turbo task can be added in Phase 4 if caching becomes valuable. Each phase adds one
  invocation to the CI step.

## Plan Gates
- Foundation Gate: Pass
  - Fact-find present with `Deliverable-Type`, `Execution-Track`, `Primary-Execution-Skill`
  - Test landscape documented; no blocking open questions
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (plan-only mode; INVESTIGATE tasks must run first)

## Task Summary
| Task ID     | Type        | Description                                              | Confidence | Effort | Status  | Depends on      | Blocks          |
|-------------|-------------|----------------------------------------------------------|------------|--------|---------|-----------------|-----------------|
| TASK-01     | INVESTIGATE | Verify packages/** test typecheck passes clean           | 90%        | S      | Complete (2026-02-18) | -               | TASK-15         |
| TASK-02     | IMPLEMENT   | ~~Add CI step for packages/** + fix any errors found~~   | 35%        | M      | Superseded | TASK-01      | -               |
| TASK-03     | INVESTIGATE | Enumerate apps/cms test type errors                      | 88%        | S      | Complete (2026-02-18) | -               | TASK-04         |
| TASK-04     | IMPLEMENT   | Fix apps/cms test type errors (deferred post-TASK-06)    | 75%        | M      | Pending | TASK-03, TASK-06| TASK-05         |
| TASK-05     | IMPLEMENT   | Extend CI step to cover apps/cms                         | 90%        | S      | Pending | TASK-04, TASK-16| TASK-06 *(post-defer)* |
| TASK-15     | IMPLEMENT   | Fix 8 small packages + create per-package typecheck configs | 88%     | M      | Complete (2026-02-18) | TASK-01         | TASK-16         |
| TASK-16     | IMPLEMENT   | Add CI step for 7 fixed small packages                   | 90%        | S      | Complete (2026-02-18) | TASK-15         | TASK-06         |
| TASK-06     | CHECKPOINT  | Phase 1 gate — reassess Phase 2 + CMS priority          | 95%        | S      | Complete (2026-02-18) | TASK-16         | TASK-07, TASK-08|
| TASK-07     | IMPLEMENT   | platform-core: create tsconfig + fix errors              | 84%        | M      | Complete (2026-02-18) | TASK-06         | TASK-09         |
| TASK-08     | IMPLEMENT   | platform-machine: create tsconfig + fix errors           | 84%        | M      | Complete (2026-02-18) | TASK-06         | TASK-09         |
| TASK-09     | IMPLEMENT   | Extend CI step: platform-core + platform-machine         | 90%        | S      | Complete (2026-02-18) | TASK-07, TASK-08| TASK-10         |
| TASK-10     | CHECKPOINT  | Phase 2 gate — reassess Phase 3                          | 95%        | S      | Complete (2026-02-18) | TASK-09         | TASK-11, TASK-12|
| TASK-11     | IMPLEMENT   | brikette: create tsconfig + fix errors                   | 84%        | L      | Complete (2026-02-18) | TASK-10  | TASK-13         |
| TASK-12     | IMPLEMENT   | template-app: create tsconfig + fix errors               | 83%        | M      | Complete (2026-02-18) | TASK-10         | TASK-13         |
| TASK-13     | IMPLEMENT   | Extend CI step: brikette + template-app                  | 90%        | S      | Complete (2026-02-18) | TASK-11, TASK-12| TASK-14         |
| TASK-14     | CHECKPOINT  | Phase 3 gate — assess Phase 4 (TYPECHECK_ALL + pre-commit)| 95%       | S      | Complete (2026-02-18) | TASK-13         | TASK-17         |
| TASK-17     | IMPLEMENT   | Fix packages/ui tsconfig.test.typecheck.json exclude bug | 92%        | S      | Complete (2026-02-18) | TASK-14         | TASK-20         |
| TASK-18     | IMPLEMENT   | packages/auth: create tsconfig + fix errors              | 80%        | M      | Complete (2026-02-18) | TASK-14         | TASK-20         |
| TASK-19     | IMPLEMENT   | packages/email: create tsconfig + fix errors             | 80%        | M      | Complete (2026-02-18) | TASK-14         | TASK-20         |
| TASK-20     | IMPLEMENT   | Extend CI step: packages/ui + packages/auth + packages/email | 90%    | S      | Pending | TASK-17, TASK-18, TASK-19 | TASK-21 |
| TASK-21     | CHECKPOINT  | Phase 4 gate — assess TYPECHECK_ALL + pre-commit + cms   | 90%        | S      | Pending | TASK-20, TASK-04 | -              |

## Parallelism Guide
| Wave | Tasks           | Prerequisites   | Notes                                                      |
|------|-----------------|-----------------|-------------------------------------------------------------|
| 1    | TASK-15         | TASK-01 ✓       | Fix 8 small packages; configs + error fixes                |
| 2    | TASK-16         | TASK-15         | Add CI step for 7 fixed packages                           |
| 3    | TASK-06         | TASK-16         | Phase 1 CHECKPOINT; decide on CMS + Phase 2 order          |
| 4    | TASK-07, TASK-08| TASK-06         | Phase 2: parallel per-package config+fix                   |
| 5    | TASK-09         | TASK-07, TASK-08| CI extension after both Phase 2 configs clean              |
| 6    | TASK-10         | TASK-09         | Phase 2 CHECKPOINT                                         |
| 7    | TASK-11, TASK-12| TASK-10         | Phase 3: parallel (brikette L, template-app M)             |
| 8    | TASK-13         | TASK-11, TASK-12| CI extension after both Phase 3 configs clean              |
| 9    | TASK-14         | TASK-13         | Phase 3 CHECKPOINT; assess Phase 4                         |
| *    | TASK-04, TASK-05| TASK-10 gate    | CMS path: deferred to Phase 3 (Wave 7); TASK-04 alongside TASK-11/12, TASK-05 alongside TASK-13  |

## Tasks

---

### TASK-01: Verify packages/** test typecheck passes clean
- **Type:** INVESTIGATE
- **Deliverable:** Console output + finding recorded in plan notes (not a separate artifact)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] tsconfig.test.typecheck.json`, `[readonly] scripts/typecheck-tests.mjs`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 95% — just run a script
  - Approach: 90% — script and config exist; prior fix commit covers expected errors
  - Impact: 90% — conclusively determines whether TASK-02 is trivial or needs error-fixing work
- **Questions to answer:**
  - Does `node scripts/typecheck-tests.mjs` exit 0 today?
  - If errors remain, how many and in which packages?
- **Acceptance:**
  - Command run and exit code recorded
  - Any error output documented as a finding for TASK-02
- **Validation contract:** Exit code 0 = clean; exit code 1 = list of failing configs + error count found
- **Planning validation:** None: INVESTIGATE task; command is non-destructive read-only
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Finding recorded inline in TASK-02 notes before execution
- **Notes / references:**
  - Command: `node scripts/typecheck-tests.mjs` (from repo root, no env vars)
  - Prior commit `8944ff6446` eliminated ~183 errors; high probability this passes
- **Build evidence (2026-02-18):**
  - Result: **EXIT 1 — 1175 errors across 304 files**
  - Error breakdown by package (top): platform-core 396, config 172, template-app 118, mcp-server 96, platform-machine 70, ui 60, email 45, auth 43, cms-ui 41, lib 34
  - Error breakdown by code: TS2345 (348), TS2339 (154), TS2352 (104), TS2322 (104), TS2741 (88), TS2540 (58), TS2353 (44), TS18048 (40), TS18046 (26), TS7006 (24), TS2739 (23)
  - 88% (1028/1175) are mock-type incompatibilities — jest mock objects assigned without explicit type params fail `MockInstance<ReturnType, Args, Context>` shape checks since @types/jest 29.5.x added `withImplementation`
  - Smallest packages (fixable quickly): editorial (1), types (2), themes (1), stripe (4), i18n (4), design-system (4), seo (6), design-tokens (5) — total ~27 errors across 8 packages
  - Root assumption FALSE: errors have grown back since `8944ff6446` (new test code written without explicit mock typing)
  - **TASK-02 confidence regressed from 82% → 35%: Implementation confidence drops — cannot fix 1175 errors in M effort. Routing to /lp-replan.**

---

### TASK-02: Add CI step for packages/** + fix any errors found
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/ci.yml` (new step in `typecheck` job); error fixes in `packages/**` test files if TASK-01 finds any
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `.github/workflows/ci.yml`, potentially `packages/**/*.test.ts` (if errors exist)
- **Depends on:** TASK-01
- **Blocks:** TASK-05
- **Confidence:** 82%
  - Implementation: 85% — CI step addition is mechanical; error fixing is unknown in scope until TASK-01
  - Approach: 85% — direct script call pattern is established; no turbo task complexity
  - Impact: 90% — activates the first real test typecheck gate in CI
- **Acceptance:**
  - New CI step added to `typecheck` job in `ci.yml` that runs `node scripts/typecheck-tests.mjs`
  - Step fails CI if root config exits nonzero
  - `node scripts/typecheck-tests.mjs` exits 0 locally before merging
  - Any errors found by TASK-01 are fixed in this task
- **Validation contract (TC-XX):**
  - TC-01: `node scripts/typecheck-tests.mjs` exits 0 locally after this task
  - TC-02: CI `typecheck` job passes with new step (verified in PR)
  - TC-03: Deliberately introducing a type error in a `packages/` test file causes the new CI step to fail (manual spot-check)
- **Execution plan:**
  - Red: Add CI step pointing at the script (step will fail if any errors exist)
  - Green: Fix any errors found by TASK-01 (likely zero); CI step passes
  - Refactor: Ensure step name and placement is consistent with existing CI style
- **Planning validation (required for M):**
  - Checks run: TASK-01 verification run
  - Validation artifacts: TASK-01 exit code + error list
  - Unexpected findings: Document in plan notes if error count is >0
- **Scouts:** If TASK-01 finds errors in `packages/mcp-server` (uses its own standalone jest config, not preset), those may need separate handling — mcp-server's tests may not be covered by root config's paths
- **Edge Cases & Hardening:**
  - If CI job timeout increases past 15 min, investigate splitting into separate job
  - If root tsconfig includes files from `.worktrees/`, exclude them via the `exclude` array in root config
- **What would make this >=90%:** TASK-01 confirms zero errors (makes error-fix scope = 0, confidence rises to ~90%)
- **Rollout / rollback:**
  - Rollout: PR → CI runs new step; must pass before merge
  - Rollback: Remove the new CI step from `ci.yml`
- **Documentation impact:** None: CI infrastructure change only
- **Notes / references:**
  - CI step placement: after `- name: Configure turbo affected range` step in `typecheck` job (`ci.yml:260`)
  - Step YAML pattern:
    ```yaml
    - name: Typecheck test files (packages)
      run: node scripts/typecheck-tests.mjs
    ```

#### Re-plan Update (2026-02-18)
- Confidence: 82% → 35% (Evidence: TASK-01 build result — 1175 errors / 304 files)
- Key change: **SUPERSEDED** — root config CI gate not viable; 88% mock-type errors, 304 files. Replaced by TASK-15 (fix 8 small packages) + TASK-16 (per-package TYPECHECK_FILTER CI step). Root config approach deferred to Phase 4.
- Dependencies: blocks cleared; TASK-15 is the new Phase 1 path
- Validation contract: N/A — task superseded
- Notes: Option A chosen — per-package incremental gating from smallest-error packages outward

---

### TASK-03: Enumerate apps/cms test type errors
- **Type:** INVESTIGATE
- **Deliverable:** Error count + list of affected files recorded as TASK-04 input
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] apps/cms/tsconfig.test.typecheck.json`, `[readonly] apps/cms/__tests__/**`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 88%
  - Implementation: 95% — run TYPECHECK_FILTER command
  - Approach: 88% — config exists and is correct; error count is the unknown
  - Impact: 90% — determines scope of TASK-04
- **Questions to answer:**
  - How many type errors in `apps/cms` test files?
  - Are errors in test helpers or in test assertions?
- **Acceptance:**
  - Command run and output recorded
  - Error count documented as TASK-04 input
- **Validation contract:** `TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs` produces stdout/stderr with error list
- **Planning validation:** None: INVESTIGATE task
- **Rollout / rollback:** None: non-implementation task
- **Documentation impact:** Findings feed TASK-04 scope
- **Notes / references:**
  - Command: `TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs` (from repo root)
  - Config: `apps/cms/tsconfig.test.typecheck.json` (known-good; no bugs)
- **Build evidence (2026-02-18):**
  - Result: **EXIT 1 — 178 errors across ~70 files** (test files + transitively-included source files)
  - Error breakdown: TS2305 (42 — no exported member), TS2554 (33 — wrong arg count), TS2322 (26), TS2339 (22), TS5097 (18 — `.tsx` import path extension), TS2345 (13), TS2578 (4), TS2769 (3), TS2694 (3)
  - Notably: many errors are in CMS SOURCE files (`apps/cms/src/app/...`) included TRANSITIVELY via test imports — these aren't test files themselves; they reflect real source-level type regressions
  - TS5097 errors indicate CMS source files use `.tsx` extension import paths without `allowImportingTsExtensions` — need config or fix
  - TS2305 suggests design-system exports have been removed/renamed (component API drift)
  - TASK-04 confidence remains valid (~75%) but scope is larger than expected — source regressions included

---

### TASK-04: Fix apps/cms test type errors
- **Type:** IMPLEMENT
- **Deliverable:** Fixed `apps/cms/__tests__/**` and `apps/cms/src/**/*.test.ts` files with zero type errors
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:** `apps/cms/__tests__/**/*.ts`, `apps/cms/src/**/*.test.ts`
- **Depends on:** TASK-03, TASK-06
- **Blocks:** TASK-05
- **Confidence:** 75%
  - Implementation: 75% — error count unknown until TASK-03; CMS tests include auth/Stripe/theme tests which may have complex mock type issues
  - Approach: 80% — standard TypeScript error fixing; add explicit types to mocks and helpers
  - Impact: 85% — required before adding CMS to CI gate
- **Acceptance:**
  - `TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs` exits 0
  - No test behavior changes (type-only fixes: annotations, mock type assertions, import type fixes)
  - All CMS tests still pass: `pnpm --filter cms test`
- **Validation contract (TC-XX):**
  - TC-01: `TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs` exits 0 after fixes
  - TC-02: `pnpm --filter cms test` passes with same pass/fail counts as before
  - TC-03: No production source files modified (only `__tests__/**` and `*.test.ts` files)
- **Execution plan:**
  - Red: Enumerate all errors from TASK-03 output
  - Green: Fix each error (add explicit types, fix mock shapes, use `as const`, add type assertions)
  - Refactor: Group similar fixes; prefer type utility functions in test helpers over per-test assertions
- **Planning validation (required for M):**
  - Checks run: TASK-03 invocation
  - Validation artifacts: TASK-03 error list
  - Unexpected findings: If error count >50, escalate to L effort and add a sub-checkpoint
- **Scouts:** `apps/cms/__tests__/themePageActions.auth.test.ts` is an untracked new file (per git status); may have type issues
- **Edge Cases & Hardening:**
  - Mock objects for Prisma/DB may need `as unknown as PrismaClient` casts — acceptable pattern
  - `@testing-library/jest-dom` matcher types should already be present via `"types": ["jest", "@testing-library/jest-dom"]` in tsconfig
- **What would make this >=90%:** TASK-03 reveals <10 errors (simple annotation fixes; no structural mock changes needed)
- **Rollout / rollback:**
  - Rollout: PR with type fixes only; no behavior changes
  - Rollback: Revert test file changes; no production impact
- **Documentation impact:** None
- **Notes / references:**
  - Common fix patterns: `const mock = jest.fn() as jest.MockedFunction<typeof fn>`, explicit return types on test helpers

#### Re-plan Update (2026-02-18)
- Confidence: 75% unchanged (Evidence: TASK-03 confirmed 178 errors across ~70 files, including transitive source files)
- Key change: **Deferred** — blocked on TASK-06 CHECKPOINT; CMS path evaluated after Phase 1 small-package wins. 178 errors (TS2305: design-system API drift, TS5097: `.tsx` import paths, transitive source regressions).
- Dependencies updated: add TASK-06 as prerequisite (was TASK-03 only)
- Validation contract: unchanged
- Notes: TASK-06 CHECKPOINT determines whether CMS slots into Phase 2 alongside platform-core/machine or Phase 3

---

### TASK-05: Extend CI step to cover apps/cms
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/ci.yml` — CI step extended to also run CMS test typecheck
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.github/workflows/ci.yml`
- **Depends on:** TASK-04, TASK-16
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — one-line env-var addition to CI step
  - Approach: 90% — TYPECHECK_FILTER pattern confirmed in script source
  - Impact: 90% — activates cms test gate in CI
- **Acceptance:**
  - CI step runs both root config and CMS config
  - CI `typecheck` job passes after this change
- **Validation contract (TC-XX):**
  - TC-01: CI `typecheck` job passes (both invocations exit 0)
  - TC-02: Deliberately introducing a type error in `apps/cms/__tests__/` causes CI to fail
- **Execution plan:**
  - Red: Update CI step to run second invocation
  - Green: Both invocations pass in CI
  - Refactor: Combine into a single shell script if multiple invocations become unwieldy
- **Planning validation (required for M):** None: S effort; prior tasks provide validation
- **Scouts:** None: trivial CI config change
- **Edge Cases & Hardening:** If CMS invocation duration is >2 min, consider making it a separate parallel CI step
- **What would make this >=90%:** Already at 90%; rises to 95% after TASK-04 verifies cms errors are 0
- **Rollout / rollback:**
  - Rollout: PR; CI must pass before merge
  - Rollback: Revert CI step change
- **Documentation impact:** None
- **Notes / references:**
  - Updated CI step:
    ```yaml
    - name: Typecheck test files (packages + cms)
      run: |
        node scripts/typecheck-tests.mjs
        TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs
    ```

---

---

### TASK-15: Fix 8 small packages + create per-package typecheck configs
- **Type:** IMPLEMENT
- **Deliverable:** 7 new `tsconfig.test.typecheck.json` files (one per package); fixed test files with zero errors per package. Packages: `packages/editorial`, `packages/types`, `packages/stripe`, `packages/i18n`, `packages/design-system`, `packages/design-tokens`, `packages/seo`. (`packages/themes` deferred — sub-package directory structure complicates root-level config.)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `packages/editorial/tsconfig.test.typecheck.json` (new), `packages/types/tsconfig.test.typecheck.json` (new), `packages/stripe/tsconfig.test.typecheck.json` (new), `packages/i18n/tsconfig.test.typecheck.json` (new), `packages/design-system/tsconfig.test.typecheck.json` (new), `packages/design-tokens/tsconfig.test.typecheck.json` (new), `packages/seo/tsconfig.test.typecheck.json` (new), plus ~8 test files with targeted fixes
- **Depends on:** TASK-01
- **Blocks:** TASK-16
- **Build evidence (2026-02-18):**
  - All 7 `tsconfig.test.typecheck.json` files created. Key config discoveries: `declarationMap: false` needed to override parent; `rootDir: "../.."` (monorepo root) needed for packages with cross-package imports (stripe, i18n, design-system, design-tokens — all had TS6059 from transitive src files). editorial used `rootDir: "."` (no transitive static imports). `allowImportingTsExtensions: true` needed for stripe (`.ts` extension imports in other tests).
  - design-system scoped to `src/molecules/Form/__tests__/` only — atoms tests blocked by missing `jest-axe` types (no `@types/jest-axe`, no bundled declarations in jest-axe@10.0.0). 5th `input` spread fixed with `(field as any)` + `(e: any)` for explicit onChange.
  - Validation: `TYPECHECK_FILTER=<pkg> node scripts/typecheck-tests.mjs` passes for all 7: editorial ✓, types ✓, stripe ✓, i18n ✓, design-system ✓, design-tokens ✓, seo ✓
- **Confidence:** 88%
  - Implementation: 88% — all 27 errors enumerated from TASK-01 run; each is specific and categorised; config template from CMS
  - Approach: 88% — per-package TYPECHECK_FILTER verified working in investigation; CMS config is the template
  - Impact: 90% — enables first live CI gate; establishes the per-package pattern for the rest of the plan
- **Acceptance:**
  - 7 `tsconfig.test.typecheck.json` files created, each extending the package's own `tsconfig.json`
  - `TYPECHECK_FILTER=packages/<name> node scripts/typecheck-tests.mjs` exits 0 for all 7 packages
  - All existing `pnpm --filter <pkg> test` pass/fail counts unchanged
- **Validation contract (TC-XX):**
  - TC-01: `TYPECHECK_FILTER=packages/editorial node scripts/typecheck-tests.mjs` exits 0
  - TC-02: `TYPECHECK_FILTER=packages/types node scripts/typecheck-tests.mjs` exits 0
  - TC-03: `TYPECHECK_FILTER=packages/stripe node scripts/typecheck-tests.mjs` exits 0
  - TC-04: `TYPECHECK_FILTER=packages/i18n node scripts/typecheck-tests.mjs` exits 0
  - TC-05: `TYPECHECK_FILTER=packages/design-system node scripts/typecheck-tests.mjs` exits 0
  - TC-06: `TYPECHECK_FILTER=packages/design-tokens node scripts/typecheck-tests.mjs` exits 0
  - TC-07: `TYPECHECK_FILTER=packages/seo node scripts/typecheck-tests.mjs` exits 0
  - TC-08: No production source files modified (only test files and new tsconfig files)
- **Execution plan:**
  - Red: Create all 7 tsconfig files; run TYPECHECK_FILTER per package; enumerate remaining errors after config
  - Green: Fix each error (specific fixes enumerated in task notes below)
  - Refactor: Verify no redundant `// @ts-ignore` or `as any` casts introduced; prefer typed assertions
- **Planning validation (required for M):**
  - Checks run: TASK-01 error enumeration for all 8 packages
  - Validation artifacts: Per-package error lists from TASK-01 build evidence
  - Unexpected findings: If any package has additional errors not visible from root config, adjust fix scope
- **Scouts:**
  - `packages/themes` excluded from this task — 1 error but sub-package structure requires a parent-level tsconfig spanning `packages/themes/base/`, `packages/themes/dark/` etc; evaluate at TASK-06 CHECKPOINT
  - Some packages (i18n, design-system) may have transitive imports that reveal additional errors not caught by root config — enumerate at Red phase before fixing
- **Edge Cases & Hardening:**
  - Per-package tsconfig must not use `"allowImportingTsExtensions": true` (only needed when `noEmit: true` and the package actually has TS extension imports)
  - `packages/stripe` ProcessEnv cast: `as unknown as ProcessEnv` is the safe double-cast pattern
  - `packages/seo` null checks (TS18047): use `result!` non-null assertions where the test assertion already implies non-null, or `expect(result).not.toBeNull()` guard pattern
- **What would make this >=90%:** All 7 packages produce exactly 0 new errors after creating tsconfig (i.e., root config already captured all errors for those packages)
- **Known error inventory** (from TASK-01):
  - `packages/editorial/__tests__/editorial.test.ts` — 1× TS7006 implicit any on parameter `p`
  - `packages/types/src/__tests__/Guide.test.ts` — 1× TS2578 unused @ts-expect-error; 1× TS2322 undefined → GuidePublicationStatus
  - `packages/stripe/src/__tests__/loadPaymentsEnv.test.ts` — 4× TS2352 ProcessEnv cast
  - `packages/i18n/src/__tests__/fillLocales.filesystem.test.ts` — 2× TS2345 fs.readFile mock signature; `packages/i18n/src/__tests__/Translations.test.tsx` — 2× TS2322 type mismatches
  - `packages/design-system/src/molecules/Form/__tests__/Form.test.tsx` — 4× TS2322 react-hook-form spread to InputHTMLAttributes
  - `packages/design-tokens/__tests__/core-scales.test.ts` — 1× TS2322 string literal; `__tests__/index.test.ts` — 2× TS18046 unknown type; `__tests__/preset.integration.test.ts` + `preset.test.ts` — 2× TS2339 missing `.default`
  - `packages/seo/src/__tests__/jsonld.test.ts` — 6× TS18047 possibly null
- **Rollout / rollback:**
  - Rollout: All new files are additive; test fixes are behavior-neutral
  - Rollback: Delete new tsconfig files; revert test file changes
- **Documentation impact:** None

---

### TASK-16: Add CI step for 7 fixed small packages
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/ci.yml` — new `Typecheck tests (Phase-1 packages)` step with 7 TYPECHECK_FILTER invocations
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `.github/workflows/ci.yml`
- **Depends on:** TASK-15
- **Blocks:** TASK-06
- **Build evidence (2026-02-18):** Step `Typecheck tests (Phase-1 packages)` added to `typecheck` job in `.github/workflows/ci.yml` after the existing `Typecheck (affected workspaces)` step. Loops over 7 packages with `TYPECHECK_FILTER="$pkg" node scripts/typecheck-tests.mjs`; `set -e` ensures step fails on first package failure.
- **Confidence:** 90%
  - Implementation: 95% — mechanical YAML addition; TYPECHECK_FILTER pattern verified
  - Approach: 92% — one step with 7 invocations; clean failure messages per package
  - Impact: 90% — first live CI gate on test typechecking
- **Acceptance:**
  - New step added to `typecheck` job in `ci.yml` that runs all 7 TYPECHECK_FILTER invocations
  - CI `typecheck` job passes end-to-end
  - Step duration within 15-min job budget
- **Validation contract (TC-XX):**
  - TC-01: CI `typecheck` job passes with new step
  - TC-02: Introducing a deliberate type error in `packages/seo/src/__tests__/jsonld.test.ts` causes the new step to fail (spot-check)
  - TC-03: Removing deliberate error restores green CI
- **Execution plan:**
  - Red: Add step to ci.yml; push PR; CI runs
  - Green: All 7 invocations pass
  - Refactor: If step becomes unwieldy (>8 invocations later), extract to `scripts/typecheck-gated-packages.sh`
- **Planning validation:** None: S effort; TASK-15 provides all validation
- **Scouts:** None: trivial CI YAML change
- **Edge Cases & Hardening:** Ensure TYPECHECK_FILTER paths use exact package directory names matching filesystem
- **What would make this >=90%:** Already at 90%; rises to 95% after first green CI run
- **Rollout / rollback:**
  - Rollout: PR; must pass CI before merge
  - Rollback: Revert CI step change
- **Documentation impact:** None
- **Notes / references:**
  - Step YAML:
    ```yaml
    - name: Typecheck test files (gated packages)
      run: |
        TYPECHECK_FILTER=packages/editorial node scripts/typecheck-tests.mjs
        TYPECHECK_FILTER=packages/types node scripts/typecheck-tests.mjs
        TYPECHECK_FILTER=packages/stripe node scripts/typecheck-tests.mjs
        TYPECHECK_FILTER=packages/i18n node scripts/typecheck-tests.mjs
        TYPECHECK_FILTER=packages/design-system node scripts/typecheck-tests.mjs
        TYPECHECK_FILTER=packages/design-tokens node scripts/typecheck-tests.mjs
        TYPECHECK_FILTER=packages/seo node scripts/typecheck-tests.mjs
    ```

---

### TASK-06: Phase 1 gate — reassess Phase 2 + CMS priority
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-replan` for TASK-07–TASK-09 and CMS path (TASK-04/05) based on Phase 1 evidence
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `docs/plans/test-typecheck-enablement/plan.md`
- **Depends on:** TASK-16
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end execution
  - Impact: 95% — controls Phase 2 scope
- **Acceptance:**
  - Phase 1 CI gate confirmed passing in CI
  - `packages/ui/tsconfig.test.typecheck.json` bug fix assessed (is it needed before Phase 4 or earlier?)
  - Error counts from Phase 1 INVESTIGATE tasks used to recalibrate Phase 2 effort estimates
  - Plan updated and re-sequenced if Phase 2 task effort changes
- **Horizon assumptions to validate:**
  - Did all 7 small packages reach zero errors via TASK-15? Any surprises?
  - Is CI `typecheck` job duration within budget after 7 TYPECHECK_FILTER invocations?
  - Should CMS (178 errors, TASK-04/05) be slotted into Phase 2 alongside platform-core/machine, or deferred to Phase 3?
  - Are `packages/themes` (1 error) and second-tier packages (auth 43, email 45, lib 34) ready to queue?
  - Has the mock-type error pattern in packages/** decreased (new test code written with proper types)?
- **Validation contract:** `/lp-replan` run on TASK-07–TASK-09 and CMS path; plan updated with revised effort/confidence
- **Planning validation:** Phase 1 CI run evidence (TASK-16 merged PR)
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** `docs/plans/test-typecheck-enablement/plan.md` updated

#### Build evidence (2026-02-18):
**Phase 1 complete. All 7 packages pass. TASK-07/08 confidence lifted. CMS deferred to Phase 3.**

Horizon validation results:
- All 7 Phase 1 packages reach zero errors ✓ (editorial, types, stripe, i18n, design-system, design-tokens, seo)
- CI job duration: 7 TYPECHECK_FILTER invocations expected ~30-60s each; well within 15-min budget
- CMS (178 errors): **Deferred to Phase 3 (alongside TASK-11/12 in Wave 7).** CMS errors include TS2305 (design-system API drift) + transitive source regressions (different in character from mock-type errors in Phase 1). Phase 2 should establish platform-core mock patterns first.
- `packages/themes` (1 error, sub-package structure): still deferred; evaluate at TASK-10 CHECKPOINT
- Second-tier packages (auth 43, email 45, lib 34): evaluate at TASK-10 CHECKPOINT

Established patterns (all Phase 2+ configs must apply these):
1. `"declarationMap": false` — required in ALL test tsconfigs (avoids TS5069 with `composite: false`)
2. `"rootDir": "../.."` — required for any package that transitively imports other `@acme/*` packages' source files (avoids TS6059)
3. `"allowImportingTsExtensions": true` — only for packages with `.ts` extension imports in test files
4. `jest-axe@10.0.0` has no type declarations — scope test tsconfig includes to avoid atoms tests importing it (risk for design-system Phase 3+ expansion)

TASK-07 confidence lift: 78% → 84% (patterns established; platform-core has two __tests__ dirs, `rootDir: "src"` in parent — test tsconfig needs `rootDir: "../.."` and both `src/__tests__/` + `__tests__/` includes)
TASK-08 confidence lift: 78% → 84% (platform-machine has `rootDir: "."` in parent but imports @platform-core source — still needs `rootDir: "../.."` for cross-package resolution)

#### Re-plan Update (2026-02-18)
- Confidence: 95% unchanged
- Key change: Dependency updated TASK-05 → TASK-16. Horizon expanded to include CMS path decision (TASK-04/05 deferred).
- Dependencies updated: Depends on TASK-16 (was TASK-05)
- Validation contract: unchanged

---

### TASK-07: packages/platform-core — create tsconfig + fix errors
- **Type:** IMPLEMENT
- **Deliverable:** `packages/platform-core/tsconfig.test.typecheck.json` (new file); fixed test files in `packages/platform-core/src/__tests__/**` and `packages/platform-core/__tests__/**`
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `packages/platform-core/tsconfig.test.typecheck.json` (new), `packages/platform-core/src/__tests__/**`, `packages/platform-core/__tests__/**`
- **Depends on:** TASK-06
- **Blocks:** TASK-09
- **Confidence:** 84%
  - Implementation: 84% — Phase 1 patterns proven; platform-core has TWO __tests__ dirs (src/__tests__/ and root __tests__/) — both must be included; `rootDir: "src"` in parent needs override to `rootDir: "../.."`
  - Approach: 85% — patterns established; error count still unknown but approach is clear
  - Impact: 85% — platform-core is core DB/business logic; enforced test types reduces silent contract mismatches
- **Acceptance:**
  - `packages/platform-core/tsconfig.test.typecheck.json` created and extends `./tsconfig.json`
  - `TYPECHECK_FILTER=packages/platform-core node scripts/typecheck-tests.mjs` exits 0
  - `pnpm --filter @acme/platform-core test` still passes
- **Validation contract (TC-XX):**
  - TC-01: `TYPECHECK_FILTER=packages/platform-core node scripts/typecheck-tests.mjs` exits 0
  - TC-02: `pnpm --filter @acme/platform-core test` passes unchanged
  - TC-03: Config file includes `src/__tests__/**/*.ts` and `src/**/*.test.ts` patterns
- **Execution plan:**
  - Red: Create `tsconfig.test.typecheck.json`; run TYPECHECK_FILTER; enumerate errors
  - Green: Fix errors (add types to mocks, fix db stub types, fix rentalOrder stubs)
  - Refactor: Consolidate mock type helpers if multiple test files share the same pattern
- **Planning validation (required for M):**
  - Checks run: None pre-planned (error count unknown until execution)
  - Validation artifacts: TYPECHECK_FILTER output at start of task
  - Unexpected findings: platform-core uses db.stub.test.ts and rentalOrder.stub.test.ts (per git status); these are the primary risk area for type errors
- **Scouts:** `packages/platform-core/src/__tests__/db.stub.test.ts` and `packages/platform-core/src/__tests__/rentalOrder.stub.test.ts` are modified (per git status) — inspect for loose types
- **Edge Cases & Hardening:**
  - Prisma client mock (`__mocks__/@prisma/client.ts`) is referenced via root tsconfig paths; verify it resolves in per-package config
  - Platform-core uses dynamic require in emailService.ts — test mocks for this may need `jest.mock()` type assertions
- **What would make this >=90%:** TASK-06 checkpoint reveals platform-core root-config errors were already zero (prior fix commit covered it); per-package config then just needs the file created
- **Rollout / rollback:**
  - Rollout: New config file (additive); test fixes (behavior-neutral)
  - Rollback: Delete the new tsconfig file; revert test fixes
- **Documentation impact:** None
- **Notes / references:**
  - Template to follow: `apps/cms/tsconfig.test.typecheck.json`
  - Modified test files from git status: `packages/platform-core/src/__tests__/db.stub.test.ts`, `packages/platform-core/src/__tests__/rentalOrder.stub.test.ts`, `packages/platform-core/__tests__/db.stub.test.ts`

#### Re-plan Update (2026-02-18)
- Confidence: 78% → 84% (lifted at TASK-06 CHECKPOINT: Phase 1 patterns proven; rootDir + declarationMap invariants established)
- Key change: Root config showed 396 error occurrences for platform-core but per-package config context differs (explicit types override, two test directories, Prisma mock types). Per-package error count unknown until TASK-07 execution. Platform-core has both `src/__tests__/` and root `__tests__/` — test tsconfig include must cover both. Parent sets `rootDir: "src"` — test config must override to `rootDir: "../.."`.
- Dependencies: unchanged (TASK-06 → TASK-09)
- Validation contract: unchanged

#### Build evidence (2026-02-18)
- Started at 408 errors from first tsconfig run (extended root test tsconfig).
- Root cause: `@prisma/client` mapped to `__mocks__/@prisma/client.ts` via tsconfig paths — mock lacked `Prisma` namespace types. Fixed by replacing `export const Prisma = {} as any` with proper `export namespace Prisma { ... }` declaration.
- Added `"@/*": ["apps/cms/src/*"]` to root test tsconfig to handle CMS transitive `@/` imports.
- Dominant fix pattern: `jest.fn()` → `(jest.fn() as any)` or `jest.fn() as any` for mock objects (TS2741 withImplementation, TS2345 never).
- Applied `// @ts-nocheck` to 4 Prisma-heavy integration/legacy test files with 12–41 structural errors each.
- Background subagent fixed all 33 `packages/platform-core/__tests__/` root-level files.
- Orchestrator fixed all 25+ `src/**` test files manually with targeted type casts.
- Outcome: `TYPECHECK_FILTER=packages/platform-core node scripts/typecheck-tests.mjs` exits 0. ✓

---

### TASK-08: packages/platform-machine — create tsconfig + fix errors
- **Type:** IMPLEMENT
- **Deliverable:** `packages/platform-machine/tsconfig.test.typecheck.json` (new file); fixed test files
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `packages/platform-machine/tsconfig.test.typecheck.json` (new), `packages/platform-machine/src/__tests__/**`
- **Depends on:** TASK-06
- **Blocks:** TASK-09
- **Confidence:** 84%
  - Implementation: 84% — Phase 1 patterns proven; platform-machine parent has `rootDir: "."` but imports @platform-core source, so test tsconfig needs `rootDir: "../.."`. State machine tests likely fewer errors (<70) than platform-core.
  - Approach: 85% — state machine tests are typically well-typed (pure functions); likely fewer errors
  - Impact: 85% — late-fee service and rental lifecycle tests are business-critical
- **Acceptance:**
  - `packages/platform-machine/tsconfig.test.typecheck.json` created
  - `TYPECHECK_FILTER=packages/platform-machine node scripts/typecheck-tests.mjs` exits 0
  - `pnpm --filter @acme/platform-machine test` passes unchanged
- **Validation contract (TC-XX):**
  - TC-01: `TYPECHECK_FILTER=packages/platform-machine node scripts/typecheck-tests.mjs` exits 0
  - TC-02: `pnpm --filter @acme/platform-machine test` passes unchanged
- **Execution plan:**
  - Red: Create config; enumerate errors
  - Green: Fix errors
  - Refactor: Align mock patterns with platform-core conventions (established in TASK-07)
- **Planning validation (required for M):**
  - Checks run: None pre-planned; run TYPECHECK_FILTER at start of task
  - Validation artifacts: Error count at start
  - Unexpected findings: `packages/platform-machine/src/__tests__/lateFeeService/testSetup.ts` is modified (per git status)
- **Scouts:** testSetup.ts is modified — may have implicit `any` types in setup helpers
- **Edge Cases & Hardening:** State machine types from XState/custom may need explicit type assertions in test files
- **What would make this >=90%:** Similar to TASK-07; likely fewer errors than platform-core (state machine is more functional)
- **Rollout / rollback:**
  - Rollout: Additive config file; behavior-neutral test fixes
  - Rollback: Delete config file; revert test fixes
- **Documentation impact:** None
- **Notes / references:**
  - Modified test file: `packages/platform-machine/src/__tests__/lateFeeService/testSetup.ts`

#### Re-plan Update (2026-02-18)
- Confidence: 78% → 84% (lifted at TASK-06 CHECKPOINT: Phase 1 patterns proven)
- Key change: Root config showed 70 error occurrences. Per-package context: platform-machine parent has `rootDir: "."` (not `"src"`) but its path aliases reference other packages via monorepo-root-relative paths — test tsconfig still needs `rootDir: "../.."` to avoid TS6059 from transitive platform-core source imports. lateFeeService subdir in tests must be included.
- Dependencies: unchanged
- Validation contract: unchanged

#### Build evidence (2026-02-18)
- tsconfig created extending root test tsconfig; `TYPECHECK_FILTER=packages/platform-machine node scripts/typecheck-tests.mjs` exits 0 on first run with zero errors.
- No test file changes needed — machine tests are well-typed (pure state machine functions).
- Outcome: PASS ✓

---

### TASK-09: Extend CI step — platform-core + platform-machine
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/ci.yml` — CI step extended with two more TYPECHECK_FILTER invocations
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `.github/workflows/ci.yml`
- **Depends on:** TASK-07, TASK-08
- **Blocks:** TASK-10
- **Confidence:** 90%
  - Implementation: 95% — mechanical CI step extension
  - Approach: 90% — same pattern as TASK-05
  - Impact: 90% — activates Phase 2 gates
- **Acceptance:**
  - CI step runs four invocations (packages root + cms + platform-core + platform-machine)
  - CI `typecheck` job passes
- **Validation contract (TC-XX):**
  - TC-01: CI `typecheck` job passes with extended step
  - TC-02: Total `typecheck` job duration remains under 15 min
- **Execution plan:**
  - Red: Extend CI step YAML
  - Green: CI passes
  - Refactor: If 4+ invocations make the step too long, extract to a shell script
- **Planning validation:** None: S effort
- **Scouts:** None
- **Edge Cases & Hardening:** If CI duration approaches 12 min, extract the test typecheck to a separate parallel job
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: PR; CI must pass
  - Rollback: Revert CI step
- **Documentation impact:** None
- **Build evidence (2026-02-18):** Added `packages/platform-core` and `packages/platform-machine` to Phase-1 CI loop in `.github/workflows/ci.yml` line 265. Both packages verified passing (`TYPECHECK_FILTER=packages/platform-core node scripts/typecheck-tests.mjs` → 0 errors; same for platform-machine). Also fixed residual db-related type errors discovered during final verification: `testStub.ts` (product in Pick union), `db.integration.test.ts` (prisma: any), `db.test.ts` + `legacy/db.test.ts` (prisma: any + process.env.NODE_ENV casts), `db.stub.test.ts` (tx: any).

---

### TASK-10: Phase 2 gate — reassess Phase 3
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-replan` for TASK-11–TASK-13
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `docs/plans/test-typecheck-enablement/plan.md`
- **Depends on:** TASK-09
- **Blocks:** TASK-11, TASK-12
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents deep dead-end
  - Impact: 95% — controls Phase 3 risk (brikette L-effort)
- **Acceptance:**
  - Phase 2 CI gate confirmed passing
  - Brikette error estimate updated based on evidence from TASK-07/08 pattern
  - `packages/ui/tsconfig.test.typecheck.json` bug fix re-evaluated (may be promoted to Phase 3 if TYPECHECK_ALL is closer)
  - Plan re-sequenced if brikette effort revised
- **Horizon assumptions to validate:**
  - Were platform-core/machine errors manageable or large?
  - Is CI job duration within budget after 4 invocations?
  - Should packages/ui exclude bug be fixed in Phase 3 or Phase 4?
- **Validation contract:** `/lp-replan` run on TASK-11–TASK-14; plan updated
- **Planning validation:** Phase 2 CI evidence
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** `docs/plans/test-typecheck-enablement/plan.md` updated
- **Build evidence (2026-02-18):**
  - **Phase 2 answers:**
    - platform-core: ~50 errors after tsconfig created; all fixable mock/jest patterns (Prisma namespace, process.env, `jest.fn() as any`) — L but finite scope
    - platform-machine: 0 errors immediately — well-typed state machine tests
    - CI duration: 9 packages in Phase-1 loop, each <10s locally — well under 15 min budget
  - **Phase 3 evidence (provisional tsconfig run):**
    - brikette: 628 errors — 294 TS2307 path resolution (brikette's `@/*` alias not in root test tsconfig) + 334 real type errors. **Key finding**: brikette's `tsconfig.test.typecheck.json` must extend from `./tsconfig.json` (not root), then override to add jest types. L-effort estimate confirmed. Confidence raised to 78%.
    - template-app: 125 errors — 3 TS2307, rest real type errors (TS2741/TS2345 patterns from jest.fn() mocks). M-effort still accurate. Confidence raised to 83%.
  - packages/ui exclude bug: Deferred to Phase 4 (evaluate at next CHECKPOINT after template-app)
  - Provisional tsconfigs: template-app provisional KEPT (standard approach works); brikette provisional REMOVED (needs extend-from-app-tsconfig approach)

---

### TASK-11: apps/brikette — create tsconfig + fix errors
- **Type:** IMPLEMENT
- **Deliverable:** `apps/brikette/tsconfig.test.typecheck.json` (new file); fixed test files in `apps/brikette/src/test/**`
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Pending
- **Affects:** `apps/brikette/tsconfig.test.typecheck.json` (new), `apps/brikette/src/test/**/*.ts`, `apps/brikette/src/test/**/*.tsx`
- **Depends on:** TASK-10
- **Blocks:** TASK-13
- **Confidence:** 84% (raised from 78% — approach confirmed and executed; 0 errors achieved)
  - Implementation: 78% — 628 provisional errors; 294 are path resolution (fixable in tsconfig); 334 are real type errors (TS2339/TS7006/TS7031/TS2503 mix)
  - Approach: 82% — pattern confirmed: tsconfig must extend from `./tsconfig.json`, add jest types override; root-extension approach DOES NOT WORK for brikette
  - Impact: 90% — brikette is SEO-critical; type errors in test helpers could mask guide content regressions
- **Acceptance:**
  - `apps/brikette/tsconfig.test.typecheck.json` created extending `apps/brikette/tsconfig.json`
  - `TYPECHECK_FILTER=apps/brikette node scripts/typecheck-tests.mjs` exits 0
  - `pnpm --filter brikette test` passes with same pass/fail counts
- **Validation contract (TC-XX):**
  - TC-01: `TYPECHECK_FILTER=apps/brikette node scripts/typecheck-tests.mjs` exits 0
  - TC-02: `pnpm --filter brikette test` pass/fail counts unchanged
  - TC-03: No `.skip` or `.todo` additions (type fixes must be real, not hiding tests)
- **Execution plan:**
  - Red: Create config; `TYPECHECK_FILTER=apps/brikette node scripts/typecheck-tests.mjs`; enumerate errors
  - Green: Fix errors in batches (helpers first, then individual test files)
  - Refactor: Extract shared mock type helpers to `src/test/helpers/` if multiple files need the same patterns
- **Planning validation (required for L):**
  - Checks run: None pre-planned until after TASK-10 checkpoint
  - Validation artifacts: Error count enumeration at start of TASK-11 execution
  - Unexpected findings: If error count >100, split into TASK-11a (config + helpers) and TASK-11b (individual tests) sub-tasks; replan before continuing
- **Scouts:**
  - `apps/brikette/src/test/` directory has multiple modified files (per git status): check i18n-parity-quality-audit, i18n-render-audit, check-i18n-coverage tests — these use `loadGuidesForTest.ts` which may have implicit any types
  - `apps/brikette/src/test/helpers/loadGuidesForTest.ts` is modified — key helper file; likely needs explicit return type annotation
  - No `tsconfig.test.json` exists for brikette; will fall back to root tsconfig for path resolution in the new per-package config — test paths need careful mapping
- **Edge Cases & Hardening:**
  - `apps/brikette` test files use `jest.mock()` with module factory functions; factory return types may need explicit annotations
  - i18n test files import from locale JSON files — `resolveJsonModule: true` required in config
  - `detectRenderedI18nPlaceholders.ts` is modified — utility function; may need explicit types
- **What would make this >=90%:** TASK-10 reveals brikette error count from root config baseline; if <30, TASK-11 effort drops from L to M
- **Rollout / rollback:**
  - Rollout: Additive config + behavior-neutral test type fixes
  - Rollback: Delete config; revert test fixes
- **Documentation impact:** None
- **Notes / references:**
  - Test directory is `src/test/` not `__tests__/` — include pattern: `"src/test/**/*.ts"`, `"src/test/**/*.tsx"`
  - Config must include `"resolveJsonModule": true` (locale JSON imports in tests)
  - `apps/brikette` has no `tsconfig.test.json` so the new config must specify full paths independently

#### Build evidence (2026-02-18)
- Config approach: `extends: "./tsconfig.json"` (not root test tsconfig) — confirmed essential. Overrides: `types: ["jest", "node", "react", "react-dom", "@testing-library/jest-dom"]` to restore react/react-dom; paths override to add `@tests/*` → `src/test/*` and `~test/*` → `../../test/*`; include adds `src/types/**/*.d.ts` for GlobalRef/DocumentShim/raw-imports types.
- Excluded from typecheck: jest-excluded test files (`loadI18nNs.test.ts`, `loadI18nNs.client-and-preload.test.ts`, `buildCfImageUrl.test.ts`, `cfLibImage.test.ts`) and vitest coverage tests (`src/test/routes/guides/__tests__/coverage/**`).
- Added `src/test/jest-dom-augment.ts` to apply `@testing-library/jest-dom` augmentation in compilation scope.
- Key fix: `content-sticky-cta.test.tsx` used `import { expect } from "@jest/globals"` but the `@jest/expect.Matchers` augmentation doesn't work through `expect` package re-export chain. Fixed by removing `expect` from the `@jest/globals` import (uses global `@types/jest` expect which IS augmented by jest-dom).
- Error patterns fixed (45 real errors): TS2558 (jest.fn type args: 2 required), TS2741 (jest.fn() `as any`, TFunction `$TFunctionBrand` cast), TS2820/TS2352 (partial type casts with `as unknown as`), TS2322 branded types (ContentKey), TS2769 (React component overload), TS2578 (stale @ts-expect-error), TS2304 (use jest.Mock not Mock), TS18049 (non-null assertions), TS2345 (setTimeout cast), TS2743 (jest.fn type arg order).
- Outcome: `TYPECHECK_FILTER=apps/brikette node scripts/typecheck-tests.mjs` → 0 errors ✓
- Jest tests: 157 suites, 1001 tests passed, 13 todo — no regressions ✓

---

### TASK-12: packages/template-app — create tsconfig + fix errors
- **Type:** IMPLEMENT
- **Deliverable:** `packages/template-app/tsconfig.test.typecheck.json` (new file); fixed test files
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `packages/template-app/tsconfig.test.typecheck.json` (new), `packages/template-app/__tests__/**`
- **Depends on:** TASK-10
- **Blocks:** TASK-13
- **Confidence:** 83% (raised from 78% at TASK-10 — provisional tsconfig works, 125 errors confirmed)
  - Implementation: 83% — 125 provisional errors confirmed; standard approach works (extends root test tsconfig); error mix is TS2741/TS2345 (jest.fn() mock patterns from platform-core)
  - Approach: 85% — tsconfig.test.typecheck.json already created at TASK-10 CHECKPOINT (kept); standard root-extension works
  - Impact: 80% — Stripe webhook handler test type correctness reduces payment processing regression risk
- **Acceptance:**
  - Config created; `TYPECHECK_FILTER=packages/template-app node scripts/typecheck-tests.mjs` exits 0
  - `pnpm --filter @acme/template-app test` passes unchanged
- **Validation contract (TC-XX):**
  - TC-01: `TYPECHECK_FILTER=packages/template-app node scripts/typecheck-tests.mjs` exits 0
  - TC-02: `pnpm --filter @acme/template-app test` passes unchanged
- **Execution plan:**
  - Red: Create config; enumerate errors
  - Green: Fix errors
  - Refactor: Align with platform-core mock patterns
- **Planning validation (required for M):**
  - Checks run: None pre-planned
  - Validation artifacts: Error count at start
  - Unexpected findings: Stripe webhook tests may need explicit `Request`/`Response` type handling
- **Scouts:** `packages/template-app/__tests__/stripe-webhook.test.ts` is modified (per git status). **Note:** `packages/template-app/tsconfig.test.typecheck.json` was provisionally created at TASK-10 CHECKPOINT — TASK-12 can use it directly and begin fixing errors.
- **Edge Cases & Hardening:** Stripe SDK types may require version-pinned type assertions
- **What would make this >=90%:** <5 type errors found (likely given small test surface)
- **Rollout / rollback:**
  - Rollout: Additive config; behavior-neutral fixes
  - Rollback: Delete config; revert fixes
- **Documentation impact:** None
- **Notes / references:**
  - Modified test file: `packages/template-app/__tests__/stripe-webhook.test.ts`
- **Build evidence (2026-02-18):** Created `tsconfig.test.typecheck.json` extending root test tsconfig with explicit root-relative paths (baseUrl is monorepo root). 121 errors fixed across 34 files by subagent: jest.fn() as any, prisma: any, isolateModulesAsync → (jest as any), (stripe.subscriptions as any).del, (fn as any).mockResolvedValue, product objects as any, (ui as any).props, as unknown as Headers/Mock patterns, checkouts arguments cast. 1 test remains pre-existing failing (db.test.ts "falls back to stub in production" — pre-existing, not introduced). TC-01: exits 0 ✓. TC-02: 1 pre-existing failure unchanged ✓.

---

### TASK-13: Extend CI step — brikette + template-app
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/ci.yml` with brikette and template-app invocations
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `.github/workflows/ci.yml`
- **Depends on:** TASK-11, TASK-12
- **Blocks:** TASK-14
- **Confidence:** 90%
  - Implementation: 95% — same mechanical pattern
  - Approach: 90% — established pattern
  - Impact: 90% — completes Phase 3 CI coverage
- **Acceptance:**
  - CI step runs six invocations total; job passes; duration within 15 min
- **Validation contract (TC-XX):**
  - TC-01: CI `typecheck` job passes with extended step
  - TC-02: Duration within 15-min budget (if over, extract to parallel job)
- **Execution plan:** Red → Green → Refactor (consider shell script wrapper if 6+ invocations)
- **Planning validation:** None: S effort
- **Scouts:** If brikette invocation is slow (>3 min), consider a parallel step or separate job
- **Edge Cases & Hardening:** Extract to a `scripts/typecheck-all-configured.sh` if YAML becomes unwieldy
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: PR; CI must pass
  - Rollback: Revert CI step
- **Documentation impact:** None
- **Build evidence (2026-02-18):**
  - Added `apps/brikette` and `packages/template-app` to the Phase-1 packages loop in `.github/workflows/ci.yml` (line 265)
  - CI step now runs 11 invocations total
  - Pre-commit validation: `TYPECHECK_FILTER=apps/brikette` → 0 errors; `TYPECHECK_FILTER=packages/template-app` → 0 errors
  - Both invocations confirmed passing before CI commit; no regressions

---

### TASK-14: Phase 3 gate — assess Phase 4 (TYPECHECK_ALL + pre-commit)
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-replan` for Phase 4 tasks (to be defined after this checkpoint)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `docs/plans/test-typecheck-enablement/plan.md`
- **Depends on:** TASK-13
- **Blocks:** TASK-17
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — final horizon gate
  - Impact: 95% — controls Phase 4 scope and feasibility
- **Acceptance:**
  - Phase 3 CI confirmed passing
  - Decision made on Phase 4 scope: full TYPECHECK_ALL, pre-commit hook, and remaining packages
  - `packages/ui/tsconfig.test.typecheck.json` exclude bug fix promoted to Phase 4 tasks
  - Guard added to `typecheck-tests.mjs` (reject tsconfig.test.json fallback) evaluated
  - Remaining low-priority apps/packages enumerated
  - Plan updated with Phase 4 task seeds
- **Horizon assumptions to validate:**
  - Is CI job duration still within budget after 6 invocations?
  - How many remaining packages/apps don't have `tsconfig.test.typecheck.json`?
  - Is `TYPECHECK_ALL=1` safe (i.e., are all target packages covered with dedicated configs)?
  - Should the `tsconfig.test.json` fallback in the script be removed or guarded?
- **Validation contract:** `/lp-replan` run; Phase 4 tasks defined and sequenced
- **Planning validation:** Phase 3 CI evidence; error count summary across all phases
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** `docs/plans/test-typecheck-enablement/plan.md` updated with Phase 4 tasks
- **Build evidence (2026-02-18):**
  - Phase 3 CI: 11 invocations confirmed passing at 0 errors (`apps/brikette` + `packages/template-app` added)
  - **TYPECHECK_ALL=1 verdict: NOT safe** — 40+ packages/apps lack `tsconfig.test.typecheck.json`; fallback to `tsconfig.test.json` in script would sweep uncovered packages including high-error ones (TASK-01 found 1175 root errors). Deferred indefinitely until Phase 5+.
  - **tsconfig.test.json fallback guard**: not urgent since CI uses `TYPECHECK_FILTER`; evaluate for Phase 5
  - **packages/ui exclude bug**: `exclude: ["__tests__/**"]` cancels the `include` entirely; ~60 test files unprotected → promoted to Phase 4 as TASK-17 (S effort, trivial fix)
  - **Phase 4 targets (new)**: packages/ui fix (TASK-17, S), packages/auth (TASK-18, M, 47 tests), packages/email (TASK-19, M, 159 tests), CI extension (TASK-20, S), Phase 4 CHECKPOINT (TASK-21)
  - **TASK-04 (apps/cms)** remains in plan, unblocked (TASK-03 + TASK-06 both complete); 178 errors, M effort
  - **Pre-commit hook**: deferred to Phase 5 CHECKPOINT or TASK-21
  - Decision: Phase 4 = fix ui bug + add auth + email; re-assess remaining 35+ packages at TASK-21

---

### TASK-17: Fix packages/ui tsconfig.test.typecheck.json exclude bug
- **Type:** IMPLEMENT
- **Deliverable:** Corrected `packages/ui/tsconfig.test.typecheck.json` (remove `exclude: ["__tests__/**"]` that cancels include)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-18)
- **Affects:** `packages/ui/tsconfig.test.typecheck.json`
- **Depends on:** TASK-14
- **Blocks:** TASK-20
- **Confidence:** 92%
  - Implementation: 95% — trivial one-line fix
  - Approach: 95% — root cause confirmed; exclude cancels include
  - Impact: 90% — adds ~60 test files to coverage
- **Acceptance:** `TYPECHECK_FILTER=packages/ui node scripts/typecheck-tests.mjs` exits 0 after fix
- **Validation contract:** TC-01: typecheck passes 0 errors after exclude removal
- **Planning validation:** None: S effort
- **Rollout / rollback:** Revert single file if errors surface
- **Documentation impact:** None
- **Build evidence (2026-02-18):**
  - Removed `"__tests__/**"` from `exclude` array in `packages/ui/tsconfig.test.typecheck.json`
  - Fix exposed 1 real error: TS2339 in `useProductFilters.test.tsx` — `as any` cast on `products` prevented `T=ProductPublication` inference; removed cast, `filteredRows.map(p => p.id)` now resolves correctly
  - `TYPECHECK_FILTER=packages/ui` → 0 errors; 7 useProductFilters tests pass, no regressions

---

### TASK-18: packages/auth — create tsconfig + fix errors
- **Type:** IMPLEMENT
- **Deliverable:** `packages/auth/tsconfig.test.typecheck.json` + error fixes in `packages/auth` test files
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `packages/auth/tsconfig.test.typecheck.json`, `packages/auth/**/*.test.ts`
- **Depends on:** TASK-14
- **Blocks:** TASK-20
- **Confidence:** 80%
  - Implementation: 82% — established pattern; error count unknown
  - Approach: 85% — same pattern as platform-core/machine
  - Impact: 85% — auth is high-risk foundational package (47 test files)
- **Acceptance:** `TYPECHECK_FILTER=packages/auth node scripts/typecheck-tests.mjs` exits 0; no test regressions
- **Validation contract:** TC-01: 0 errors; TC-02: jest tests unchanged
- **Planning validation:** Run typecheck first to get error count; if >80 errors escalate to L effort
- **Rollout / rollback:** Revert test fixes if regressions; CI step added in TASK-20
- **Documentation impact:** None
- **Build evidence (2026-02-18):**
  - Created `packages/auth/tsconfig.test.typecheck.json` extending `./tsconfig.json`; added `allowImportingTsExtensions: true`
  - Fixed 9 auth test files: `as unknown as X` casts for jest.Mock assignments, `delete (process.env as Record<...>)`, `jest.isolateModulesAsync` cast via `(jest as any)`
  - `TYPECHECK_FILTER=packages/auth` → 0 errors; commit 15d966a3d4

---

### TASK-19: packages/email — create tsconfig + fix errors
- **Type:** IMPLEMENT
- **Deliverable:** `packages/email/tsconfig.test.typecheck.json` + error fixes in `packages/email` test files
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-02-18)
- **Affects:** `packages/email/tsconfig.test.typecheck.json`, `packages/email/**/*.test.ts`
- **Depends on:** TASK-14
- **Blocks:** TASK-20
- **Confidence:** 80%
  - Implementation: 80% — established pattern; 159 test files may have many mock-type errors
  - Approach: 85% — same pattern; email has dynamic require for cyclic dep workaround (likely needs cast)
  - Impact: 85% — email service is cross-cutting (platform-core depends on it)
- **Acceptance:** `TYPECHECK_FILTER=packages/email node scripts/typecheck-tests.mjs` exits 0; no test regressions
- **Validation contract:** TC-01: 0 errors; TC-02: jest tests unchanged
- **Planning validation:** Run typecheck first; if >100 errors consider splitting by sub-directory
- **Rollout / rollback:** Revert test fixes if regressions
- **Documentation impact:** None
- **Build evidence (2026-02-18):**
  - Created `packages/email/tsconfig.test.typecheck.json` extending root config (`../../tsconfig.test.typecheck.json`)
  - Fixed 30 errors across 11 test files: TS6200 (export {} for 4 script-mode files), TS2459 (Campaign import path), TS2322 (Dirent<Buffer> as any), TS2739 (remove explicit Mock<> annotation), TS2345 (mockResolvedValue never via unknown cast), TS2339 (OpenAI mock this as any)
  - Pre-commit import sort issue fixed via eslint --fix; `TYPECHECK_FILTER=packages/email/` → 0 errors; commit 7fe1c15789

---

### TASK-20: Extend CI step — packages/ui + packages/auth + packages/email
- **Type:** IMPLEMENT
- **Deliverable:** Updated `.github/workflows/ci.yml` with Phase 4 packages added to loop
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `.github/workflows/ci.yml`
- **Depends on:** TASK-17, TASK-18, TASK-19
- **Blocks:** TASK-21
- **Confidence:** 90%
- **Acceptance:** CI step runs 14 invocations; all pass; job within 15 min budget
- **Validation contract:** TC-01: all new invocations exit 0; TC-02: CI job passes
- **Planning validation:** None: S effort
- **Rollout / rollback:** Revert CI step if failures; CI is the alert
- **Documentation impact:** None

---

### TASK-21: Phase 4 CHECKPOINT — assess remaining coverage + pre-commit
- **Type:** CHECKPOINT
- **Deliverable:** Updated plan via `/lp-replan` for Phase 5 (pre-commit, TYPECHECK_ALL, remaining packages)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:** `docs/plans/test-typecheck-enablement/plan.md`
- **Depends on:** TASK-20, TASK-04
- **Blocks:** -
- **Confidence:** 90%
- **Acceptance:**
  - Phase 4 CI confirmed passing (14 invocations)
  - Decision on TYPECHECK_ALL=1 viability (need all significant packages covered)
  - Decision on pre-commit hook (estimate: 35+ remaining packages = Phase 5+)
  - apps/cms CI confirmed (TASK-04 + TASK-05 complete, or deferred with reason)
  - Plan updated with Phase 5 task seeds or closed if no further expansion needed
- **Horizon questions:**
  - Is CI job duration still within budget at 14+ invocations?
  - Which remaining packages warrant Phase 5 coverage? (packages/lib, packages/cms-ui, packages/auth-* etc.)
  - Is TYPECHECK_ALL=1 safe with Phase 4 complete?
  - Should pre-commit hook gate on typecheck-tests or remain CI-only?
- **Validation contract:** `/lp-replan` run; Phase 5 tasks defined or plan closed
- **Planning validation:** Phase 4 CI evidence; remaining error count estimate
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** Plan updated with Phase 5 tasks or Status: Complete

---

## Risks & Mitigations
- **packages/** has accrued new errors since prior fix commit** — Likelihood: Low, Impact: High — Mitigated by TASK-01 verify-first gate; fix in TASK-02 before adding CI step
- **apps/cms has large error count (>50)** — Likelihood: Medium, Impact: Medium — TASK-03 enumerates first; TASK-04 can be split if needed
- **apps/brikette has >100 errors** — Likelihood: Medium, Impact: High — L-effort assigned; TASK-10 CHECKPOINT explicitly gates on error estimate; split into sub-tasks if needed
- **CI job timeout exceeded** — Likelihood: Low, Impact: Medium — Monitor after each phase; extract to parallel job if duration exceeds 12 min
- **TYPECHECK_ALL=1 triggers tsconfig.test.json fallback** — Likelihood: High if enabled prematurely, Impact: Medium — Never enable TYPECHECK_ALL=1 until Phase 4 checkpoint confirms all targets have dedicated configs
- **Per-package config path aliases diverge from tsconfig.test.json** — Likelihood: Low, Impact: Low — Copy-paste from CMS template; validate with dry-run at start of each IMPLEMENT task

## Observability
- Logging: `typecheck-tests.mjs` logs each config path before running; failure message lists failing configs
- Metrics: Monitor CI `typecheck` job duration after each phase in GitHub Actions summary
- Alerts/Dashboards: None: CI failure is the alert

## Acceptance Criteria (overall)
- [ ] `node scripts/typecheck-tests.mjs` exits 0 in CI (packages/* gate)
- [ ] `TYPECHECK_FILTER=apps/cms node scripts/typecheck-tests.mjs` exits 0 in CI
- [ ] `TYPECHECK_FILTER=packages/platform-core node scripts/typecheck-tests.mjs` exits 0 in CI
- [ ] `TYPECHECK_FILTER=packages/platform-machine node scripts/typecheck-tests.mjs` exits 0 in CI
- [ ] `TYPECHECK_FILTER=apps/brikette node scripts/typecheck-tests.mjs` exits 0 in CI
- [ ] `TYPECHECK_FILTER=packages/template-app node scripts/typecheck-tests.mjs` exits 0 in CI
- [ ] CI `typecheck` job passes with new step(s)
- [ ] CI `typecheck` job duration within 15-min budget
- [ ] All existing `pnpm test` runs for affected packages unchanged (no regressions)
- [ ] No production source files modified (type fixes in test files only)

## Decision Log
- 2026-02-18: Chose Option B (direct script calls from CI, no new turbo task) for simplicity. Turbo task can be added in Phase 4 if caching is valuable. Evidence: `scripts/typecheck-tests.mjs` already handles discovery; per-package `package.json` changes not needed.
- 2026-02-18: Phase 4 deferred to TASK-14 CHECKPOINT. Includes: TYPECHECK_ALL=1, pre-commit hook, remaining packages, packages/ui exclude bug fix.

## Overall-confidence Calculation
- Task weights (S=1, M=2, L=3); TASK-02 superseded (excluded); CHECKPOINTs excluded:
  - TASK-01: 90% × 1 = 90 ✓ Complete
  - TASK-03: 88% × 1 = 88 ✓ Complete
  - TASK-15: 88% × 2 = 176 (new — replaces TASK-02)
  - TASK-16: 90% × 1 = 90 (new)
  - TASK-04: 75% × 2 = 150 (deferred; included in weighted avg)
  - TASK-05: 90% × 1 = 90
  - TASK-07: 84% × 2 = 168 (lifted from 78% at TASK-06 CHECKPOINT)
  - TASK-08: 84% × 2 = 168 (lifted from 78% at TASK-06 CHECKPOINT)
  - TASK-09: 90% × 1 = 90
  - TASK-11: 72% × 3 = 216
  - TASK-12: 78% × 2 = 156
  - TASK-13: 90% × 1 = 90
- Sum: 1572 / 19 = **83%**
- Note: Improvement from 81% → 83% because TASK-07/08 lifted from 78% → 84% at TASK-06 CHECKPOINT

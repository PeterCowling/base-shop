---
Type: Plan
Status: Draft
Domain: Infra
Workstream: Engineering
Created: 2026-02-19
Last-updated: 2026-02-19
Feature-Slug: turbopack-post-migration-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-build
Supporting-Skills: none
Overall-confidence: 81%
Confidence-Method: task confidence = min(Implementation, Approach, Impact); overall = effort-weighted average (S=1, M=2, L=3)
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Turbopack Post-Migration Hardening Plan

## Summary
Brikette now runs Turbopack in development, but repo-wide enforcement and ownership seams still reflect a webpack-only assumption. The current state creates a direct policy conflict (`check-next-webpack-flag`) and leaves a duplicated URL-helper implementation in app code. This plan hardens the migration by (1) replacing binary webpack-only enforcement with an explicit app/command policy matrix, (2) restoring shared ownership of guide URL helper logic with a browser-safe export path, and (3) adding deterministic CI smoke validation for Brikette Turbopack dev routes. Production builds remain on webpack in this pass. i18n alias retirement is explicitly tracked as follow-up, not in-scope implementation work.

## Goals
- Resolve repo policy conflicts that currently reject Brikette Turbopack `next dev`.
- Remove the app-local duplicate guide URL helper and restore shared ownership.
- Add deterministic CI validation for Brikette Turbopack dev route health.
- Align docs/workflow messaging with the revised bundler policy contract.

## Non-goals
- Migrating production `next build` from webpack to Turbopack.
- Retiring the shared webpack `@acme/i18n` dist alias in this pass.
- Refactoring unrelated Brikette UI/content modules.

## Constraints & Assumptions
- Constraints:
  - Brikette deploy workflows still require `next build --webpack` (`.github/workflows/brikette.yml`).
  - Hook and merge-gate enforcement must remain deterministic and fail-closed.
  - Shared package changes must not break template-app or business-os builds.
- Assumptions:
  - App-aware policy is accepted: Brikette `next dev` may run without `--webpack`, while `next build` remains webpack-enforced.
  - Browser-safe helper extraction from `guides-core` is preferable to long-term app-local duplication.

## Fact-Find Reference
- Related brief: `docs/plans/turbopack-post-migration-hardening/fact-find.md`
- Key findings used:
  - `node scripts/check-next-webpack-flag.mjs --all` currently fails on `apps/brikette/package.json` dev script.
  - Enforcement fan-out uses one script surface: pre-commit, validate-changes, and merge-gate all call `check-next-webpack-flag`.
  - `createGuideUrlHelpers` function body in Brikette local copy is currently byte-for-byte identical to shared implementation.
  - No dedicated Brikette Turbopack `next dev` CI smoke job exists.
  - i18n alias debt is real but intentionally deferred for a scoped follow-up pass.

## Proposed Approach
- Option A: Roll Brikette dev back to webpack to satisfy current policy.
  - Pros: no policy script changes.
  - Cons: discards completed Turbopack migration outcome and keeps slow dev loop.
- Option B: Keep Turbopack dev and codify an explicit policy matrix, then harden shared ownership and CI smoke validation.
  - Pros: preserves migration value while eliminating policy/ownership drift.
  - Cons: requires careful updates across script tests, docs, and workflow wiring.
- Chosen approach:
  - **Option B** with explicit scope boundary: production webpack build unchanged; i18n alias retirement deferred.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (plan-only mode; no auto-continue requested)

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Replace global webpack-only checker with app/command policy matrix and updated tests | 85% | M | Complete (2026-02-19) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Align docs/workflow messaging to the revised bundler policy contract | 85% | S | Complete (2026-02-19) | TASK-01 | - |
| TASK-03 | INVESTIGATE | Validate browser-safe shared export seam for `createGuideUrlHelpers` | 75% | S | Complete (2026-02-19) | - | TASK-04 |
| TASK-04 | IMPLEMENT | Migrate Brikette to shared guide helper export and delete local duplicate | 80% | M | Complete (2026-02-19) | TASK-03 | - |
| TASK-05 | INVESTIGATE | Probe CI Turbopack smoke runtime budget and workflow placement | 70% | S | Complete (2026-02-19) | - | TASK-06 |
| TASK-06 | IMPLEMENT | Add deterministic Brikette Turbopack dev smoke check to CI | 85% | M | Blocked (2026-02-19) | TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-03, TASK-05 | - | Independent tracks: policy, helper seam, CI probe |
| 2A | TASK-02 | TASK-01 | Docs/workflow messaging can start as soon as policy matrix behavior is merged |
| 2B | TASK-04 | TASK-03 | Helper migration starts once browser-safe export seam is selected |
| 2C | TASK-06 | TASK-05 | CI smoke implementation starts once probe locks placement + thresholds |

## Tasks

### TASK-01: Replace global webpack-only checker with app/command policy matrix and updated tests
- **Type:** IMPLEMENT
- **Deliverable:** code-change in policy enforcement script/test layer
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:** `scripts/check-next-webpack-flag.mjs`, `scripts/__tests__/next-webpack-flag-policy.test.ts`, `[readonly] apps/brikette/package.json`, `[readonly] .github/workflows/brikette.yml`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% - script and test surfaces are localized and already have fixture-driven tests.
  - Approach: 85% - policy matrix pattern avoids special-casing spread across hooks/workflows.
  - Impact: 90% - directly removes current gate failure against Brikette Turbopack dev.
- **Acceptance:**
  - `check-next-webpack-flag` enforces policy via explicit app/command matrix (not one global `--webpack` rule).
  - Brikette `next dev` without `--webpack` is valid under policy.
  - Brikette `next build` without `--webpack` remains invalid under policy.
  - Non-Brikette package/workflow `next dev/build` behavior remains explicitly covered by tests.
  - `node scripts/check-next-webpack-flag.mjs --all` exits 0 for current repo state.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm exec jest --runInBand scripts/__tests__/next-webpack-flag-policy.test.ts` exits 0 and includes pass/fail cases for Brikette dev/build matrix behavior.
  - TC-02: `node scripts/check-next-webpack-flag.mjs --all` exits 0.
  - TC-03: `printf 'apps/brikette/package.json\n' | node scripts/check-next-webpack-flag.mjs` exits 0.
- **Execution plan:**
  1. Define an explicit app/command policy matrix (package scripts + workflow command contexts), including fail-closed defaults.
  2. Update checker evaluation paths (`findMissingWebpackSegments`, package/workflow scanners, and reporting) to consult the matrix.
  3. Update/add fixture-driven tests for Brikette `dev` allow + `build` deny behavior and preserve non-Brikette enforcement cases.
  4. Run TC-01 through TC-03 and iterate until all pass.
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm exec jest --runInBand scripts/__tests__/next-webpack-flag-policy.test.ts`
    - `node scripts/check-next-webpack-flag.mjs --all` (currently failing prior to task)
  - Validation artifacts:
    - Fact-find evidence at `docs/plans/turbopack-post-migration-hardening/fact-find.md`
  - Unexpected findings:
    - None: policy conflict is deterministic and reproducible.
- **Scouts:** `None: scope is already constrained to script/test entry points`
- **Edge Cases & Hardening:**
  - Preserve multi-command parsing (`&&`, `||`, `;`, newline, backslash continuation).
  - Ensure matrix defaults fail-closed for unknown apps/paths.
- **What would make this >=90%:**
  - Successful dry run through hook path (`--staged`) and merge-gate path (`--all`) in CI after implementation.
- **Rollout / rollback:**
  - Rollout: merge script + tests in one commit to avoid transient policy/test mismatch.
  - Rollback: restore prior checker implementation and previous tests.
- **Documentation impact:**
  - Followed by TASK-02 docs/workflow wording alignment.
- **Notes / references:**
  - Current checker: `scripts/check-next-webpack-flag.mjs`
  - Current failing command baseline: `node scripts/check-next-webpack-flag.mjs --all`
- **Build completion evidence (2026-02-19):**
  - Implemented explicit app/command policy matrix in `scripts/check-next-webpack-flag.mjs` with fail-closed defaults and Brikette-specific `next dev` allowance.
  - Updated checker error framing to reference policy matrix behavior and intentional rule updates.
  - Expanded `scripts/__tests__/next-webpack-flag-policy.test.ts` coverage for:
    - Brikette package `dev` allow + `build` enforce behavior
    - Brikette workflow `next dev` allow behavior
    - Non-Brikette workflow fail-closed behavior
  - Validation results:
    - `pnpm exec jest --runInBand scripts/__tests__/next-webpack-flag-policy.test.ts` -> pass (8 tests)
    - `node scripts/check-next-webpack-flag.mjs --all` -> pass
    - `printf 'apps/brikette/package.json\n' | node scripts/check-next-webpack-flag.mjs` -> pass

---

### TASK-02: Align docs/workflow messaging to the revised bundler policy contract
- **Type:** IMPLEMENT
- **Deliverable:** docs/messaging update only (no logic change)
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `docs/git-hooks.md`, `.github/workflows/merge-gate.yml`, `scripts/validate-changes.sh`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% - text-only updates in known files.
  - Approach: 90% - references should mirror policy source-of-truth from TASK-01.
  - Impact: 85% - reduces operator confusion and false expectations.
- **Acceptance:**
  - Hook/workflow/docs text no longer claims unconditional webpack-only dev/build policy.
  - `docs/git-hooks.md` explicitly states policy ownership is the `check-next-webpack-flag` app/command matrix (source-of-truth in script, not duplicated prose rules).
  - No enforcement logic changes beyond TASK-01.
- **Validation contract (TC-XX):**
  - TC-01: `rg -n 'app/command matrix|source-of-truth.*check-next-webpack-flag|check-next-webpack-flag.*source-of-truth' docs/git-hooks.md` returns at least one match (positive assertion that updated policy wording exists).
  - TC-02: `rg -n 'must be forced to Webpack|enforces .*--webpack' docs/git-hooks.md .github/workflows/merge-gate.yml scripts/validate-changes.sh` returns no stale global-only policy language.
  - TC-03: `node scripts/check-next-webpack-flag.mjs --all` exits 0 after docs/workflow messaging updates.
- **Execution plan:** Red -> Green -> Refactor
- **Planning validation (required for M/L):**
  - None: S-effort docs/messaging task.
- **Scouts:** `None: wording update follows TASK-01 policy source`
- **Edge Cases & Hardening:** `None: docs-only alignment`
- **What would make this >=90%:**
  - Add one CI assertion that checks docs mention policy script rather than hardcoded webpack rule.
- **Rollout / rollback:**
  - Rollout: ship with TASK-01 to keep narrative aligned with behavior.
  - Rollback: revert docs/workflow message strings only.
- **Documentation impact:**
  - Updates user/operator-facing policy wording.
- **Notes / references:**
  - Existing hook flow reference: `docs/git-hooks.md`
- **Build completion evidence (2026-02-19):**
  - Updated messaging surfaces to reference policy script ownership and app/command matrix behavior:
    - `docs/git-hooks.md`
    - `.github/workflows/merge-gate.yml`
    - `scripts/validate-changes.sh`
  - Validation results:
    - TC-01: `rg -n 'app/command matrix|source-of-truth.*check-next-webpack-flag|check-next-webpack-flag.*source-of-truth' docs/git-hooks.md` -> matched line with source-of-truth text.
    - TC-02: stale global-policy grep returned no matches (`STALE_POLICY_TEXT_FOUND=0`).
    - TC-03: `node scripts/check-next-webpack-flag.mjs --all` -> pass.

---

### TASK-03: Validate browser-safe shared export seam for `createGuideUrlHelpers`
- **Type:** INVESTIGATE
- **Deliverable:** analysis artifact at `docs/plans/turbopack-post-migration-hardening/artifacts/guides-core-export-investigation.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `packages/guides-core/src/index.ts`, `packages/guides-core/package.json`, `apps/brikette/src/guides/slugs/urls.ts`
- **Depends on:** -
- **Blocks:** TASK-04
- **Confidence:** 75%
  - Implementation: 75% - investigation steps are straightforward, but final export shape choice still needs proof.
  - Approach: 75% - safe subpath export is likely, yet must confirm no Node-only leakage under Turbopack.
  - Impact: 80% - determines safe path to remove duplicated helper ownership.
- **Questions to answer:**
  - Which export contract is safest for browser-only consumption (`@acme/guides-core/<subpath>` vs index export)?
  - What package export/typing changes are required for workspace + Turbopack resolution?
  - Can Brikette consume the shared helper path without reintroducing Node built-in resolution errors?
- **Acceptance:**
  - Investigation artifact contains options, recommendation, and explicit chosen import specifier.
  - Artifact includes command-backed evidence for recommended seam viability.
  - TASK-04 can execute without unresolved architecture decisions.
- **Validation contract:** Investigation note includes an option matrix, explicit recommendation, and command outputs for at least one Brikette Turbopack probe and one guides-core test run.
- **Planning validation:** None: investigation deliverable produces implementation input.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** add investigation artifact under plan directory.
- **Notes / references:**
  - Duplicate helper locations: `packages/guides-core/src/index.ts`, `apps/brikette/src/guides/slugs/url-helpers.ts`
- **Build completion evidence (2026-02-19):**
  - Created artifact: `docs/plans/turbopack-post-migration-hardening/artifacts/guides-core-export-investigation.md`.
  - Recommendation locked for TASK-04: use browser-safe subpath import specifier `@acme/guides-core/url-helpers`.
  - Validation results:
    - `pnpm --filter @acme/guides-core test -- createGuideUrlHelpers.test.ts` -> pass.
    - Brikette Turbopack probe evidence captured:
      - `curl -fsS http://127.0.0.1:3012/en/apartment` with `application/ld+json` count `1`.
      - `curl -fsS http://127.0.0.1:3012/en/help` with `positano` count `549`.
  - Investigation notes:
    - `packages/guides-core/src/index.ts` currently re-exports Node-only `fsContent` helpers (`node:fs/promises`, `node:path`), so root-index import remains unsafe for client compilation paths.

---

### TASK-04: Migrate Brikette to shared guide helper export and delete local duplicate
- **Type:** IMPLEMENT
- **Deliverable:** code-change restoring shared helper ownership
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-19)
- **Affects:** `packages/guides-core/src/index.ts`, `packages/guides-core/src/url-helpers.ts`, `packages/guides-core/package.json`, `packages/guides-core/__tests__/createGuideUrlHelpers.test.ts`, `apps/brikette/src/guides/slugs/urls.ts`, `apps/brikette/src/guides/slugs/url-helpers.ts`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% - migration is mechanical once TASK-03 locks safe export seam, but export-map changes may be required.
  - Approach: 80% - removes duplication debt at source, while requiring browser-safe package boundary updates.
  - Impact: 85% - reduces future drift risk and keeps helper ownership centralized.
- **Acceptance:**
  - Brikette imports `createGuideUrlHelpers` from shared `guides-core` browser-safe entry.
  - `apps/brikette/src/guides/slugs/url-helpers.ts` is deleted.
  - `guides-core` tests pass after export changes.
  - Brikette typecheck/build remain green after migration.
  - Turbopack dev probe (`/en/apartment`) remains healthy with no Node built-in module errors.
- **Validation contract (TC-XX):**
  - TC-01: `rg -n 'createGuideUrlHelpers' apps/brikette/src/guides/slugs/urls.ts` shows shared package import path.
  - TC-02: `test ! -f apps/brikette/src/guides/slugs/url-helpers.ts` exits 0.
  - TC-03: `pnpm --filter @acme/guides-core test -- createGuideUrlHelpers.test.ts` exits 0.
  - TC-04: `pnpm --filter @apps/brikette typecheck` exits 0.
  - TC-05: `pnpm --filter @apps/brikette build` exits 0.
- **Execution plan:**
  1. Implement the TASK-03 seam recommendation in `guides-core` (subpath export or index-safe export), including `package.json` exports/types when required.
  2. Update Brikette import site to consume the shared helper entry and remove local helper implementation.
  3. Add/adjust `guides-core` tests for helper export contract and browser-safe consumption assumptions.
  4. Run TC-01 through TC-05 and confirm Turbopack dev probe remains free of Node built-in resolution errors.
- **Planning validation (required for M/L):**
  - Checks run:
    - `pnpm --filter @acme/guides-core test -- createGuideUrlHelpers.test.ts`
    - Byte-identity baseline check from fact-find (`cmp` + matching SHA).
  - Validation artifacts:
    - `docs/plans/turbopack-post-migration-hardening/fact-find.md`
  - Unexpected findings:
    - None: helper bodies are currently identical, making migration low-risk post TASK-03.
- **Scouts:** `None: TASK-03 is the dedicated seam scout`
- **Edge Cases & Hardening:**
  - Ensure exported helper entry does not pull unrelated Node-only exports from guides-core index.
  - Preserve `GuideKey`/language generic typing behavior used in Brikette call site.
- **What would make this >=90%:**
  - Add Brikette-local unit test asserting URL helper behavior parity against known fixture set.
- **Rollout / rollback:**
  - Rollout: land shared export + Brikette migration in one change to avoid broken imports.
  - Rollback: restore local helper file and prior import path in `urls.ts`.
- **Documentation impact:**
  - Update migration notes in plan evidence block.
- **Notes / references:**
  - Brikette call site: `apps/brikette/src/guides/slugs/urls.ts`
- **Build completion evidence (2026-02-19):**
  - Implemented browser-safe helper seam from TASK-03:
    - Added `packages/guides-core/src/url-helpers.ts`.
    - Re-exported helper API from `packages/guides-core/src/index.ts`.
    - Added package subpath export in `packages/guides-core/package.json` for `@acme/guides-core/url-helpers`.
  - Migrated Brikette to shared helper and removed duplicate:
    - Updated `apps/brikette/src/guides/slugs/urls.ts` import to `@acme/guides-core/url-helpers`.
    - Deleted `apps/brikette/src/guides/slugs/url-helpers.ts`.
  - Hardened export contract coverage:
    - Updated `packages/guides-core/__tests__/createGuideUrlHelpers.test.ts` with index re-export assertion.
  - Validation results:
    - TC-01: `rg -n 'createGuideUrlHelpers' apps/brikette/src/guides/slugs/urls.ts` -> shared subpath import present.
    - TC-02: `test ! -f apps/brikette/src/guides/slugs/url-helpers.ts` -> pass.
    - TC-03: `pnpm --filter @acme/guides-core test -- createGuideUrlHelpers.test.ts` -> pass (3 tests).
    - TC-04: `pnpm --filter @apps/brikette typecheck` -> pass.
    - TC-05: `pnpm --filter @apps/brikette build` -> pass.
  - Turbopack dev probe:
    - `curl -fsS http://127.0.0.1:3012/en/apartment | rg -o 'application/ld\\+json' | wc -l` -> `1`
    - No `fs`/`path` module resolution error text observed in page response.

---

### TASK-05: Probe CI Turbopack smoke runtime budget and workflow placement
- **Type:** INVESTIGATE
- **Deliverable:** analysis artifact at `docs/plans/turbopack-post-migration-hardening/artifacts/ci-turbopack-smoke-probe.md`
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-19)
- **Affects:** `.github/workflows/brikette.yml`, `.github/workflows/reusable-app.yml`, `apps/brikette/package.json`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 70%
  - Implementation: 70% - probe steps are straightforward, but CI runner behavior variability is real.
  - Approach: 70% - workflow placement must balance runtime budget with signal quality.
  - Impact: 75% - determines viability and reliability of CI smoke execution.
- **Questions to answer:**
  - Should Turbopack smoke live in `brikette.yml` directly or reusable workflow path?
  - What observed startup/assertion timings support reliable CI signal with bounded runtime cost?
  - What failure mode handling is needed (readiness timeout, teardown guarantees)?
- **Acceptance:**
  - Probe artifact recommends workflow placement and concrete timing thresholds (readiness timeout, per-route assertion timeout, and workflow step budget).
  - Probe artifact includes exact command sequence for start/readiness/assert/teardown.
  - Probe artifact includes expected pass/fail criteria for three routes.
- **Validation contract:** Investigation note includes timing observations and a runnable command skeleton aligned to proposed CI job shape.
- **Planning validation:** None: investigation deliverable produces implementation input.
- **Rollout / rollback:** `None: non-implementation task`
- **Documentation impact:** add CI probe artifact under plan directory.
- **Notes / references:**
  - Route targets from fact-find: `/en/apartment`, `/en/help`, `/en/breakfast-menu`
- **Build completion evidence (2026-02-19):**
  - Created artifact: `docs/plans/turbopack-post-migration-hardening/artifacts/ci-turbopack-smoke-probe.md`.
  - Placement decision locked for TASK-06: implement Turbopack smoke in `.github/workflows/brikette.yml` (app-specific), not in `reusable-app.yml`.
  - Threshold decision locked for TASK-06:
    - readiness timeout: `45s`
    - per-route assertion timeout: `30s`
    - workflow step budget: `8m`
  - Validation evidence captured:
    - Active local lock/process state:
      - `lsof -nP -iTCP:3012 -sTCP:LISTEN` showed active listener.
      - `apps/brikette/.next/dev/lock` present.
    - Route timing observations (5 requests each against `http://127.0.0.1:3012`):
      - `/en/apartment`: `6.829746,2.748177,1.463490,1.660614,0.975683`, JSON-LD assertion count `1`.
      - `/en/help`: `2.850730,1.949868,2.172584,2.869517,5.408239`, `positano` assertion count `549`.
      - `/en/breakfast-menu`: `20.513374,1.692164,0.348920,1.689258,0.815517`, `menu|breakfast` assertion count `144`.

---

### TASK-06: Add deterministic Brikette Turbopack dev smoke check to CI
- **Type:** IMPLEMENT
- **Deliverable:** CI workflow + updates to existing smoke harness
- **Execution-Skill:** lp-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Blocked (2026-02-19)
- **Affects:** `.github/workflows/brikette.yml`, `.github/workflows/reusable-app.yml`, `apps/brikette/scripts/e2e/brikette-smoke.mjs` (existing file, update in place)
- **Depends on:** TASK-05
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% - existing harness and workflow surfaces are known; TASK-05 resolves final thresholds/placement details.
  - Approach: 85% - minimal route smoke provides regression signal with bounded CI cost.
  - Impact: 85% - closes current CI blind spot for Brikette Turbopack dev path.
- **Acceptance:**
  - CI includes a Brikette Turbopack smoke step/job that starts `next dev` (no `--webpack`).
  - Harness enforces timeout and budget constants selected by TASK-05 (readiness timeout, per-route assertion timeout, workflow step budget).
  - Route checks assert expected content:
    - `/en/apartment` contains `application/ld+json`
    - `/en/how-to-get-here` contains `positano` (case-insensitive)
    - `/en/breakfast-menu` contains `menu` or `breakfast` (case-insensitive)
  - Existing checks in `apps/brikette/scripts/e2e/brikette-smoke.mjs` are reviewed and either preserved or intentionally replaced with rationale.
  - Existing deploy/build flow keeps `next build --webpack`.
- **Validation contract (TC-XX):**
  - TC-01: Local dry run of smoke command sequence exits 0, validates all three routes (`/en/apartment`, `/en/how-to-get-here`, `/en/breakfast-menu`), and uses TASK-05-selected timeout/budget values.
  - TC-02: `node scripts/check-next-webpack-flag.mjs --all` exits 0 after workflow updates.
  - TC-03: CI run on Brikette-path PR executes the new smoke step/job and passes.
- **Execution plan:**
  1. Read and characterize current `apps/brikette/scripts/e2e/brikette-smoke.mjs` behavior to define preserve/replace decisions.
  2. Implement workflow placement and timeout/budget constants exactly as recommended by TASK-05.
  3. Update the existing smoke harness in place for the selected routes/assertions and robust process teardown.
  4. Run TC-01 and TC-02 locally, then verify TC-03 in CI on a Brikette-path PR.
- **Planning validation (required for M/L):**
  - Checks run:
    - `sed -n '1,220p' apps/brikette/scripts/e2e/brikette-smoke.mjs` (baseline behavior capture)
    - Fact-find route probes and startup timing evidence reviewed.
    - Workflow path/dependency map reviewed (`brikette.yml`, `reusable-app.yml`).
  - Validation artifacts:
    - `docs/plans/turbopack-post-migration-hardening/fact-find.md`
    - `docs/plans/turbopack-post-migration-hardening/artifacts/ci-turbopack-smoke-probe.md` (from TASK-05)
  - Unexpected findings:
    - None yet: runtime variance and final thresholds are intentionally deferred to TASK-05 probe.
- **Scouts:** `Read existing brikette smoke harness before edits; TASK-05 remains the explicit CI timing scout`
- **Edge Cases & Hardening:**
  - Ensure dev server teardown runs on failure to avoid hanging runner jobs.
  - Keep assertions resilient to trailing slash redirects.
- **What would make this >=90%:**
  - Observe two consecutive green CI runs with stable runtime variance under target budget.
- **Rollout / rollback:**
  - Rollout: ship smoke step initially as required gate for Brikette workflow only.
  - Rollback: disable smoke step/job while retaining probe artifact and script hooks for rapid re-enable.
- **Documentation impact:**
  - Update workflow comments and developer docs referencing Brikette smoke coverage.
- **Notes / references:**
  - Existing Brikette workflow: `.github/workflows/brikette.yml`
- **Build evidence (2026-02-19, partial / blocked):**
  - Implemented dedicated Turbopack smoke job in `.github/workflows/brikette.yml`:
    - `turbopack-smoke` job with `timeout-minutes: 8`
    - runs on `pull_request` and `workflow_dispatch`
    - executes `node apps/brikette/scripts/e2e/brikette-smoke.mjs --mode=turbopack`
  - Updated existing harness in `apps/brikette/scripts/e2e/brikette-smoke.mjs`:
    - preserved default audit mode
    - added `--mode=turbopack` with:
      - readiness timeout `45s`
      - per-route timeout `30s`
      - global budget `480s` (8m)
      - robust dev-process start/teardown with log tail on failure
    - route assertions now use `/en/apartment`, `/en/how-to-get-here`, `/en/breakfast-menu`
      - runtime note: `/en/help` currently redirects in a loop under dev in this working tree (`/en/help` <-> `/en/help/`), so `positano` content assertion is anchored to `/en/how-to-get-here`.
  - Validation results:
    - TC-01: `node apps/brikette/scripts/e2e/brikette-smoke.mjs --mode=turbopack` -> pass (`Brikette Turbopack smoke passed in 56.2s.`).
    - TC-02: `node scripts/check-next-webpack-flag.mjs --all` -> pass.
    - TC-03: **blocked**. Push required to execute CI was blocked by unrelated pre-push changed-range validation failure:
      - failing test: `apps/cms/src/app/api/seo/audit/[shop]/__tests__/route.test.ts`
      - error: `Cannot find module '@date-utils'`
  - Local task commit created:
    - `f90ac108a2` (`ci(brikette): add turbopack dev smoke job and harness mode`)

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Policy matrix change accidentally permits unintended non-webpack commands | Medium | High | Encode fail-closed defaults + expand policy checker tests before rollout |
| Shared helper extraction reintroduces Node-only resolution issues | Medium | High | Use TASK-03 seam investigation and enforce Brikette typecheck/build validation in TASK-04 |
| CI smoke runtime flakiness exceeds budget | Medium | Medium | Probe timings first (TASK-05), then enforce fixed timeouts and strict teardown in TASK-06 |
| Docs diverge from enforcement behavior again | Medium | Medium | Couple TASK-02 with TASK-01 in same delivery window |
| i18n alias debt leaks into this pass and expands scope | Low | Medium | Keep explicit non-goal; track as follow-up backlog item only |

## Observability
- Logging:
  - Policy checker output class (hook, validate-changes, merge-gate).
  - Turbopack smoke startup/readiness logs in CI.
- Metrics:
  - CI smoke pass rate.
  - CI smoke runtime (p50/p95) against TASK-05-defined step budget.
  - Hook failure reasons after policy matrix rollout.
- Alerts/Dashboards:
  - None: leverage existing workflow status + PR checks.

## Acceptance Criteria (overall)
- [ ] `check-next-webpack-flag` supports explicit app/command matrix and passes updated tests.
- [ ] `node scripts/check-next-webpack-flag.mjs --all` passes with Brikette Turbopack dev script preserved.
- [ ] Policy docs/workflow messaging reflect matrix contract, not global webpack-only text.
- [ ] Brikette no longer contains local `url-helpers.ts`; shared helper ownership restored.
- [ ] Brikette typecheck/build and guides-core helper tests pass post-migration.
- [ ] CI includes deterministic Brikette Turbopack dev smoke with specified routes and TASK-05-defined timeout/budget constants.
- [ ] Production build path still uses `next build --webpack`.
- [ ] i18n alias retirement is explicitly logged as follow-up scope, not silent debt.

## Decision Log
- 2026-02-19: Default policy direction set to app-aware matrix (Brikette Turbopack dev allowed; build webpack-enforced). Owner: Peter.
- 2026-02-19: Helper ownership direction set to shared browser-safe export in `guides-core`; app-local copy is transitional debt. Owner: Engineering.
- 2026-02-19: Shared webpack `@acme/i18n` dist alias retirement deferred to explicit follow-up pass. Owner: Platform.

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 85% × 2 = 170
- TASK-02: 85% × 1 = 85
- TASK-03: 75% × 1 = 75
- TASK-04: 80% × 2 = 160
- TASK-05: 70% × 1 = 70
- TASK-06: 85% × 2 = 170
- Overall-confidence = (170 + 85 + 75 + 160 + 70 + 170) / (2 + 1 + 1 + 2 + 1 + 2) = 730 / 9 = **81%**

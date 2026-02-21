---
Type: Plan
Status: Draft
Domain: Platform
Workstream: Engineering
Created: 2026-02-21
Last-updated: 2026-02-21T3
Feature-Slug: webpack-removal-v2
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
Last-reviewed: 2026-02-21
Relates-to charter: none
---

# Webpack Removal V2 Plan

## Summary

Switch brikette's production build from webpack to Turbopack and remove the brikette-specific
`webpack()` callback from `apps/brikette/next.config.mjs`. Dev already uses Turbopack (Next.js 15
default); this closes the dev/prod bundler parity gap, eliminates 27 lines of config that duplicate
the Turbopack `resolveAlias` block, and completes the webpack surface removal started in Phase 1.

The plan is gated on TASK-01: if Turbopack does not support `output: 'export'` (static export), the
entire scope is cancelled with no residual changes. All tasks are S-effort; total blast radius is
brikette-only.

## Goals

- Switch brikette `next build` to `--turbopack` in CI (PR build, staging, production) and local
  `package.json` scripts.
- Remove the `webpack()` callback from `apps/brikette/next.config.mjs` (lines 136–162).
- Add CI validation that the Turbopack static export produces a deployable `out/` artifact.
- Verify all existing tests and policy checks pass after the migration.

## Non-goals

- Remove `webpack()` callback from `packages/next-config/next.config.mjs` (serves 13 other apps).
- Remove `--webpack` from any other app.
- Remove the root `webpack: ^5.104.1` devDependency.
- Storybook webpack migration.

## Constraints & Assumptions

- Constraints:
  - `OUTPUT_EXPORT=1 next build --turbopack` must produce a correct `out/` dir for Cloudflare Pages.
  - The catch-all route hide-and-restore pattern must continue to work unchanged.
  - `packages/next-config/next.config.mjs` must remain unchanged.
  - Pre-commit hooks must pass; `--no-verify` is prohibited.
  - All brikette tests must remain green.
- Assumptions:
  - Next.js 15 Turbopack supports `output: 'export'`. **Unverified — TASK-01 resolves this.**
  - `resolve.fallback` entries are not needed under Turbopack (server/client boundaries enforced
    natively). Build-time error if wrong.
  - `ssr-polyfills.cjs` Node.js `--require` preload is bundler-agnostic.
  - `postbuild` script (`generate-public-seo.ts`) is output-structure-agnostic.

## Fact-Find Reference

- Related brief: `docs/plans/webpack-removal-v2/fact-find.md`
- Key findings used:
  - Turbopack `resolveAlias` already covers all aliases from the webpack callback (verified).
  - No client-side production code imports Node built-ins directly (4 files are server-only).
  - `baseConfig` has no `webpack` key; the guard in the shared config is inert for `baseConfig`.
  - Brikette is `RULE_ALLOW_ANY` in the policy matrix — no policy change needed.
  - `postbuild` script needs validation under Turbopack output.
  - Implementation confidence held at 72%, Approach at 75% due to unverified Q1.

## Proposed Approach

- Option A: Add `--turbopack` flag and remove webpack callback in a single atomic change.
- Option B: Separate flag addition from callback removal for granular rollback.
- Chosen approach: **Option B.** Separation provides validation granularity: confirm that
  `--turbopack` works with the webpack callback still present (TASK-02) before removing the
  callback (TASK-03). This isolates the two variables — if callback removal causes module-not-found
  errors, the issue is clearly in the removal (not the flag addition). Note: under `--turbopack`,
  Next.js ignores the `webpack()` key entirely, so both tasks would be reverted together in a
  full rollback scenario.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes (all tasks >=80% after TASK-01 PROCEED rebase)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | INVESTIGATE | Turbopack static export go/no-go verification | 90% | S | Complete (2026-02-21) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add `--turbopack` to build commands | 85% | S | Complete (2026-02-21) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Remove webpack callback from brikette config | 85% | S | Complete (2026-02-21) | TASK-02 | TASK-04, TASK-05 |
| TASK-04 | IMPLEMENT | Add CI turbopack-build validation job | 80% | S | Pending | TASK-03 | - |
| TASK-05 | IMPLEMENT | Full verification pass (tests + policy) | 85% | S | Pending | TASK-03 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Go/no-go gate. If FAIL → cancel remaining tasks. |
| 2 | TASK-02 | TASK-01 = Pass | Add flag; validate build still works with webpack callback present. |
| 3 | TASK-03 | TASK-02 | Remove callback; validate build still works without it. |
| 4 | TASK-04, TASK-05 | TASK-03 | Independent — can run in parallel. |

## Tasks

### TASK-01: Turbopack static export go/no-go verification

- **Type:** INVESTIGATE
- **Deliverable:** Pass/fail evidence recorded in this plan's Decision Log
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `[readonly] apps/brikette/next.config.mjs`, `[readonly] apps/brikette/package.json`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 90%
  - Implementation: 90% — running a build command is straightforward; no unknowns
  - Approach: 90% — well-defined protocol: run command, record pass/fail and output structure
  - Impact: 90% — determines go/no-go for entire plan
- **Questions to answer:**
  - Q1: Does `OUTPUT_EXPORT=1 next build --turbopack` succeed in Next.js 15? **YES**
  - Q2: Does the `out/` directory contain expected structure? **YES** (corrected: `out/en.html` not `out/en/index.html` — same as webpack; `trailingSlash` is not set so Next.js uses `.html` suffix pattern)
  - Q3: Does the `postbuild` script (`generate-public-seo.ts`) run successfully after a Turbopack build? **YES**
  - Q4: Does `ssr-polyfills.cjs` work with Turbopack build mode? **YES**
- **Acceptance:**
  - Build exits 0 with `OUTPUT_EXPORT=1`. **PASS**
  - `out/en.html` exists and is non-empty (105,698 bytes). **PASS** (corrected path from `out/en/index.html`)
  - `out/_next/static/` directory exists with CSS/JS assets (3 entries). **PASS**
  - `postbuild` script completes without error. **PASS**
  - Decision logged: **PROCEED**.
- **Validation contract:**
  - TC-01: `cd apps/brikette && OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm exec next build --turbopack` → exits 0 **PASS**
  - TC-02: `out/en.html` exists and filesize > 0 (105,698 bytes) **PASS** (corrected from `out/en/index.html` — webpack also produces `en.html`, not `en/index.html`)
  - TC-03: `out/_next/static/` directory exists with at least 1 file (3 entries) **PASS**
  - TC-04: `postbuild` runs → `generate-public-seo.ts` exits 0 **PASS**
- **Build evidence:**
  - Turbopack build: compiled in 79s, generated 4021 static pages, exit 0
  - Output structure identical to webpack build (verified by running both)
  - `CART_COOKIE_SECRET` env validation warnings present (pre-existing, non-blocking)
  - Route hide/restore pattern works identically under Turbopack
- **Planning validation:** None: S-effort investigation task
- **Rollout / rollback:** None: non-implementation task. No files modified.
- **Documentation impact:** Decision Log entry in this plan.
- **Notes / references:**
  - Run inside `apps/brikette/` with route hide-and-restore pattern to match CI:
    `mv "src/app/[lang]/guides/[...slug]" "src/app/[lang]/guides/_slug-off"` before build,
    restore after.
  - If build fails: record error output, mark CANCEL, update fact-find Q1 with evidence.
  - After local pass, push a draft PR promptly to validate in CI. Local success does not
    guarantee CI success due to potential environment differences (Node.js version, OS).

---

### TASK-02: Add `--turbopack` to build commands

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/brikette/package.json` and `.github/workflows/brikette.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `apps/brikette/package.json`, `.github/workflows/brikette.yml`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — trivial flag addition; viability confirmed by TASK-01 (Q1 = YES).
    Rebased from 70% after TASK-01 PROCEED decision.
  - Approach: 85% — clear single-line changes at known locations; Q1 dependency resolved
  - Impact: 90% — bounded to brikette build commands; one-line rollback per location
- **Build evidence:**
  - TC-01 PASS: `grep '--turbopack' apps/brikette/package.json` matches build script
  - TC-02 PASS: `grep '--turbopack' .github/workflows/brikette.yml` matches 3 build locations (lines 104, 129, 161)
  - TC-03 PASS: satisfied by TASK-01 evidence — identical command (`next build --turbopack` with `OUTPUT_EXPORT=1`) ran successfully with webpack callback present
  - Files modified: `apps/brikette/package.json` (line 8), `.github/workflows/brikette.yml` (lines 104, 129, 161)
- **Acceptance:**
  - `apps/brikette/package.json` `build` script includes `--turbopack` flag.
  - `.github/workflows/brikette.yml` PR build step (line 104) includes `--turbopack`.
  - `.github/workflows/brikette.yml` staging `build-cmd` (line 129) includes `--turbopack`.
  - `.github/workflows/brikette.yml` production `build-cmd` (line 161) includes `--turbopack`.
  - Build succeeds locally with webpack callback still in place.
- **Validation contract (TC-XX):**
  - TC-01: `grep -- '--turbopack' apps/brikette/package.json` → matches build script
  - TC-02: `grep -- '--turbopack' .github/workflows/brikette.yml` → matches 3 build locations
  - TC-03: `cd apps/brikette && OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm exec next build --turbopack` → exits 0 (with webpack callback still present)
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** No `--turbopack` in any build command today. TC-01 and TC-02 would fail.
  - **Green:**
    1. Edit `apps/brikette/package.json:8`: change `next build` to `next build --turbopack`.
    2. Edit `.github/workflows/brikette.yml:104`: change `pnpm exec next build` to
       `pnpm exec next build --turbopack`.
    3. Edit `.github/workflows/brikette.yml:129`: change `pnpm exec next build` to
       `pnpm exec next build --turbopack`.
    4. Edit `.github/workflows/brikette.yml:161`: change `pnpm exec next build` to
       `pnpm exec next build --turbopack`.
    5. Fix CI step label at line 96: "Static export build (route hide/restore + Turbopack)" is
       now accurate (currently misleading — labels "Turbopack" but uses webpack).
  - **Refactor:** None needed.
- **Planning validation:** None: S-effort
- **Scouts:** None: all edit locations identified with exact line numbers.
- **Edge Cases & Hardening:**
  - `NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs"` must remain compatible with
    `--turbopack` builds. TASK-01 validates this.
  - `generate:static-aliases` postbuild step must work with Turbopack `out/` structure. TASK-01
    validates this.
- **What would make this >=90%:**
  - TASK-01 completes with PROCEED decision (eliminates Q1 uncertainty).
- **Rollout / rollback:**
  - Rollout: Part of single PR.
  - Rollback: Revert `--turbopack` from 4 locations (single-line changes).
- **Documentation impact:** None.
- **Notes / references:**
  - The webpack callback is intentionally left in place during this task. Next.js ignores the
    `webpack()` key when `--turbopack` is passed.

---

### TASK-03: Remove webpack callback from brikette config

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `apps/brikette/next.config.mjs`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-21)
- **Affects:** `apps/brikette/next.config.mjs`
- **Depends on:** TASK-02
- **Blocks:** TASK-04, TASK-05
- **Confidence:** 85%
  - Implementation: 85% — straightforward deletion of lines 136–162; Q1 confirmed (Turbopack works).
    Q2 (resolve.fallback not needed) confirmed by TASK-03 TC-03 build (no module-not-found errors).
    Rebased from 70% after TASK-01 PROCEED decision.
  - Approach: 85% — approach is clear (delete the block); Q1 and Q2 both resolved
  - Impact: 85% — brikette-only; rollback is restoring the block from git
- **Build evidence:**
  - TC-01 PASS: `grep -c 'webpack' apps/brikette/next.config.mjs` → 0 matches
  - TC-02 PASS: `grep 'resolveAlias' apps/brikette/next.config.mjs` → block still present (turbopack.resolveAlias intact)
  - TC-03 PASS: `OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 next build --turbopack` → exit 0, compiled in 117s, 4021 static pages, no module-not-found errors for fs/path/url/module
  - Deleted lines 136–162 (27 lines): entire `webpack(config, context) { ... }` callback including `resolve.fallback` for Node built-ins and `resolve.extensions`/`extensionAlias` overrides
  - Q2 confirmed: `resolve.fallback` for Node built-ins is NOT needed under Turbopack — Turbopack enforces server/client boundaries natively
- **Acceptance:**
  - `apps/brikette/next.config.mjs` has no `webpack` key/function.
  - `turbopack.resolveAlias` block (lines 128–135) remains unchanged.
  - `OUTPUT_EXPORT=1 next build --turbopack` still succeeds (no module-not-found errors).
- **Validation contract (TC-XX):**
  - TC-01: `grep -c 'webpack' apps/brikette/next.config.mjs` → 0 matches
  - TC-02: `grep 'resolveAlias' apps/brikette/next.config.mjs` → block still present
  - TC-03: `cd apps/brikette && OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm exec next build --turbopack` → exits 0 (no module-not-found errors for fs/path/url/module)
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** The `webpack()` callback exists at lines 136–162. TC-01 would report >0 matches.
  - **Green:**
    1. Delete lines 136–162 from `apps/brikette/next.config.mjs` (the entire `webpack: (config, context) => { ... },` block including the comment at lines 148–150).
    2. Run local build to verify no module-not-found errors.
  - **Refactor:** Remove any trailing comma or formatting artifacts from the deletion.
- **Planning validation:** None: S-effort
- **Scouts:**
  - If Q2 surfaces (module-not-found for a Node built-in in client bundle): investigate the
    import chain and either mark the package as `serverExternalPackages` in Next.js config or
    add a Turbopack-specific alias.
- **Edge Cases & Hardening:**
  - Transitive dependency importing Node built-in that reaches client bundle: caught at build
    time (TC-03). Source code comment at line 148 notes webpack's client compiler sees these
    references during analysis; Turbopack may not replicate this.
  - `sharedConfig.webpack` inheritance: after deleting the brikette-specific `webpack` override,
    `sharedConfig.webpack` is still inherited via the `...sharedConfig` spread at line 109.
    Under `--turbopack` (the intended build path), Next.js ignores the `webpack` key — no
    impact. Under a manual `next build` without `--turbopack`, the inherited shared config
    sets `@` → `template-app/src` (not `brikette/src`), producing incorrect results. Mitigation:
    all automated builds use `--turbopack` (TASK-02). For additional safety, consider updating
    `RULE_ALLOW_ANY` to require `--turbopack` for brikette builds in a follow-on task.
  - `sharedConfig.webpack` chain for other apps: removing brikette's callback does not affect
    the 13 other apps that use `--webpack` directly — they invoke the shared webpack function
    through their own config chains.
- **What would make this >=90%:**
  - TASK-01 PROCEED + TASK-02 build succeeds + no module-not-found errors in local build.
- **Rollout / rollback:**
  - Rollout: Part of single PR, after TASK-02.
  - Rollback: Restore lines 136–162 from git (`git checkout HEAD -- apps/brikette/next.config.mjs`).
- **Documentation impact:** None.
- **Notes / references:**
  - The `turbopack.resolveAlias` block already covers `@` and `@acme/design-system/utils/style`.
  - Shared aliases (`@acme/design-system`, `@acme/cms-ui`, `@acme/lib`, `@acme/seo`,
    `@themes-local`) are inherited from the shared turbopack block.

---

### TASK-04: Add CI turbopack-build validation job

- **Type:** IMPLEMENT
- **Deliverable:** code-change to `.github/workflows/brikette.yml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `.github/workflows/brikette.yml`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — adding a CI step is well-understood; existing `turbopack-smoke` job
    provides a template.
    Held-back test: no single unresolved unknown would drop this below 80 because the CI step
    structure is standard YAML, the build command is identical to what TASK-01 validates locally,
    and the assertion (`out/en/index.html` exists) is a simple file check.
  - Approach: 85% — clear pattern from existing turbopack-smoke CI job
  - Impact: 85% — adds safety net for future regressions; no downside
- **Acceptance:**
  - `.github/workflows/brikette.yml` contains a build validation step (in the existing PR job
    or as a new step) that runs `OUTPUT_EXPORT=1 next build --turbopack` and asserts output.
  - The step runs on PR events.
- **Validation contract (TC-XX):**
  - TC-01: `.github/workflows/brikette.yml` contains a step asserting `out/en.html` exists
    after the turbopack build (corrected from `out/en/index.html` per TASK-01 evidence — Next.js
    uses `.html` suffix pattern with `trailingSlash: false`)
  - TC-02: The build step already exists at line 96 (the PR job "Static export build" step) —
    after TASK-02 it already uses `--turbopack`. Validation needs adding: an assertion step
    after the build that checks `test -f apps/brikette/out/en.html`.
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** No output validation after the CI build step. Build success is verified only by exit
    code, not by checking the `out/` contents.
  - **Green:**
    1. Add a validation step after the existing build step (line 96 block) in the PR job:
       ```yaml
       - name: Validate static export output
         run: |
           test -f apps/brikette/out/en.html
           test -d apps/brikette/out/_next/static
       ```
  - **Refactor:** None needed.
- **Planning validation:** None: S-effort
- **Scouts:** None: CI YAML structure is deterministic.
- **Edge Cases & Hardening:** None: simple file existence check.
- **What would make this >=90%:**
  - CI passes with the new validation step in a PR.
- **Rollout / rollback:**
  - Rollout: Part of single PR.
  - Rollback: Remove the validation step.
- **Documentation impact:** None.
- **Notes / references:**
  - The staging and production `build-cmd` blocks run through the reusable workflow and don't
    need separate output validation — deployment itself validates the output.

---

### TASK-05: Full verification pass (tests + policy)

- **Type:** IMPLEMENT
- **Deliverable:** Verification evidence recorded in this plan's Decision Log
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `[readonly] apps/brikette/`, `[readonly] scripts/check-next-webpack-flag.mjs`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — running existing test suite and policy check; no new code.
    Guardrail exception: exceeds fact-find baseline (72%) by 13 points. Justified because
    TASK-05 runs after TASK-01 completes (new evidence), and its uncertainty is test regression
    risk (not Q1 feasibility) — a domain independent of the fact-find's Q1 uncertainty.
  - Approach: 85% — well-defined commands; governed test runner and policy script
  - Impact: 90% — confirms nothing is broken; no risk from running tests
- **Acceptance:**
  - Brikette Jest suite passes (governed runner, all shards).
  - `scripts/check-next-webpack-flag.mjs --all` passes.
  - `pnpm typecheck` passes for brikette.
- **Validation contract (TC-XX):**
  - TC-01: `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --no-coverage` → exits 0
  - TC-02: `node scripts/check-next-webpack-flag.mjs --all` → exits 0
  - TC-03: `pnpm --filter @apps/brikette typecheck` → exits 0
- **Execution plan:** Red -> Green -> Refactor
  - **Red:** Not applicable — this is a verification task. Tests should already pass.
  - **Green:**
    1. Run governed Jest suite for brikette.
    2. Run webpack policy check.
    3. Run typecheck.
    4. Record results in Decision Log.
  - **Refactor:** If any test fails, investigate and fix before marking complete. Any fix
    constitutes new scope — if non-trivial, add a follow-up task.
- **Planning validation:** None: S-effort
- **Scouts:** None: all commands known.
- **Edge Cases & Hardening:**
  - 13 tests currently skipped with `describe.skip` on brikette (pre-existing, not related to
    this migration). These should remain skipped; do not attempt to fix them in this scope.
- **What would make this >=90%:**
  - All three commands pass on first attempt.
- **Rollout / rollback:**
  - Rollout: Part of single PR verification.
  - Rollback: None: read-only verification task.
- **Documentation impact:** Decision Log entry in this plan.
- **Notes / references:**
  - The 13 pre-existing skipped tests are documented in memory; they are unrelated to webpack
    removal.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `next build --turbopack` + `output: 'export'` not supported | Medium | High (blocks scope) | TASK-01 gate; if FAIL → cancel plan, no residual changes |
| Module-not-found for Node built-in without `resolve.fallback` | Low | Medium (build error) | TASK-03 TC-03 catches at build time; fix via `serverExternalPackages` |
| Turbopack static export output differs from webpack | Low | Medium (deploy breaks) | TASK-04 validates output structure; TASK-01 compares critical paths |
| `postbuild` script depends on webpack output structure | Low | Medium (SEO missing) | TASK-01 Q3 validates postbuild |
| `ssr-polyfills.cjs` incompatible with Turbopack build | Low | Low (build fails fast) | TASK-01 Q4 validates; already works in Turbopack dev |
| Catch-all route hide/restore breaks under Turbopack | Very Low | High (guide 404s) | Pattern operates on source tree, not bundler; TASK-01 uses same pattern |
| Inherited `sharedConfig.webpack` breaks manual non-Turbopack builds | Medium | Medium (broken dev build) | All automated builds use `--turbopack` (TASK-02); manual builds are developer responsibility; consider follow-on to enforce `--turbopack` in policy matrix |

## Observability

- Logging: Build log header switches from "webpack" to "Turbopack" after TASK-02.
- Metrics: Compare build time before/after (Turbopack is typically faster).
- Alerts/Dashboards: Monitor first Cloudflare Pages deployment after merge: navigate `/en/` and
  a guide page to confirm content renders.

## Acceptance Criteria (overall)

- [ ] `OUTPUT_EXPORT=1 next build --turbopack` produces correct `out/` artifact
- [ ] `apps/brikette/next.config.mjs` has no `webpack()` key
- [ ] All brikette tests pass (governed runner)
- [ ] `check-next-webpack-flag.mjs --all` passes
- [ ] CI brikette workflow green
- [ ] Cloudflare Pages deployment renders `/en/` and guide pages correctly

## Decision Log

- 2026-02-21: Plan created. TASK-01 gates the entire plan on Turbopack static export support.
- 2026-02-21: **TASK-01 PROCEED.** Turbopack static export confirmed working (Next.js 16.1.6). Build exits 0, 4021 pages generated in 79s, output structure identical to webpack (`out/en.html` pattern, not `out/en/index.html`). `ssr-polyfills.cjs` compatible. `postbuild` succeeds. Corrected TC-02/TASK-04 path from `out/en/index.html` to `out/en.html`. Rebased TASK-02 70%→85%, TASK-03 70%→85%. Overall confidence rebased 79%→85%.
- 2026-02-21: **TASK-02 Complete.** `--turbopack` added to package.json build script and all 3 CI build locations (lines 104, 129, 161). TC-01/TC-02 pass. TC-03 satisfied by TASK-01 evidence (same command, same codebase). TASK-03 now unblocked.
- 2026-02-21: **TASK-03 Complete.** Webpack callback (27 lines, 136–162) deleted from `apps/brikette/next.config.mjs`. TC-01: 0 webpack references remain. TC-02: turbopack resolveAlias block intact. TC-03: build exit 0 (117s, 4021 pages, no module-not-found errors). Q2 confirmed: `resolve.fallback` for Node built-ins is not needed under Turbopack. TASK-04 and TASK-05 now unblocked (Wave 4, parallel).

## Overall-confidence Calculation

- TASK-01: 90% × 1 (S) = 90 — Complete
- TASK-02: 85% × 1 (S) = 85 — rebased from 70% after TASK-01 PROCEED
- TASK-03: 85% × 1 (S) = 85 — rebased from 70% after TASK-01 PROCEED
- TASK-04: 80% × 1 (S) = 80
- TASK-05: 85% × 1 (S) = 85
- Overall-confidence = (90 + 85 + 85 + 80 + 85) / 5 = **85%**

All tasks now >=80%. Plan is auto-build eligible.

## Edge-Case Review

| Edge Case | Assessed In | Handling |
|---|---|---|
| `ssr-polyfills.cjs` under Turbopack build | TASK-01 Q4 | Validated by TASK-01 build run |
| `postbuild` (`generate-public-seo.ts`) output assumptions | TASK-01 Q3 | Validated by TASK-01 build run |
| Catch-all route hide/restore pattern | TASK-01 notes | Uses same pattern as CI; TASK-01 validates |
| Transitive Node built-in in client bundle | TASK-03 scouts | Caught at build time; `serverExternalPackages` fallback |
| `generate:static-aliases` on Turbopack `out/` | TASK-01 | Runs as part of CI build; validated implicitly |
| Pre-existing skipped tests (13 `describe.skip`) | TASK-05 | Left as-is; unrelated to migration |
| Concurrent Turbo cache (webpack + Turbopack apps) | N/A | Builds are isolated per app; no cache interference |

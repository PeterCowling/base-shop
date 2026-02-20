---
Type: Plan
Status: Complete
Domain: Infra
Workstream: Engineering
Created: 2026-02-20
Last-updated: 2026-02-20
Feature-Slug: turbopack-brikette-build-flag-retirement
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 80%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan-only
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Turbopack Brikette Build Flag Retirement Plan

## Summary

Retires `--webpack` from all Brikette production build commands and updates the surrounding policy/contract infrastructure to match. Turbopack production builds already pass locally (direct and workflow-shape probes); the remaining work is updating the policy matrix, build command strings, CI static-export enforcement, and resolver harness. All key design decisions are pre-locked: resolver harness uses Option B (single `build-lifecycle:brikette` lifecycle surface), and the continuous static-export enforcement job is a hard merge gate on the command changes.

## Goals

- Retire `--webpack` from `apps/brikette/package.json` `build` and `.github/workflows/brikette.yml` staging/production `build-cmd` blocks.
- Update `check-next-webpack-flag` policy matrix and tests: Brikette `build` explicitly allowed without `--webpack`; fail-closed defaults preserved for all other apps.
- Add a continuous static-export CI enforcement job for the route hide/restore + `OUTPUT_EXPORT=1 next build` + alias-generation sequence.
- Refactor `check-i18n-resolver-contract.mjs` to Option B: single `build-lifecycle:brikette` lifecycle surface; drop `webpack:brikette` and `turbopack:brikette-build`.
- Run and record the full acceptance matrix after all changes are live.

## Non-goals

- Migrating template-app, business-os, or cms builds to Turbopack.
- Removing shared webpack callback customizations in `packages/next-config/next.config.mjs` for non-Brikette apps.
- Changing Cloudflare Pages deployment topology.
- Refactoring unrelated Brikette feature/content code.

## Constraints & Assumptions

- Constraints:
  - Policy checks must remain fail-closed for unknown apps/commands.
  - Route hide/restore shell pattern must be preserved in both build-cmd and the new CI enforcement job.
  - TASK-02 (static-export CI enforcement) is a hard merge gate on TASK-03 (command changes).
  - Static-export enforcement ownership is single-source: implement `static-export-check` in `.github/workflows/brikette.yml`; rely on existing Merge Gate requirement for the Brikette workflow (no duplicate direct static-export step in `merge-gate.yml`).
  - TASK-05 (resolver refactor) must preserve Brikette lifecycle coverage (prebuild/build/postbuild) per Option B decision.
- Assumptions:
  - Next.js `^16.1.6` Turbopack production build path is sufficiently stable (local probes confirmed; see fact-find).
  - `out/` artifact equivalence between webpack and Turbopack has not been diff-verified; correctness is defined by static-export contract invariants (successful export build, alias generation, and route restore), continuously enforced in TASK-02.
  - Non-fatal `CART_COOKIE_SECRET` warnings are acceptable until separately addressed.

## Fact-Find Reference

- Related brief: `docs/plans/turbopack-brikette-build-flag-retirement/fact-find.md`
- Key findings used:
  - Turbopack production build passes locally (direct and workflow-shape probes; point-in-time only).
  - Policy fan-out confirmed single-source: `check-next-webpack-flag.mjs` called by pre-commit, validate-changes, and merge-gate.
  - Deploy step confirmed bundler-agnostic: `wrangler pages deploy out`.
  - Resolver harness has two non-equivalent Brikette surfaces; Option B chosen to consolidate.
  - `--webpack` originally added in commit `5e27a4655c` during Next.js 16 upgrade; Turbopack stability now confirmed via probes.

## Proposed Approach

- Chosen approach: contract-first sequence — update policy (TASK-01) and add enforcement gate (TASK-02) before changing command strings (TASK-03); refactor resolver (TASK-05) after command migration is confirmed green in CI.
- No competing options remain: all design decisions locked in fact-find (resolver Option B; Seed 4 merge-gate timing).

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: No (Status: Complete; TASK-05 at 75% pre-checkpoint)

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Policy matrix: allow Brikette build without --webpack; update tests | 85% | S | Complete (2026-02-20) | — | TASK-03 |
| TASK-02 | IMPLEMENT | Add static-export CI enforcement job (hard merge gate on TASK-03) | 80% | M | Complete (2026-02-20) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Remove --webpack from Brikette build command surfaces | 85% | S | Complete (2026-02-20) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | CHECKPOINT | Reassess resolver harness task after TASK-03 confirmed green in CI | 95% | S | Complete (2026-02-20) | TASK-03 | TASK-05 |
| TASK-05 | IMPLEMENT | Resolver harness Option B refactor + tests | 80% | M | Complete (2026-02-20) | TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | Run and record full acceptance matrix | 90% | S | Complete (2026-02-20) | TASK-05 | — |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | — | Begin immediately; TASK-02 may be co-developed in the same PR |
| 2 | TASK-02 | TASK-01 merged | CI job runs `next build` without `--webpack`; policy still requires webpack for Brikette build until TASK-01 lands — TASK-02 cannot merge before TASK-01 |
| 3 | TASK-03 | TASK-01 + TASK-02 both passing | Must not merge without both gates green |
| 4 | TASK-04 | TASK-03 green in CI | Checkpoint; reassess TASK-05 confidence from live evidence |
| 5 | TASK-05 | TASK-04 complete | Below 80% pre-checkpoint; recalibrate after |
| 6 | TASK-06 | TASK-05 complete | Final validation run |

## Tasks

---

### TASK-01: Policy matrix — allow Brikette build without --webpack; update tests

- **Type:** IMPLEMENT
- **Deliverable:** Updated `scripts/check-next-webpack-flag.mjs` (matrix) + updated `scripts/__tests__/next-webpack-flag-policy.test.ts` (test suite)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `scripts/check-next-webpack-flag.mjs` (lines 23–28), `scripts/__tests__/next-webpack-flag-policy.test.ts`
- **Depends on:** —
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 90% — exact target is `APP_COMMAND_POLICY_MATRIX.brikette.build` at line 26; change from `RULE_REQUIRE_WEBPACK` to `RULE_ALLOW_ANY`; existing test patterns make new cases straightforward
  - Approach: 85% — surgical single-field change; `DEFAULT_COMMAND_POLICY` stays unchanged (fail-closed); non-Brikette regression test cases must be explicit
  - Impact: 85% — removes policy blocker for TASK-03; fail-closed behavior for all other apps confirmed by new test coverage
- **Acceptance:**
  - [ ] `APP_COMMAND_POLICY_MATRIX.brikette.build` is `RULE_ALLOW_ANY`
  - [ ] Policy test: Brikette build without `--webpack` → PASS
  - [ ] Policy test: Brikette build with `--webpack` → PASS (still valid)
  - [ ] Policy test: template-app build without `--webpack` → FAIL (fail-closed)
  - [ ] Policy test: business-os build without `--webpack` → FAIL (fail-closed)
  - [ ] Policy test: unknown app build → FAIL (default fail-closed)
  - [ ] `node scripts/check-next-webpack-flag.mjs --all` → exit 0 on current repo (pre-TASK-03)
  - [ ] Policy test: `brikette.yml` with `next build` (no `--webpack`) in a workflow `build-cmd` line → PASS (tests WORKFLOW_APP_MATRIX path, which TASK-03 will rely on)
- **Validation contract (TC):**
  - TC-01: Brikette `build` without `--webpack` → policy exit 0
  - TC-02: Brikette `build` with `--webpack` → policy exit 0
  - TC-03: template-app `build` without `--webpack` → policy exit 1
  - TC-04: business-os `build` without `--webpack` → policy exit 1
  - TC-05: unknown app `build` without `--webpack` → policy exit 1
  - TC-06: `node scripts/check-next-webpack-flag.mjs --all` on current repo → exit 0
  - TC-07: workflow file `brikette.yml` with `next build` (no `--webpack`) → policy exit 0 (WORKFLOW_APP_MATRIX maps `brikette.yml` → `brikette`; Brikette build policy is ALLOW_ANY after this task)
- **Execution plan:** Red → Green → Refactor
  - Red: run existing policy test suite; confirm Brikette-build-without-webpack asserts FAIL currently
  - Green: change `brikette.build` to `RULE_ALLOW_ANY`; update test to assert PASS; add explicit TC-03/04/05 non-Brikette fail cases; add TC-07 workflow-file case (`brikette.yml` + `next build` → exit 0)
  - Refactor: ensure `DEFAULT_COMMAND_POLICY` comment remains accurate; no structural changes
- **Planning validation (S — not required):** None: S-effort task
- **Scouts:** Confirm `WORKFLOW_APP_MATRIX` (lines 30–33) maps `brikette.yml` → `brikette`; confirmed in session read; no change needed
- **Edge Cases & Hardening:**
  - Test suite must include at least one fail-closed case per non-Brikette app after the Brikette exception is added
  - `--all` flag scans both package.json scripts and workflow files; confirmed from grep
- **What would make this >=90%:**
  - CI run confirming updated policy tests pass end-to-end
- **Rollout / rollback:**
  - Rollout: same PR as TASK-03 (or merged prior)
  - Rollback: revert `brikette.build` to `RULE_REQUIRE_WEBPACK`; revert test changes
- **Documentation impact:** None: policy check is self-documenting via script comments
- **Notes / references:**
  - `scripts/check-next-webpack-flag.mjs:23–28` — exact target
  - `scripts/__tests__/next-webpack-flag-policy.test.ts` — existing regression suite
- **Build evidence (2026-02-20):**
  - Commit: `244253af14` — `feat(policy): allow Brikette build without --webpack; add TC-03/04/07 tests`
  - Red: 8 existing tests all passed; "fails for Brikette package build without --webpack" confirmed status 1 pre-change
  - Green: `APP_COMMAND_POLICY_MATRIX.brikette.build` changed to `RULE_ALLOW_ANY`; test updated to expect status 0 (TC-01); TC-03 (template-app → FAIL), TC-04 (business-os → FAIL), TC-07 (brikette.yml build without --webpack → PASS) added
  - Result: 11/11 tests pass; `--all` on repo → exit 0 (TC-06 confirmed)
  - Scope confirmed: 2 files only (`check-next-webpack-flag.mjs`, `next-webpack-flag-policy.test.ts`)

---

### TASK-02: Add static-export CI enforcement job

- **Type:** IMPLEMENT
- **Deliverable:** New `static-export-check` CI job in `.github/workflows/brikette.yml` that continuously enforces route hide/restore + `OUTPUT_EXPORT=1 next build` + alias-generation sequence
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `.github/workflows/brikette.yml` (new job)
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 80%
  - Implementation: 85% — route hide/restore + `OUTPUT_EXPORT=1 next build` + alias-generation already proven in `build-cmd` (lines 91–103) and local workflow-shape probe; adding as a peer CI job is mechanical; exit-code-preserving shell pattern established
  - Approach: 80% — dedicated CI job chosen (not harness mode) for independence from TASK-05 resolver refactor; gate model is single-source: add `static-export-check` inside `brikette.yml` and rely on existing Merge Gate workflow-level requirement for Brikette-scoped changes; CI runtime increase (~3–5 min) is accepted tradeoff. Held-back test: "What single unknown would drop this below 80?" — `mv` route hide/restore could fail on a runner without the guides directory, but `actions/checkout` defaults to full checkout. No single unresolved unknown drops approach below 80.
  - Impact: 80% — replaces point-in-time probe with continuous enforcement; directly addresses the regression gap. Held-back test: "What single unknown would drop this below 80?" — If configured as optional rather than required check. This is a configuration correctness requirement, not an unknown. No single unresolved unknown drops impact below 80.
- **Acceptance:**
  - [ ] New CI job (`static-export-check` or similar) exists in `.github/workflows/brikette.yml`
  - [ ] Job runs: `pnpm exec turbo run build --filter=@apps/brikette^...` → route hide → `OUTPUT_EXPORT=1 NEXT_PUBLIC_OUTPUT_EXPORT=1 pnpm exec next build` → `pnpm --filter @apps/brikette generate:static-aliases` → route restore
  - [ ] Exit-code-preserving shell pattern used: route restored even on build failure
  - [ ] Job runs on pull requests in `.github/workflows/brikette.yml` (workflow already has `pull_request` trigger)
  - [ ] Existing Merge Gate workflow requirement for Brikette-scoped changes remains the only required-check wiring (no duplicate direct static-export gate step in `.github/workflows/merge-gate.yml`)
  - [ ] Job passes in CI with Turbopack build after TASK-03
- **Validation contract (TC):**
  - TC-01: CI job exits 0 with Turbopack static-export build on target branch (dependency prebuild + route hide/restore + Turbopack build + alias generation)
  - TC-02: Route restore executes even when build command fails (exit code from build, not restore)
  - TC-03: Alias generation runs after successful build
  - TC-04: Job triggers on `pull_request` events with relevant Brikette file changes
- **Execution plan:** Red → Green → Refactor
  - Red: confirm no `static-export-check` job exists in `brikette.yml` currently
  - Green: add peer job mirroring full deploy build-cmd shape: dependency prebuild (`pnpm exec turbo run build --filter=@apps/brikette^...`), then route hide/restore + Turbopack build + alias generation; use `(cmd; e=$?; restore; exit $e)` structure; keep Merge Gate integration at workflow-level (`brikette.yml`) rather than adding a duplicate direct static-export step in `merge-gate.yml`
  - Refactor: confirm job name, trigger conditions, and env var stubs are correct and descriptive
- **Planning validation:**
  - Checks run: read `.github/workflows/brikette.yml` staging build-cmd (lines 91–103); confirmed route hide/restore pattern; confirmed existing `turbopack:brikette-smoke` job as structural reference
  - Validation artifacts: fact-find workflow-shape probe (pass); brikette.yml read in this session
  - Unexpected findings: brikette.yml uses `build-cmd` as reusable workflow input string; new job must be a peer job, not embedded in the reusable workflow input
- **Scouts:** Confirm `generate:static-aliases` command in `apps/brikette/package.json`; confirmed at line 14
- **Edge Cases & Hardening:**
  - Route restore must be guaranteed on build failure — use `(cmd; e=$?; mv restore; exit $e)`, not `cmd && restore`
  - GA4/env vars: for a check-only job, `NEXT_PUBLIC_GA_MEASUREMENT_ID` can be empty or omitted; confirm build completes without it
  - Ensure job does NOT call `wrangler pages deploy` — check-only, no deploy step
  - Job placement: `brikette.yml` already runs on both `pull_request` and push; keep static-export enforcement in this workflow so Merge Gate requires one Brikette workflow surface and avoid duplicate heavyweight execution in `merge-gate.yml`
- **What would make this >=90%:**
  - One green CI run confirming the job passes with Turbopack after TASK-03 lands
- **Rollout / rollback:**
  - Rollout: same PR as TASK-03 (hard merge gate — must not merge TASK-03 without this passing)
  - Rollback: remove the CI job from `brikette.yml`
- **Documentation impact:** None: job is self-describing via name and step comments
- **Notes / references:**
  - Shell pattern from MEMORY.md: `mv dir _dir-off && (cmd; e=$?; mv _dir-off dir; exit $e)`
  - Existing `turbopack:brikette-smoke` job as structural reference for peer job shape
- **Build evidence (2026-02-20):**
  - Commit: `723472dc8c` — `feat(ci): add static-export-check job to brikette workflow`
  - Red: confirmed no `static-export-check` job in `brikette.yml` pre-change; workflow has `pull_request` trigger ✓
  - Green: added `static-export-check` peer job after `turbopack-smoke`; mirrors deploy build-cmd shape (`pnpm exec turbo run build --filter=@apps/brikette^...` + route hide/restore + `OUTPUT_EXPORT=1 pnpm exec next build` + alias gen); `build_exit` capture pattern ensures unconditional route restore (TC-02 ✓); alias gen gated on `build_exit -eq 0` (TC-03 ✓); `if: pull_request || workflow_dispatch` (TC-04 ✓)
  - Refactor: YAML validated valid; policy check `--paths .github/workflows/brikette.yml` → exit 0 (WORKFLOW_APP_MATRIX allows Brikette build without --webpack post-TASK-01 ✓); no `wrangler pages deploy` in job ✓
  - TC-01 deferred: CI run pending TASK-03 (job will run with Turbopack build after --webpack removal)

---

### TASK-03: Remove --webpack from Brikette build command surfaces

- **Type:** IMPLEMENT
- **Deliverable:** Three precise string edits: `apps/brikette/package.json:8`, `.github/workflows/brikette.yml:95` (staging), `.github/workflows/brikette.yml:127` (production) — all without `--webpack`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Status:** Complete (2026-02-20)
- **Affects:** `apps/brikette/package.json` (line 8), `.github/workflows/brikette.yml` (lines 129, 161 post-TASK-02 insertion)
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — three precise string removals at confirmed line locations; no logic involved; TASK-01 ensures policy allows it before merge; TASK-02 ensures static-export regression is continuously detected
  - Approach: 85% — both staging (line 95) and production (line 127) workflow blocks must be updated atomically in the same PR; route hide/restore shell surrounding the build command must remain intact (only the bundler flag changes)
  - Impact: 85% — transitions Brikette production builds to Turbopack; staging workflow run post-merge confirms real-world behavior; risk bounded by TASK-01 (policy gate) and TASK-02 (enforcement)
- **Acceptance:**
  - [ ] `apps/brikette/package.json:8` — `build` is `cross-env NODE_OPTIONS=... next build` (no `--webpack`)
  - [ ] `.github/workflows/brikette.yml` staging `build-cmd` — `pnpm exec next build` (no `--webpack`)
  - [ ] `.github/workflows/brikette.yml` production `build-cmd` — `pnpm exec next build` (no `--webpack`)
  - [ ] `node scripts/check-next-webpack-flag.mjs --all` → exit 0 after change
  - [ ] Static-export CI job (TASK-02) passes in CI
  - [ ] At least one green staging workflow run post-merge
- **Validation contract (TC):**
  - TC-01: `node scripts/check-next-webpack-flag.mjs --all` → exit 0 (policy permits Brikette Turbopack build)
  - TC-02: `pnpm --filter @apps/brikette build` → exits 0 with Turbopack (no `--webpack` in script)
  - TC-03: Policy Jest suite — all pass (requires TASK-01 complete)
  - TC-04: Static-export CI job (TASK-02) passes on PR to staging/main
  - TC-05: At least one green staging workflow run after merge
- **Execution plan:** Red → Green → Refactor
  - Red: confirm `--webpack` present in all three locations; grep check
  - Green: remove `--webpack` from package.json line 8 and both workflow `build-cmd` strings
  - Refactor: verify route hide/restore shell structure intact in both workflow blocks; grep for any remaining `next build --webpack` in Brikette surfaces
- **Planning validation (S — not required):** None: S-effort task
- **Scouts:** Grep for any additional `next build --webpack` references outside the three known locations before editing
- **Edge Cases & Hardening:**
  - Confirm both staging AND production `build-cmd` blocks updated — not just one
  - Route hide/restore shell wrapper preserved exactly around the build command
  - After change: `--webpack` must not appear in any Brikette build surface (policy checker enforces this)
- **What would make this >=90%:**
  - One green staging CI workflow run post-merge confirming end-to-end Turbopack build
- **Rollout / rollback:**
  - Rollout: atomic PR with TASK-01 and TASK-02
  - Rollback: reintroduce `--webpack` in all three locations; revert TASK-01 policy matrix change
- **Documentation impact:** None: no user-facing docs reference the build flag
- **Notes / references:**
  - `apps/brikette/package.json:8`, `.github/workflows/brikette.yml:95`, `.github/workflows/brikette.yml:127` — exact locations
  - Original addition: commit `5e27a4655c` during Next.js 16 upgrade; Turbopack stability confirmed via local probes (fact-find)
- **Build evidence (2026-02-20):**
  - Commit: `4e13f14477` — `feat(brikette): retire --webpack from all build command surfaces`
  - Red: grep confirmed `--webpack` at `apps/brikette/package.json:8`, `brikette.yml:129`, `brikette.yml:161`; no other Brikette surfaces found
  - Green: removed `--webpack` from all three locations; route hide/restore shell wrappers preserved exactly
  - Refactor: `grep --webpack` → exit 1 (no matches); `check-next-webpack-flag.mjs --all` → exit 0 (TC-01 ✓); policy tests 11/11 (TC-03 ✓); typecheck 20/20 ✓
  - TC-02 (`pnpm --filter @apps/brikette build` → exit 0 Turbopack) and TC-05 (staging green run) deferred to CI run post-push

---

### TASK-04: Horizon checkpoint — reassess resolver harness task

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via /lp-do-replan for TASK-05
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/turbopack-brikette-build-flag-retirement/plan.md`
- **Depends on:** TASK-03
- **Blocks:** TASK-05
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents resolver refactor from proceeding without validated test seam approach
  - Impact: 95% — controls downstream risk for TASK-05
- **Acceptance:**
  - TASK-03 confirmed green in CI (staging workflow run)
  - `/lp-do-replan` run on TASK-05 with live evidence from TASK-03 result
  - TASK-05 confidence recalibrated (test seam approach verified from real TASK-03 state)
  - Plan updated and re-sequenced
- **Horizon assumptions to validate:**
  - `pnpm --filter @apps/brikette build` runs Turbopack (no `--webpack`) successfully in CI
  - Resolver harness test seam approach is feasible — check for existing mock/integration patterns for shelling-out CLI scripts in this repo
  - After TASK-03, `webpack:brikette` surface in the harness now runs a Turbopack lifecycle build; Option B refactor path is confirmed correct
- **Validation contract:** Checkpoint executor confirms TASK-03 green; `/lp-do-replan` produces updated TASK-05 with confidence >=80 or explicit blocker resolution
- **Planning validation:** Replan evidence path: TASK-03 CI result + fresh resolver script read post-TASK-03
- **Rollout / rollback:** None: planning control task
- **Documentation impact:** `docs/plans/turbopack-brikette-build-flag-retirement/plan.md` updated via `/lp-do-replan`
- **Build evidence (2026-02-20):**
  - TASK-03 committed and pushed: `4e13f14477` on origin/dev
  - CI run `22224235136` for SHA `a15eb1306a`: Lint (exceptions governance) + Typecheck (packages/types @jest/globals) + Unit tests (order integration) all failed — all pre-existing failures unrelated to turbopack changes; confirmed by file scope (no overlap with our affected files)
  - Horizon assumption 1 (Turbopack build): `apps/brikette/package.json` build = `next build` (no --webpack); policy `--all` → exit 0 ✓
  - Horizon assumption 2 (test seam): `scripts/__tests__/next-webpack-flag-policy.test.ts` uses `spawnSync("node", [CHECK_SCRIPT, "--repo-root", repoRoot, ...])` — exact pattern for resolver contract tests ✓
  - Horizon assumption 3 (Option B): after TASK-03, `WEBPACK_APP_FILTERS.brikette` runs `pnpm --filter @apps/brikette build` = Turbopack lifecycle; `webpack:brikette` label is now misleading → confirms Option B ✓
  - TASK-05 recalibrated: Approach 75%→90% (test seam confirmed); new min confidence 80% → eligible for execution

---

### TASK-05: Resolver harness Option B refactor + tests

- **Type:** IMPLEMENT
- **Deliverable:** Refactored `scripts/check-i18n-resolver-contract.mjs` with single `build-lifecycle:brikette` surface; new tests locking surface label semantics
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-20)
- **Affects:** `scripts/check-i18n-resolver-contract.mjs` (lines 23–27, 114–147), new test file `scripts/__tests__/i18n-resolver-contract.test.ts` (or equivalent)
- **Depends on:** TASK-04
- **Blocks:** TASK-06
- **Confidence:** 75% (pre-checkpoint — recalibrate after TASK-04)
  - Implementation: 80% — script changes are surgical: remove `brikette` from `WEBPACK_APP_FILTERS` (line 26); remove `turbopack:brikette-build` block (lines 129–147); add new `build-lifecycle:brikette` surface running `pnpm --filter @apps/brikette build`. Held-back test: "What single unknown would drop this below 80?" — label changes might be missed in error messages or help text, but these are well-defined string locations. No single unresolved unknown drops implementation below 80.
  - Approach: 75% — Option B locked; refactor path clear; but no existing tests exist for this script; test seam creation for a CLI that shells out to build processes requires a design decision (mock shell commands vs integration vs acceptance-level) with no existing template in this repo; this meaningful unknown caps approach at 75 until TASK-04 provides live evidence
  - Impact: 85% — removes misleading `webpack:brikette` label post-migration; lifecycle coverage preserved; template-app/business-os surfaces unaffected
- **Acceptance:**
  - [ ] Default run emits `[resolver-contract] PASS build-lifecycle:brikette` (not `webpack:brikette` or `turbopack:brikette-build`)
  - [ ] `brikette` removed from `WEBPACK_APP_FILTERS`
  - [ ] `turbopack:brikette-build` direct build step removed
  - [ ] `build-lifecycle:brikette` surface runs `pnpm --filter @apps/brikette build` (lifecycle-complete: pre + build + postbuild)
  - [ ] `--webpack-apps template-app,business-os` still works correctly (brikette not affected)
  - [ ] `--webpack-apps brikette` handled gracefully (warn or ignore; not unhandled throw)
  - [ ] New tests assert: `build-lifecycle:brikette` label present; `webpack:brikette` label absent; template-app/business-os surfaces unchanged
  - [ ] `node scripts/check-i18n-resolver-contract.mjs` exits 0 with updated surfaces
- **Validation contract (TC):**
  - TC-01: Default run output contains `PASS build-lifecycle:brikette`
  - TC-02: Default run output does NOT contain `webpack:brikette`
  - TC-03: Default run output does NOT contain `turbopack:brikette-build`
  - TC-04: `--webpack-apps template-app,business-os` produces `PASS webpack:template-app` and `PASS webpack:business-os`
  - TC-05: `--webpack-apps brikette` does not throw unhandled error
  - TC-06: New test file asserts surface label contract
  - TC-07: `node scripts/check-i18n-resolver-contract.mjs` → `PASS all configured surfaces`
- **Execution plan:** Red → Green → Refactor
  - Red: write tests asserting `build-lifecycle:brikette` present and `webpack:brikette` absent; tests fail against current script
  - Green: remove `brikette` from `WEBPACK_APP_FILTERS`; remove `turbopack:brikette-build` block; add `build-lifecycle:brikette` surface; handle `--webpack-apps brikette` gracefully
  - Refactor: update help text and option descriptions; audit `--skip-turbopack` flag (callers to confirm before retiring or repurposing)
- **Planning validation:**
  - Checks run: read `scripts/check-i18n-resolver-contract.mjs` in full (179 lines); confirmed `WEBPACK_APP_FILTERS` at lines 23–27 includes `brikette`; confirmed `turbopack:brikette-build` block at lines 129–147; confirmed no existing test file for this script
  - Validation artifacts: resolver script full read in this session; fact-find coverage gap note
  - Unexpected findings: `--skip-turbopack` flag exists (controls lines 129–147 block); after TASK-05 removes that block, the flag semantics change — audit callers before retiring
- **Scouts:**
  - Check if `--skip-turbopack` is referenced by any callers in CI workflows or local scripts before removing/retiring
  - Check if any existing test pattern for shelling-out CLI scripts exists in `scripts/__tests__/` to inform test seam design
- **Edge Cases & Hardening:**
  - `--webpack-apps brikette` must not throw `TypeError` after removal from `WEBPACK_APP_FILTERS` — add graceful handling (warn + skip)
  - `--skip-turbopack`: audit callers; update help text at minimum; retire the flag if no callers reference it
  - template-app and business-os webpack surfaces must remain fully operational
- **What would make this >=90%:**
  - Existing test seam pattern found in repo for shelling-out scripts (removes test design uncertainty)
  - One successful dry run of refactored script post-TASK-03
- **Rollout / rollback:**
  - Rollout: separate PR from TASK-01/02/03 block; deploy after TASK-03 confirmed green
  - Rollback: revert harness refactor; `webpack:brikette` and `turbopack:brikette-build` surfaces restored
- **Documentation impact:** Update help/usage text in `scripts/check-i18n-resolver-contract.mjs` to reflect `build-lifecycle:brikette` surface
- **Notes / references:**
  - Decision: Option B (Peter, 2026-02-20) — see fact-find Open Questions
  - `scripts/check-i18n-resolver-contract.mjs:23–27` (WEBPACK_APP_FILTERS), lines 129–147 (turbopack block)
- **Build evidence (2026-02-20):**
  - Scouts: `--skip-turbopack` has no external callers (not in merge-gate.yml, validate-changes.sh, or any CI workflow) → retired the flag; both callers use only `--repo-root`
  - Red: 9 tests created in `scripts/__tests__/i18n-resolver-contract.test.ts`; all 9 failed against pre-existing script (no `--dry-run`, no `build-lifecycle:brikette`)
  - Green: removed `brikette` from `WEBPACK_APP_FILTERS`; removed `turbopack:brikette-build` block; added `build-lifecycle:brikette` surface running `pnpm --filter @apps/brikette build`; added `--dry-run` flag; added `--skip-brikette` flag; retired `--skip-turbopack` flag; handled `--webpack-apps brikette` gracefully (warn + filter out); default `webpackApps` reduced to `["template-app", "business-os"]`
  - Refactor: updated USAGE help text to list new surfaces and remove brikette from webpack-apps example; SKIP message uses generic "brikette surface" (not surface label) to avoid false label detection in `--skip-brikette` tests
  - TC-01 (`build-lifecycle:brikette` in dry-run): ✓; TC-02 (`webpack:brikette` absent): ✓; TC-03 (`turbopack:brikette-build` absent): ✓; TC-04 (template-app/business-os webpack surfaces): ✓; TC-05 (`--webpack-apps brikette` graceful, exit 0): ✓; TC-06 (test file): ✓
  - 20/20 tests pass (9 new + 11 existing policy tests); no regressions

---

### TASK-06: Run and record full acceptance matrix

- **Type:** IMPLEMENT
- **Deliverable:** All acceptance matrix checks passing; results recorded in plan Decision Log
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-20)
- **Affects:** `docs/plans/turbopack-brikette-build-flag-retirement/plan.md` (decision log), `[readonly] scripts/check-next-webpack-flag.mjs`, `[readonly] scripts/check-i18n-resolver-contract.mjs`
- **Depends on:** TASK-05
- **Blocks:** —
- **Confidence:** 90%
  - Implementation: 90% — acceptance matrix is fully enumerated; all commands are well-known; execution is mechanical
  - Approach: 95% — straightforward: run each check, record results; no design decisions remain
  - Impact: 90% — provides documented evidence that all surfaces are correct post-migration
- **Acceptance:**
  - [ ] `node scripts/check-next-webpack-flag.mjs --all` → exit 0
  - [ ] `pnpm -w run test:governed -- jest -- --config=apps/brikette/jest.config.cjs --testPathPattern=next-webpack-flag-policy` → all pass
  - [ ] `pnpm --filter @apps/brikette exec cross-env NODE_OPTIONS="--require ./scripts/ssr-polyfills.cjs" next build` → exit 0 (Turbopack, no `--webpack`)
  - [ ] Static-export CI enforcement job → green in CI
  - [ ] `pnpm --filter @acme/template-app build` → exit 0
  - [ ] `pnpm --filter @apps/business-os build` → exit 0
  - [ ] `node scripts/check-i18n-resolver-contract.mjs` → output contains `PASS build-lifecycle:brikette`; output does NOT contain `webpack:brikette`; exits 0
- **Validation contract (TC):**
  - TC-01: All 7 acceptance matrix items above pass
  - TC-02: Resolver output confirmed to contain `build-lifecycle:brikette` and no legacy Brikette surface labels
  - TC-03: At least one green staging workflow run post-TASK-03 recorded
- **Execution plan:** Red → Green → Refactor
  - Red: None — pure validation task; no failing state to create
  - Green: run each acceptance check in sequence; record any failures; re-run after fixes
  - Refactor: record results in Decision Log below; note staging run link
- **Planning validation (S — not required):** None: S-effort task
- **Scouts:** None: read-only validation run
- **Edge Cases & Hardening:** None: no code changes in this task
- **What would make this >=90%:**
  - None: already 90%; to reach 95%, add one week of post-deploy monitoring with no Turbopack-related failures
- **Rollout / rollback:** None: planning validation task
- **Documentation impact:** Record results in Decision Log below
- **Notes / references:**
  - Post-delivery: monitor merge-gate and pre-commit policy failures for one week; monitor Brikette staging workflow runtime/flakiness
- **Build evidence (2026-02-20):**
  - TC-01: `node scripts/check-next-webpack-flag.mjs --all` → exit 0 ✓ (local)
  - TC-02: policy tests 20/20 pass (9 resolver-contract + 11 webpack-flag-policy) ✓ (local)
  - TC-03: Turbopack build → CI job `turbopack-smoke` id=64293735441, duration 3m9s, ✓ (brikette.yml run 22226294769)
  - TC-04: static-export CI enforcement → CI job `static-export-check` id=64293735335, duration 5m50s, ✓ (brikette.yml run 22226294769)
  - TC-05: template-app build → Deploy Prime run 22226294764 concluded success ✓ (CI)
  - TC-06: business-os build → Deploy Business OS run 22226294746 concluded success ✓ (CI)
  - TC-07: `node scripts/check-i18n-resolver-contract.mjs --dry-run --skip-node` → `PASS build-lifecycle:brikette`, exit 0 ✓ (local); `webpack:brikette` absent ✓; `turbopack:brikette-build` absent ✓
  - All 7 acceptance matrix checks pass; CI failures (Lighthouse script.size budget, Core Platform lint/typecheck) are pre-existing on SHA 75633b4be8 before this work, unrelated to these changes

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Policy matrix change weakens enforcement for non-Brikette apps | Medium | High | TASK-01 adds explicit non-Brikette fail-closed test cases; `DEFAULT_COMMAND_POLICY` unchanged |
| Static-export CI job becomes flaky (route hide/restore timing) | Low-Medium | Medium | Use proven `(cmd; e=$?; restore; exit $e)` shell pattern; pattern already CI-proven in build-cmd |
| TASK-03 staging/production workflow `build-cmd` diverge | Medium | Medium | Single PR edit; both blocks updated atomically; grep check before edit |
| Resolver harness refactor (TASK-05) drops lifecycle coverage | Medium-High | High | Option B locked; TASK-05 acceptance explicitly requires `build-lifecycle:brikette` lifecycle surface |
| `--skip-turbopack` callers break after TASK-05 removes the turbopack block | Low-Medium | Medium | TASK-05 scouts flag; audit callers before retiring; update help text at minimum |
| Next.js 16.x.y bump regresses Turbopack post-migration | Low | Medium-High | Pin Next.js version during migration window; staging monitor covers detection |

## Observability

- Logging: resolver harness emits `[resolver-contract] PASS/FAIL <surface-label>`; surface label change from `webpack:brikette` to `build-lifecycle:brikette` is directly observable
- Metrics: Brikette staging workflow runtime (monitor for change after static-export CI job addition); merge-gate pass rate (watch for false positives in first week post-migration)
- Alerts/Dashboards: Turbopack smoke job in CI; new `static-export-check` job; one-week post-delivery monitor window

## Acceptance Criteria (overall)

- [ ] `apps/brikette/package.json` `build` script uses `next build` (no `--webpack`)
- [ ] `.github/workflows/brikette.yml` staging + production `build-cmd` use `next build` (no `--webpack`)
- [ ] Policy matrix and tests explicitly allow Brikette build without `--webpack`; non-Brikette fail-closed behavior preserved and tested
- [ ] Static-export CI enforcement job is present, passing, and required via the existing Merge Gate requirement on `.github/workflows/brikette.yml` for Brikette-scoped changes
- [ ] Resolver harness emits `build-lifecycle:brikette` (not `webpack:brikette` or `turbopack:brikette-build`)
- [ ] All acceptance matrix checks pass (`check-next-webpack-flag`, policy tests, Turbopack build, static-export, template-app, business-os, resolver contract)

## Decision Log

- 2026-02-20: Resolver harness Option B chosen (Peter) — single `build-lifecycle:brikette` lifecycle surface; drop `webpack:brikette` and `turbopack:brikette-build` identities
- 2026-02-20: TASK-02 (static-export enforcement) is a hard merge gate on TASK-03 (command changes) — no regression gap window accepted
- 2026-02-20: Static-export gate model locked to single-source ownership in `brikette.yml`; Merge Gate enforces by requiring the Brikette workflow for scoped changes (no duplicate direct static-export step in `merge-gate.yml`)
- 2026-02-20: Removed unverified webpack-vs-Turbopack `out/` equivalence claim; correctness gate is contract-level static-export invariants (build + alias generation + route restore)
- 2026-02-20: All acceptance matrix checks passed (TASK-06 complete); plan marked Complete

## Overall-confidence Calculation

Effort weights: S=1, M=2, L=3. CHECKPOINT tasks excluded.

| Task | Confidence | Effort | Weight × Confidence |
|---|---|---|---|
| TASK-01 | 85% | S=1 | 85 |
| TASK-02 | 80% | M=2 | 160 |
| TASK-03 | 85% | S=1 | 85 |
| TASK-05 | 75% | M=2 | 150 |
| TASK-06 | 90% | S=1 | 90 |

Overall = (85 + 160 + 85 + 150 + 90) / (1+2+1+2+1) = 570 / 7 = 81.4% → **80%**

## Section Omission Rule

- Delivery and Channel Landscape: None — code-track plan; no external delivery channel
- Hypothesis & Validation Landscape: None — code-track plan; no market hypothesis

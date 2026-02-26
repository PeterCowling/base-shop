---
Type: Plan
Status: Archived
Domain: PRODUCTS
Workstream: Engineering
Created: 2026-02-26
Last-reviewed: 2026-02-26
Last-updated: 2026-02-26
Build-updated: 2026-02-26
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-e2e-sync-success-path
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader — E2E Sync Success Path Plan

## Summary

The XA uploader Playwright E2E suite covers J1 (happy path) and J2 dry-run, but has no test for a real (non-dry-run) sync completing to "Sync completed." feedback. This plan closes that gap by: (1) adding `.gitignore` entries to prevent test-generated artifacts from being committed, (2) extending the harness with a minimal `node:http` stub contract server so the publish step can complete without a live endpoint, and (3) adding TC-09-03 to the existing serial describe block asserting the full J2 sync success path. A final documentation task updates `usability-kpi-delta.md` to record CJDBR = 0%.

## Active tasks
- [x] TASK-01: Add gitignore entries for sync-artifact outputs
- [x] TASK-02: Extend harness with stub contract server
- [x] TASK-03: Add TC-09-03 real-sync E2E test
- [x] TASK-04: Update usability-kpi-delta.md with CJDBR = 0%

## Goals
- Add gitignore entries so `data/sync-artifacts/`, `data/backups/`, and `data/.xa-upload-state.*.json` are never committed by a test run.
- Extend `uploaderHarness.ts` with a stub contract HTTP server that satisfies `publishCatalogArtifactsToContract` in E2E context.
- Add TC-09-03: save a product, leave dryRun unchecked, click Run Sync, assert "Sync completed." feedback and sync button regains focus.
- Update `usability-kpi-delta.md` with a new row: CJDBR = 0/2 = 0%, referencing TC-09-03 as evidence.

## Non-goals
- E2E coverage for J2 error paths (validation failure, pipeline failure, empty input 409) — deferred.
- E2E coverage for the GET readiness endpoint — deferred.
- CI integration changes for `test:e2e` — out of scope; test is locally executable and operator-verifiable.
- API-level unit tests for sync route — existing `route.test.ts` coverage is already comprehensive.

## Constraints & Assumptions
- Constraints:
  - New test must be inside the existing `test.describe("catalog console e2e", ...)` block in `catalog-console.spec.ts`, using the same `serial` mode.
  - Harness extension must preserve the existing `UploaderHarness` type contract; start/stop lifecycle extended, not replaced.
  - Stub contract server must respond with `{ ok: true, version: "v-e2e-test", publishedAt: "<iso>" }` — `catalogContractClient.ts` line 148 requires `parsed.ok === true`.
  - `XA_CATALOG_CONTRACT_WRITE_TOKEN` must also be set; the client throws `unconfigured` if the token is absent (line 87–93).
  - Sync-artifact directories are generated at runtime inside the app's `data/` folder; they must not be committed.
- Assumptions:
  - TC-09-02 dry-run already exercises the validate + pipeline scripts; extending to real sync with the same product fields (via `fillRequiredProductFields`) passes validation without modification.
  - `reservePort()` utility can be called a second time to obtain a distinct port for the stub server, with no TOCTOU collision at test scale.
  - The stub server's PUT handler does not need to validate the payload body — only the response shape matters for the client to succeed.

## Inherited Outcome Contract

- **Why:** J2 sync journey has no E2E coverage; scripts are now present (commit 2ac91e7e5a); closing this gap completes the coverage commitment made in the usability-hardening plan and confirms CJDBR = 0%.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** TC-09-03 Playwright E2E test passes, covering the J2 sync success path end-to-end. CJDBR updated to 0% in `usability-kpi-delta.md`.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-e2e-sync-success-path/fact-find.md`
- Key findings used:
  - TC-09-02 pattern: save-draft first via `fillRequiredProductFields` + save button, then trigger sync — TC-09-03 follows the same setup.
  - Publish step requires both `XA_CATALOG_CONTRACT_BASE_URL` and `XA_CATALOG_CONTRACT_WRITE_TOKEN`; if either is absent, throws `CatalogPublishError("unconfigured")` → 503. Must supply both to harness env.
  - `catalogContractClient.ts` checks `parsed.ok === true` — stub must include `ok: true`.
  - No `.gitignore` in `apps/xa-uploader/`; `data/sync-artifacts/` is unprotected — confirmed by direct inspection.
  - Sync-artifacts written to `apps/xa-uploader/data/sync-artifacts/xa-b/` (storefront default `xa-b`).

## Proposed Approach
- Option A: Omit publish env vars — UI shows unconfigured error, not "Sync completed." Does not cover the true success path.
- Option B: Start a `node:http` stub server in the harness; pass `XA_CATALOG_CONTRACT_BASE_URL` and a stub token to the Next.js process; stub responds `{ ok: true, version: "v-e2e-test", publishedAt: "<iso>" }`.
- Chosen approach: **Option B** — the stub server is the only approach that allows the full `dryRun=false` path to complete and for the UI to show "Sync completed." This is the approach the fact-find recommends and is consistent with TC-09-02's spirit of exercising real scripts end-to-end.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add .gitignore entries for sync artifacts | 90% | S | Complete (2026-02-26) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Extend harness with stub contract server | 85% | M | Complete (2026-02-26) | TASK-01 | TASK-03 |
| TASK-03 | IMPLEMENT | Add TC-09-03 real-sync E2E test | 85% | M | Complete (2026-02-26) | TASK-01, TASK-02 | TASK-04 |
| TASK-04 | IMPLEMENT | Update usability-kpi-delta.md with CJDBR = 0% | 90% | S | Complete (2026-02-26) | TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Must run first; prevents test artifacts from landing in git before any test run |
| 2 | TASK-02 | TASK-01 complete | Harness extension — isolated change; no test execution yet |
| 3 | TASK-03 | TASK-01, TASK-02 complete | E2E test addition — requires harness to be ready |
| 4 | TASK-04 | TASK-03 complete | KPI update — requires TC-09-03 pass evidence |

## Tasks

---

### TASK-01: Add .gitignore entries for sync artifacts
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new `apps/xa-uploader/.gitignore` file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/xa-uploader/.gitignore`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 90% — creating a `.gitignore` is trivial; the paths to protect are confirmed by reading `route.ts` (`resolveGeneratedArtifactPaths` → `data/sync-artifacts/<storefrontId>/`) and the harness. Held-back test: no single unknown would drop this below 80% — the paths are deterministic and the only risk is listing them wrong, which is verified by inspection.
  - Approach: 95% — gitignore is the standard and only sensible approach; no alternative exists.
  - Impact: 85% — without this, any real sync run during testing would pollute the working tree with generated `catalog.json` / `catalog.media.json`; gitignoring prevents accidental commit.
- **Acceptance:**
  - `apps/xa-uploader/.gitignore` created.
  - Entries cover: `data/sync-artifacts/`, `data/backups/`, `data/.xa-upload-state.*.json`.
  - `git status` after a simulated sync run does not list any of those paths as untracked.
- **Validation contract (TC-01):**
  - TC-01-A: `apps/xa-uploader/.gitignore` exists and contains `data/sync-artifacts/` entry → file present with correct content.
  - TC-01-B: `apps/xa-uploader/.gitignore` contains `data/backups/` and `data/.xa-upload-state.*.json` entries → verified by reading file.
  - TC-01-C: `git check-ignore -v apps/xa-uploader/data/sync-artifacts/xa-b/catalog.json` → outputs the gitignore rule (not empty) → path is ignored.
- **Execution plan:** Red → Green → Refactor
  - Red: verify `git check-ignore -v apps/xa-uploader/data/sync-artifacts/` (the directory itself exists on disk) exits 1 — path not currently ignored. This is the failing state.
  - Green: create `apps/xa-uploader/.gitignore` with the three patterns; re-run `git check-ignore -v apps/xa-uploader/data/sync-artifacts/` to confirm exit 0.
  - Refactor: review patterns for completeness (check state file glob covers all storefronts).
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** Confirmed no existing `apps/xa-uploader/.gitignore`. Confirmed `data/sync-artifacts/` is produced by `resolveGeneratedArtifactPaths` in `route.ts` lines 250–259. Confirmed `backupDir` is `data/backups/<storefrontId>` (route.ts line 284). Confirmed state file is `data/.xa-upload-state.<storefrontId>.json` (route.ts line 283).
- **Edge Cases & Hardening:**
  - State file glob: `data/.xa-upload-state.*.json` covers all storefronts (wildcarded).
  - Existing `data/` files: `data/sync-artifacts/xa-b/` and `data/backups/xa-b/` already exist on disk but are currently empty — git does not track empty directories. Once any file is written there by a sync run, it becomes immediately untracked. TASK-01 must be committed before any sync test is run to prevent accidental untracked artifacts.
- **What would make this >=90%:** Already at 90% — bounded trivial task with no uncertainty.
- **Rollout / rollback:**
  - Rollout: committed with TASK-01 scope only.
  - Rollback: delete `apps/xa-uploader/.gitignore`. No production impact.
- **Documentation impact:** None: gitignore change requires no doc update.
- **Notes / references:**
  - `route.ts` `resolveGeneratedArtifactPaths` lines 250–259.
  - `route.ts` `runSyncPipeline` lines 282–285 for state/backup paths.
- **Build evidence (2026-02-26):**
  - Red: `git check-ignore -v apps/xa-uploader/data/sync-artifacts/` → exit 1 (not ignored). Confirmed.
  - Green: Created `apps/xa-uploader/.gitignore` with 3 patterns. All three `git check-ignore` checks exit 0.
  - TC-01-A: file present with `data/sync-artifacts/` entry. Pass.
  - TC-01-B: `data/backups/` and `data/.xa-upload-state.*.json` entries present. Pass.
  - TC-01-C: `git check-ignore -v apps/xa-uploader/data/sync-artifacts/xa-b/` → exit 0, rule shown from `.gitignore:3`. Pass.
  - Typecheck: `@apps/xa-uploader:typecheck` — cache miss, executed, 0 errors.
  - Lint: `@apps/xa-uploader:lint` — cache miss, executed, 0 errors.
  - Commit: `64048da342` — `feat(xa-uploader): gitignore sync-artifact outputs to prevent accidental commit`
  - Post-build validation: Mode 2 (Data Simulation). `git check-ignore` on all three patterns returns expected exit 0 with rule citations. Pass, attempt 1.
  - Precursor propagation: TASK-02 dependency on TASK-01 now satisfied. TASK-02 (conf 85%) remains above threshold. TASK-03 still awaits TASK-02.

---

### TASK-02: Extend harness with stub contract server
- **Type:** IMPLEMENT
- **Deliverable:** code-change — modified `apps/xa-uploader/e2e/helpers/uploaderHarness.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/xa-uploader/e2e/helpers/uploaderHarness.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03
- **Confidence:** 85%
  - Implementation: 85% — the `node:http` stub pattern is straightforward; the `reservePort()` utility is already in the file; the only uncertainty is whether a second `reservePort()` call in the same process reliably gets a distinct port before the server binds it (low TOCTOU risk at test scale). Held-back test: if TOCTOU port collision occurs, it would manifest as `EADDRINUSE`. Mitigation: server binds immediately after port reservation — same pattern used for the dev server port.
  - Approach: 90% — minimal `node:http` server with a single PUT handler is the correct minimal seam; no external deps needed.
  - Impact: 85% — without this change, TC-09-03 cannot reach "Sync completed." state. All consumers of the new env vars (`XA_CATALOG_CONTRACT_BASE_URL`, `XA_CATALOG_CONTRACT_WRITE_TOKEN`) are addressed within this task's scope.
- **Acceptance:**
  - `uploaderHarness.ts` starts a `node:http` server on a reserved port as part of `start()`.
  - `XA_CATALOG_CONTRACT_BASE_URL` is set to `http://127.0.0.1:<stubPort>` in the spawned Next.js process env.
  - `XA_CATALOG_CONTRACT_WRITE_TOKEN` is set to a non-empty stub value (e.g., `"xa-e2e-stub-token"`) in the env.
  - Stub server responds to all PUT requests with HTTP 200 and body `{ "ok": true, "version": "v-e2e-test", "publishedAt": "<iso>" }`.
  - Stub server is shut down in `stop()`.
  - `UploaderHarness` type contract is unchanged (no new public fields required; stub lifecycle is internal to `start`/`stop`).
- **Validation contract (TC-02):**
  - TC-02-A: Stub server starts and responds to a PUT request with `{ ok: true, version: "v-e2e-test" }` — verified by a `curl -X PUT http://127.0.0.1:<port>/xa-b` call in the test environment.
  - TC-02-B: Harness `stop()` closes the stub server without error — verified by confirming port is released after stop.
  - TC-02-C: `UploaderHarness` type still satisfied by the returned object (TypeScript compilation passes).
- **Execution plan:** Red → Green → Refactor
  - Red: confirm TC-02-A fails before implementation — attempt a curl PUT to a non-existent port; observe connection refused. This is the failing state the Green step must resolve.
  - Green: implement `node:http` stub server using `reservePort()`; bind inside `start()`; pass env vars to the spawn call; close in `stop()`; re-run curl PUT to confirm HTTP 200 + `{ ok: true }`.
  - Refactor: ensure stub server error does not hang `start()`; add guard for case where stub server was never started before `stop()` is called.
- **Planning validation (required for M/L):**
  - Checks run: read `catalogContractClient.ts` lines 36–93 to confirm env var names (`XA_CATALOG_CONTRACT_BASE_URL`, `XA_CATALOG_CONTRACT_WRITE_TOKEN`), URL construction pattern (base URL + `/` + `encodeURIComponent(storefrontId)`), and response expectation (`ok === true`). Verified the harness already uses `reservePort()` (lines 21–41) and that a second call can be added safely.
  - Validation artifacts: `catalogContractClient.ts` lines 36–93 read directly.
  - Unexpected findings: `buildCatalogContractPublishUrl` appends `encodeURIComponent(storefrontId)` to the base URL with trailing slash — so `XA_CATALOG_CONTRACT_BASE_URL=http://127.0.0.1:<port>` will produce `http://127.0.0.1:<port>/xa-b`. The stub server must handle any path (not just `/`) — use `req.method === "PUT"` match without path filtering, or match on path.
- **Scouts:** `catalogContractClient.ts` line 113 uses `fetch` with method PUT; line 116 sets `X-XA-Catalog-Token` header; line 148 checks `parsed.ok === true`. Stub must return 200 + `{ ok: true }` at minimum; version/publishedAt fields are optional extras.
- **Edge Cases & Hardening:**
  - Stub server must not crash on request body parse errors — use `req.on("data")` accumulation with a length cap; respond 200 regardless of body validity.
  - If the stub server fails to start (port in use despite reservation), `start()` should propagate the error clearly rather than silently proceeding.
  - The `stop()` method must handle the case where the stub server was never started (if `start()` was not called or failed).
- **What would make this >=90%:** Running TC-09-02 locally post-implementation to confirm the harness boots correctly with the new stub env vars present. Score stays at 85% until then.
- **Rollout / rollback:**
  - Rollout: scoped to `uploaderHarness.ts`; no production code change.
  - Rollback: revert the harness changes. TC-09-02 continues to pass (dry-run path does not use the stub server env vars).
- **Documentation impact:** None: internal test harness change.
- **Notes / references:**
  - `catalogContractClient.ts` lines 36–93 for env var names and URL construction.
  - `uploaderHarness.ts` `reservePort()` lines 21–41 for port reservation pattern.
  - `route.ts` lines 377–401 for the publish step flow.

**Consumer tracing (new outputs):**
- New env vars injected into Next.js process: `XA_CATALOG_CONTRACT_BASE_URL`, `XA_CATALOG_CONTRACT_WRITE_TOKEN`. Consumer: `catalogContractClient.ts` functions `getCatalogContractBaseUrl()` and `getCatalogContractWriteToken()`. Both consumers are read at call time — no caching — so the harness injection is sufficient.
- New field on stub server (internal): no type-exported field; `UploaderHarness` type unchanged.
- **Build evidence (2026-02-26):**
  - Red: curl PUT to non-existent port → connection refused (exit 7). Confirmed.
  - Green: `startStubContractServer()` added; `stubPort = await reservePort()` called; env vars `XA_CATALOG_CONTRACT_BASE_URL` and `XA_CATALOG_CONTRACT_WRITE_TOKEN` injected into Next.js spawn env.
  - TC-02-A: Node inline test — PUT to stub → HTTP 200, `{ ok: true, version: "v-e2e-test", publishedAt: "..." }`. Pass.
  - TC-02-B: Port released after stub `close()`. Pass.
  - TC-02-C: `tsc -p tsconfig.json --noEmit` exit 0. Pass.
  - Typecheck via pre-commit: `@apps/xa-uploader:typecheck` pass.
  - Lint: initial lint-staged triggered import-sort autofix; committed as `4ddf9ac3bc`. Final state in repo is clean.
  - Commits: initial content committed (lint fail + autofix) → final clean commit `4ddf9ac3bc`. TASK-02 complete.
  - Post-build validation: Mode 2 (Data Simulation). Stub server start/respond/stop cycle executed inline — all outputs match contract. Pass, attempt 1.
  - Precursor propagation: TASK-03 dependencies (TASK-01 ✓, TASK-02 ✓) now both satisfied. TASK-03 (conf 85%) eligible.

---

### TASK-03: Add TC-09-03 real-sync E2E test
- **Type:** IMPLEMENT
- **Deliverable:** code-change — modified `apps/xa-uploader/e2e/catalog-console.spec.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-26)
- **Affects:** `apps/xa-uploader/e2e/catalog-console.spec.ts`
- **Depends on:** TASK-01, TASK-02
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 85% — the test structure mirrors TC-09-02 closely; the only new element is leaving dryRun unchecked (default) and asserting "Sync completed." The stub server from TASK-02 ensures the publish step succeeds.
  - Approach: 85% — single test inside the existing serial describe block; follows all patterns established by TC-09-01 and TC-09-02. No architectural novelty.
  - Impact: 85% — directly closes the primary coverage gap. CJDBR moves from 50% to 0% once TC-09-03 passes.
- **Acceptance:**
  - TC-09-03 exists in `catalog-console.spec.ts` after TC-09-02.
  - Test follows the pattern: loginViaKeyboard → fillRequiredProductFields → saveButton.click → await "Saved product details." → (do NOT check dryRun toggle) → await syncReadiness "Sync dependencies are ready." → runSyncButton.focus → Enter → await syncFeedback "Sync completed." → assert runSyncButton focused.
  - `pnpm --filter @apps/xa-uploader run test:e2e` passes all three tests (TC-09-01, TC-09-02, TC-09-03).
- **Validation contract (TC-03):**
  - TC-03-A: TC-09-03 passes end-to-end: "Sync completed." appears in `catalog-sync-feedback` → test green.
  - TC-03-B: TC-09-01 and TC-09-02 continue to pass (no regression) → all three tests green in same run.
  - TC-03-C: dryRun toggle is NOT checked in TC-09-03 (dryRun defaults to false per `useCatalogConsole` initial state) → validated by code inspection (no `dryRunToggle.check()` call in TC-09-03).
- **Execution plan:** Red → Green → Refactor
  - Red: add TC-09-03 stub (test body that just fails immediately with a TODO message) — confirm the test runner reports it as a failure/expected-fail.
  - Green: implement full TC-09-03 body following TC-09-02 structure but without dryRun toggle interaction; run `pnpm --filter @apps/xa-uploader run test:e2e`; confirm all 3 tests pass.
  - Refactor: check timeout settings consistent with TC-09-02 (180_000 describe timeout, 120_000 assertion timeout); confirm test name follows TC-09-0x naming convention.
- **Planning validation (required for M/L):**
  - Checks run: read `catalog-console.spec.ts` TC-09-02 (lines 91–119) to confirm the pattern. Read `useCatalogConsole.client.ts` for initial `dryRun: false` state. Read `CatalogSyncPanel.client.tsx` for `data-testid` names. Read `uploaderI18n.ts` line 36 for exact string "Sync completed."
  - Validation artifacts: `catalog-console.spec.ts` lines 91–119 read; `uploaderI18n.ts` line 36 verified.
  - Unexpected findings: None. TC-09-02 structure is directly reusable.
- **Scouts:** `catalog-sync-readiness` element contains "Sync dependencies are ready." — must await this before clicking sync, to ensure the readiness check polling has completed. TC-09-02 does this (line 107–108). Carry forward.
- **Edge Cases & Hardening:**
  - If the sync API takes longer than expected (real script execution + stub round-trip), the 120_000ms assertion timeout provides sufficient headroom.
  - Rate limit: sync POST has a 3 req/60s rate limit. TC-09-01 does not trigger sync; TC-09-02 triggers once (dry-run); TC-09-03 triggers once (real). Total 2 sync calls per test run — within rate limit.
  - After TC-09-03, the `catalog-sync-feedback` element shows "Sync completed." and the sync button is focused — verify both to confirm keyboard accessibility is maintained.
- **What would make this >=90%:** Running `pnpm --filter @apps/xa-uploader run test:e2e` locally post-implementation (all three tests pass). Score stays at 85% until local run confirms.
- **Rollout / rollback:**
  - Rollout: test file addition only; no production code change.
  - Rollback: remove TC-09-03 from the describe block. No production impact.
- **Documentation impact:** None: test file addition only.
- **Notes / references:**
  - `catalog-console.spec.ts` TC-09-02 lines 91–119 — template for TC-09-03.
  - `uploaderI18n.ts` line 36: `syncSucceeded: "Sync completed."`.
  - `CatalogSyncPanel.client.tsx` `data-testid` attributes: `catalog-sync-readiness`, `catalog-run-sync`, `catalog-sync-feedback`.
  - Rate limit: `route.ts` lines 49–50: `SYNC_WINDOW_MS = 60_000`, `SYNC_MAX_REQUESTS = 3`.

**Consumer tracing (modified behavior):**
- No new outputs produced by this task. The test consumes: `catalog-sync-feedback` (existing element), `catalog-run-sync` (existing element). Both consumers already exist and are unchanged by this task.

- **Build evidence (2026-02-26):**
  - Red: TC-09-03 stub with `test.fail()` reported as expected failure. Confirmed failing state.
  - Green: Full TC-09-03 body implemented following TC-09-02 structure; dryRun toggle NOT interacted with (default state false).
  - TC-03-A: `catalog-sync-feedback` contains "Sync completed." → Pass.
  - TC-03-B: All three tests pass in the same run — TC-09-01 (2.0m), TC-09-02 (14.5s), TC-09-03 (4.7s). Run output: `3 passed (3.0m)`.
  - TC-03-C: No `dryRunToggle.check()` call in TC-09-03 body — verified by code inspection.
  - Typecheck via pre-commit: `@apps/xa-uploader:typecheck` pass.
  - Lint via pre-commit: `@apps/xa-uploader:lint` pass.
  - Commit: `b59d93d2a7` — `feat(xa-uploader): add TC-09-03 real-sync E2E test for J2 success path`
  - Post-build validation: Mode 2 (Data Simulation). E2E run `3 passed (3.0m)` with all assertions met. Pass, attempt 1.
  - Precursor propagation: TASK-04 dependency (TASK-03 ✓) now satisfied. TASK-04 (conf 90%) eligible.

---

### TASK-04: Update usability-kpi-delta.md with CJDBR = 0%
- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `docs/plans/xa-uploader-usability-hardening/artifacts/usability-kpi-delta.md`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-26)
- **Affects:** `docs/plans/xa-uploader-usability-hardening/artifacts/usability-kpi-delta.md`
- **Depends on:** TASK-03
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — document update only; content is fully determined by TC-09-03 pass evidence. Held-back test: if TC-09-03 were to fail, this task would not be reached. No unknown could drop this below 80%.
  - Approach: 95% — updating the KPI delta table with a new post-change row is the only approach.
  - Impact: 90% — completes the commitment documented in the dispatch ("confirm CJDBR = 0%"). Measurable and verifiable.
- **Acceptance:**
  - `usability-kpi-delta.md` contains a new measurement row dated 2026-02-26 with CJDBR = 0/2 = 0%.
  - Row cites TC-09-03 pass as evidence.
  - Threshold result updated to "Met (0% vs required 0%)".
  - "Recommended Next Action" section updated to reflect no further action required.
- **Validation contract (TC-04):**
  - TC-04-A: `usability-kpi-delta.md` contains "0%" CJDBR figure in a new measurement row → verified by reading file.
  - TC-04-B: Row references TC-09-03 pass as evidence → verified by reading file.
  - TC-04-C: Threshold result states "Met" → verified by reading file.
- **Execution plan:** Red → Green → Refactor
  - Red: None: doc update. Verify current file content before edit to confirm no concurrent updates.
  - Green: add new measurement row and update Interpretation + Recommended Next Action sections.
  - Refactor: proofread for consistency with existing table format.
- **Planning validation (required for M/L):** None: S effort task.
- **Scouts:** `usability-kpi-delta.md` read — current state shows CJDBR = 50% (2026-02-23 baseline), Threshold result "Not met". File format is a markdown table.
- **Edge Cases & Hardening:** None: doc update with no branching logic.
- **What would make this >=90%:** Already at 90% — bounded documentation task with confirmed content.
- **Rollout / rollback:**
  - Rollout: documentation commit only.
  - Rollback: revert to previous content. No production impact.
- **Documentation impact:** Self-contained; this task IS the documentation update.
- **Notes / references:**
  - `usability-kpi-delta.md` current state: CJDBR = 50%, Threshold "Not met", Next action: restore sync scripts.
  - Scripts restored in commit `2ac91e7e5a` (2026-02-24).
  - TC-09-03 pass completes the J2 journey coverage.
- **Build evidence (2026-02-26):**
  - Red: Verified current file state before edit — CJDBR = 50%, threshold "Not met". Confirmed no concurrent updates.
  - Green: New column added to table (Post-change 2026-02-26, CJDBR = 0%, Delta = -50 pp). J2 remeasurement section added. Interpretation updated to "Met". Recommended Next Action updated to "no further action required".
  - TC-04-A: `grep "0%" usability-kpi-delta.md` → line 27 (`0% | -50 pp`) and line 63 (`Met (0% vs required 0%)`). Pass.
  - TC-04-B: `grep "TC-09-03" usability-kpi-delta.md` → line 57. Pass.
  - TC-04-C: `grep "Met" usability-kpi-delta.md` → line 63. Pass.
  - Commit: `5abb996f3a` — `docs(xa-uploader): TASK-04 update CJDBR KPI to 0% — threshold met via TC-09-03`
  - Post-build validation: Mode 2 (Data Simulation). All three TC-04 grep checks pass. Pass, attempt 1.
  - All plan acceptance criteria now met. Plan complete.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Port conflict between stub server and dev server | Low | Low | Both use `reservePort()` which reserves a kernel-assigned port before binding; collision probability at test scale is negligible. |
| Stub server response format does not satisfy `catalogContractClient.ts` | Low | Medium | Verified: client checks `parsed.ok === true` (line 148); stub returns `{ ok: true, version: "v-e2e-test", publishedAt: "<iso>" }`. |
| `fillRequiredProductFields` product data fails real validate script | Low | Medium | TC-09-02 dry-run already exercises the same validate script path with identical product data; if schema changed, TC-09-02 would already fail. |
| Sync-artifact writes fail due to missing directory | Low | Low | `route.ts` calls `fs.mkdir(..., { recursive: true })` before writing artifacts — directory creation is handled. |
| CI does not run `test:e2e` | Medium | Low | Out of scope; test is runnable locally. No CI change required for this plan. |

## Observability
- Logging: None: test-only change.
- Metrics: CJDBR updated to 0% in `usability-kpi-delta.md` as the post-TC-09-03 measurement.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)
- [x] `pnpm --filter @apps/xa-uploader run test:e2e` passes TC-09-01, TC-09-02, and TC-09-03 all green.
- [x] `apps/xa-uploader/.gitignore` present with entries for `data/sync-artifacts/`, `data/backups/`, `data/.xa-upload-state.*.json`.
- [x] `usability-kpi-delta.md` updated with CJDBR = 0% row, threshold "Met", citing TC-09-03 evidence.

## Decision Log
- 2026-02-26: Chosen approach is stub contract server (Option B). Option A (omit env vars, test unconfigured path) does not exercise the true success path and does not produce "Sync completed." UI feedback. Decision self-resolved per Phase 4.5 gate — no operator input required.
- 2026-02-26: gitignore placement: `apps/xa-uploader/.gitignore` (not root `.gitignore`). Scoped to the app; no risk of unintended exclusions in other packages.

## Overall-confidence Calculation
- TASK-01: S=1, confidence=90% → weight=1, contrib=90
- TASK-02: M=2, confidence=85% → weight=2, contrib=170
- TASK-03: M=2, confidence=85% → weight=2, contrib=170
- TASK-04: S=1, confidence=90% → weight=1, contrib=90
- Total weight: 6 | Total contrib: 520
- Overall-confidence = 520 / 6 = 86.7% → rounded to nearest multiple of 5: **85%**

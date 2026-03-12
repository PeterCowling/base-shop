---
Type: Plan
Status: Archived
Domain: XA
Workstream: Engineering
Created: 2026-03-12
Last-reviewed: 2026-03-12
Last-updated: 2026-03-12
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-test-logging-coverage
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 91%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: docs/plans/xa-uploader-test-logging-coverage/analysis.md
---

# XA Uploader Test and Logging Coverage — Residual Gaps Plan

## Summary

Two residual gaps remain after the initial wave of xa-uploader observability and test coverage work (completed 2026-03-11). Gap A: `uploaderLogger.ts` has no dedicated unit test — JSON serialization, the `NODE_ENV=test` suppression gate, and the fallback path for non-serializable context are untested. Gap B: `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts` has no `uploaderLog` calls on its GET and DELETE material error branches, leaving it as the only one of 8 server routes without structured logging on failure paths.

Both tasks are additive code only (no schema changes, no migrations, no external dependencies), follow patterns already proven across the rest of the codebase, and are fully independent — they run in parallel in Wave 1.

## Active tasks
- [x] TASK-01: Add `uploaderLogger.ts` unit tests — Complete (2026-03-12)
- [x] TASK-02: Add `uploaderLog` calls to `[slug]/route.ts` error branches + extend route tests — Complete (2026-03-12)

## Goals

- Close Gap A: establish a direct, isolated test for `uploaderLogger.ts` covering all branch paths (JSON output shape, suppression gate, fallback, level routing).
- Close Gap B: add structured logging to the one holdout route (`products/[slug]/route.ts`) so that all 8 server-side catalog routes emit `uploaderLog` events on material failures.
- Maintain consistency with the test patterns and logging conventions established across the rest of the codebase.

## Non-goals

- Replacing `console.warn` in `CatalogProductImagesFields.client.tsx` — browser-side developer diagnostics; server-side route already logs authoritatively.
- End-to-end or integration test coverage (policy: unit tests only, per `docs/testing-policy.md`).
- Coverage for `apps/xa-b` storefront routes (separate app).

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only — no local `jest` execution.
  - `uploaderLogger.ts` uses `console.info/warn/error` as transport — this is the correct pattern for `wrangler tail --format json` and is not a defect.
  - Auth-denied and rate-limited branches across all routes intentionally return fast without logging; this is the established pattern and must not change.
- Assumptions:
  - The `wrangler tail` JSON-line approach is the agreed production observability mechanism for Cloudflare Workers.
  - Test coverage is measured at the route-handler and library level; React component hooks are out of scope.

## Inherited Outcome Contract

- **Why:** The upload pipeline is the sole path for product data entering the XA storefront. Regressions silently affecting save, publish, or image upload create data loss risk. Absent logging means failures are invisible in production until a user reports them.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All critical upload pipeline routes and the `handleSaveImpl` action have automated test coverage; 7 of 8 server routes already emit structured `uploaderLog` JSON events on material failure paths (contract errors, R2 failures, sync failures, auth anomalies); the remaining gap (`products/[slug]/route.ts` GET/DELETE failure paths) and the missing `uploaderLogger.ts` unit test are addressed. Note: auth-denied and rate-limited branches across all routes intentionally return fast responses without logging — this is the established pattern and is not a gap.
- **Source:** auto

## Analysis Reference

- Related analysis: `docs/plans/xa-uploader-test-logging-coverage/analysis.md`
- Selected approach inherited:
  - Gap A: A1 — direct unit test of `uploaderLogger.ts` in `apps/xa-uploader/src/lib/__tests__/uploaderLogger.test.ts`
  - Gap B: B1 — per-branch `uploaderLog` calls in `products/[slug]/route.ts` following the established pattern from all 7 other routes
- Key reasoning used:
  - A1 is the only approach that directly tests logger internals (suppression gate and fallback remain unverifiable via integration tests alone)
  - B1 correctly captures recoverable error branches — middleware wrapping (B2) would miss caught errors (e.g., `CatalogDraftContractError`) returned as structured HTTP error responses
  - Both tasks are additive and follow patterns already proven across the codebase

## Selected Approach Summary

- What was chosen: Two parallel IMPLEMENT tasks — logger unit tests (TASK-01) and slug route logging + test extension (TASK-02).
- Why planning is not reopening option selection: Analysis fully resolved the option set (A1/B1 vs A2/B2). No new information from source inspection changes the recommendation. The slug route source confirms 3 material error branches needing `uploaderLog` calls (GET general catch, DELETE conflict catch, DELETE general catch). The existing `route.test.ts` and `route.branches.test.ts` confirm the mock pattern to follow for extending with `uploaderLog` assertions.

## Fact-Find Support

- Supporting brief: `docs/plans/xa-uploader-test-logging-coverage/fact-find.md`
- Evidence carried forward:
  - `uploaderLogger.ts` suppression gate at line 30: `if (process.env.NODE_ENV === "test") return;`
  - Fallback path at lines 41–49: outer `try/catch` on `JSON.stringify(record)`, inner fallback emits minimal `{level, event, ts}` record
  - `consoleFn` map at lines 3–7 routes `info/warn/error` levels to the correct `console.*` method
  - `[slug]/route.ts` import path to `uploaderLogger` (from route file): `"../../../../../lib/uploaderLogger"`
  - `[slug]/__tests__/` import path to `uploaderLogger` (for jest.mock): `"../../../../../../lib/uploaderLogger"`
  - Both existing test files (`route.test.ts`, `route.branches.test.ts`) use `jest.mock(...)` + `await import("../route")` dynamic import pattern
  - Scout finding: `slug` variable is inside the `try` block in the GET handler (line 47) and not in scope at the catch site — GET error log will use minimal context `{ error: String(error) }`; `slug` IS in scope at DELETE catch (declared at line 102 outside try)

## Plan Gates

- Foundation Gate: Pass — no design spec required (backend-only change); all dependencies are internal; no architecture decisions open; outcome contract inherited and accurate
- Sequenced: Yes — Wave 1 parallelism confirmed; no ordering dependency between tasks
- Edge-case review complete: Yes — fallback path test seam confirmed; `String(err)` PII review noted as code-review gate; `unconfigured` contract error branches intentionally not logged
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Create `uploaderLogger.test.ts` — unit tests for JSON shape, suppression gate, fallback, level routing | 92% | S | Complete (2026-03-12) | - | - |
| TASK-02 | IMPLEMENT | Add `uploaderLog` to `[slug]/route.ts` error branches + extend route tests with mock assertions | 90% | S | Complete (2026-03-12) | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no visual changes | - | Logger and route error paths have no UI surface |
| UX / states | N/A — no user-facing flow changes | - | No change to HTTP response shapes or client behaviour |
| Security / privacy | Code-review gate: `String(err)` values in log context must be safe primitives; current error types carry no user PII — confirmed by source review | TASK-02 | Residual risk documented; not a blocker |
| Logging / observability / audit | TASK-01 tests logger internals; TASK-02 closes the last route gap so all 8 server routes emit structured events on material failures | TASK-01, TASK-02 | After both tasks land: full structured logging coverage across all 8 server routes |
| Testing / validation | TASK-01 creates dedicated logger unit test; TASK-02 extends existing slug route tests with `uploaderLog` mock assertions | TASK-01, TASK-02 | Follows established Jest dynamic-import mock pattern throughout |
| Data / contracts | `uploaderLog` signature `(level, event, context?)` unchanged; no schema changes | - | No contract change; additive only |
| Performance / reliability | No runtime path change for tests; logging is synchronous JSON serialization — negligible cost on Cloudflare Workers | - | No performance implication |
| Rollout / rollback | Additive code only; rollback = revert; no migration, no flag, no deploy ordering dependency | - | Rollback is trivial for both tasks |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02 | - | Fully independent; run in parallel |

## Delivered Processes

None: no material process topology change — additive test and logging additions only. No multi-step operator workflow, CI lane, deployment approval path, or operator runbook is altered. Both tasks add tests and logging instrumentation to an existing pipeline.

## Tasks

---

### TASK-01: Create `uploaderLogger.ts` unit tests

- **Type:** IMPLEMENT
- **Deliverable:** New test file `apps/xa-uploader/src/lib/__tests__/uploaderLogger.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/lib/__tests__/uploaderLogger.test.ts` (new), `[readonly] apps/xa-uploader/src/lib/uploaderLogger.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 92%
  - Implementation: 92% — `uploaderLogger.ts` is pure (no external deps); all branch paths are visible from source; suppression gate is a simple `process.env.NODE_ENV === "test"` check; fallback is triggered by `JSON.stringify` throwing on a circular reference
  - Approach: 95% — direct unit test is the only approach that validates logger internals; no ambiguity in test seam selection
  - Impact: 90% — closes the gap where the fallback path (lines 41–49) and suppression gate are untested; any future logger regression is caught at source
- **Acceptance:**
  - TC-LOG-01 passes: `uploaderLog("info", ...)` in a non-test environment writes a JSON-parseable line to stdout with the shape `{ level: "info", event, ts, ...context }`
  - TC-LOG-02 passes: when `NODE_ENV=test`, `uploaderLog(...)` emits nothing (no console call)
  - TC-LOG-03 passes: a circular-reference context object triggers the fallback — the function does not throw; a minimal `{level, event, ts}` record is emitted
  - TC-LOG-04 passes: `uploaderLog("warn", ...)` and `uploaderLog("error", ...)` call `console.warn` and `console.error` respectively, not `console.info`
  - `pnpm typecheck && pnpm lint` pass (CI gate)
- **Engineering Coverage:**
  - UI / visual: N/A — no visual component
  - UX / states: N/A — no user-facing state
  - Security / privacy: N/A — test file only; no log context fields added
  - Logging / observability / audit: Required — directly validates the logger's own output contract (JSON shape, suppression, fallback, level routing)
  - Testing / validation: Required — four test cases covering all branch paths in `uploaderLogger.ts`
  - Data / contracts: N/A — `uploaderLog` signature unchanged; test file does not alter the module
  - Performance / reliability: N/A — no runtime path change
  - Rollout / rollback: N/A — test file only; rollback = revert
- **Validation contract:**
  - TC-LOG-01: Set `NODE_ENV` to non-`"test"` value; spy on `console.info`; call `uploaderLog("info", "test_event", { key: "value" })`; assert spy called once with a string that `JSON.parse`s to `{ level: "info", event: "test_event", key: "value" }` plus `ts` field matching ISO 8601
  - TC-LOG-02: Set `NODE_ENV = "test"`; spy on `console.info/warn/error`; call `uploaderLog("info", "test_event")`; assert no spy was called
  - TC-LOG-03: Set `NODE_ENV` to non-`"test"`; spy on `console.info`; build a circular object (`const obj: Record<string, unknown> = {}; obj.self = obj`); call `uploaderLog("info", "fallback_test", obj)`; assert spy called once; assert the emitted string is valid JSON containing `{ level: "info", event: "fallback_test" }` but NOT the circular key
  - TC-LOG-04: Spy on `console.warn` and `console.error`; call `uploaderLog("warn", "warn_event")`; assert `console.warn` called; call `uploaderLog("error", "error_event")`; assert `console.error` called; assert `console.info` not called for either
- **Execution plan:** Red → Green → Refactor — create test file with four TC blocks, fill each assertion in order
- **Planning validation (required for M/L):** N/A — S effort
- **Scouts:** The suppression gate check (`process.env.NODE_ENV === "test"`) means the test must temporarily override `NODE_ENV` for non-suppression test cases. Pattern: save `originalNodeEnv = process.env.NODE_ENV`, set to `"production"` in `beforeEach`, restore in `afterEach`.
- **Edge Cases & Hardening:** Circular-reference test (TC-LOG-03) uses `const obj: Record<string, unknown> = {}; obj.self = obj` — standard circular reference pattern that reliably causes `JSON.stringify` to throw. The inner double-fallback (no-op) is not independently tested as it cannot be reached with the minimal `{level, event, ts}` record structure.
- **What would make this >=95%:** CI run confirming all 4 tests green.
- **Rollout / rollback:**
  - Rollout: Additive new test file; merged alongside TASK-02 (order irrelevant).
  - Rollback: `git revert` of the commit adding the test file; no production impact.
- **Documentation impact:** None — no public API change.
- **Notes / references:**
  - Logger source: `apps/xa-uploader/src/lib/uploaderLogger.ts`
  - Suppression gate: line 30; Fallback path: lines 41–49
  - Mock pattern reference: `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts`

---

### TASK-02: Add `uploaderLog` to `[slug]/route.ts` error branches + extend route tests

- **Type:** IMPLEMENT
- **Deliverable:** Modified `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`; extended `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
  - `[readonly] apps/xa-uploader/src/lib/uploaderLogger.ts`
  - `[readonly] apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — the import path, error branch locations, and logging pattern are all confirmed from source. Three branches needing logging identified: (1) GET general catch (lines 63–74), (2) DELETE `conflict` catch (lines 127–135), (3) DELETE general catch (lines 136–143). Scout finding: `slug` is declared inside the GET `try` block (line 47) — not in scope at catch; use minimal context `{ error: String(error) }` for GET error log.
  - Approach: 95% — per-branch pattern is identical to all 7 other routes; no ambiguity
  - Impact: 88% — closes the last route observability gap; DELETE failure events are now visible in `wrangler tail` output
- **Acceptance:**
  - `uploaderLog` is imported in `[slug]/route.ts` from `"../../../../../lib/uploaderLogger"`
  - GET catch block emits `uploaderLog("error", "catalog_slug_get_error", { error: String(error) })`
  - DELETE `conflict` catch block emits `uploaderLog("warn", "catalog_slug_delete_conflict", { slug })`
  - DELETE general catch block emits `uploaderLog("error", "catalog_slug_delete_error", { slug, error: String(error) })`
  - `unconfigured` contract error branches (GET and DELETE) do NOT add logging — fast-fail paths per the established pattern
  - Rate-limited and auth-denied branches do NOT add logging — established pattern, must not change
  - TC-SLUG-01 passes: GET with general error → `uploaderLog("error", "catalog_slug_get_error")` called
  - TC-SLUG-02 passes: DELETE with general error → `uploaderLog("error", "catalog_slug_delete_error")` called with `slug`
  - TC-SLUG-03 passes: DELETE with revision conflict → `uploaderLog("warn", "catalog_slug_delete_conflict")` called with `slug`
  - TC-SLUG-NONE passes: `unconfigured` contract error in GET → `uploaderLog` NOT called
  - `pnpm typecheck && pnpm lint` pass (CI gate)
- **Engineering Coverage:**
  - UI / visual: N/A — no visual component
  - UX / states: N/A — no change to HTTP response shapes; error responses unchanged
  - Security / privacy: Required — `String(error)` in log context: `CatalogDraftContractError` and generic network error messages in this route carry no user PII or credentials (confirmed by source review). Code-review gate: ensure context values are safe primitives.
  - Logging / observability / audit: Required — closes the last route observability gap; GET/DELETE material errors now emit structured `uploaderLog` JSON events; all 8 server routes fully instrumented
  - Testing / validation: Required — three new TC assertions added to `route.test.ts` verifying `uploaderLog` mock is called with correct level and event at each material error branch; one negative assertion for `unconfigured` fast-fail
  - Data / contracts: N/A — `uploaderLog` signature unchanged; HTTP response shapes unchanged
  - Performance / reliability: N/A — synchronous JSON serialization; negligible cost; no hot path affected
  - Rollout / rollback: N/A — additive logging; rollback = revert; no migration, no flag
- **Validation contract:**
  - TC-SLUG-01: Add `mockUploaderLog` jest.fn() + `jest.mock("../../../../../../lib/uploaderLogger", ...)` to `route.test.ts`; mock `readCloudDraftSnapshot` to throw a generic `Error("network_failure")`; call GET; assert `mockUploaderLog` called with `("error", "catalog_slug_get_error", expect.objectContaining({ error: expect.any(String) }))`; assert response status 500
  - TC-SLUG-02: Mock `writeCloudDraftSnapshot` to throw a generic `Error("network_failure")`; call DELETE; assert `mockUploaderLog` called with `("error", "catalog_slug_delete_error", expect.objectContaining({ slug: "studio-jacket" }))`; assert response status 500
  - TC-SLUG-03: Mock `writeCloudDraftSnapshot` to throw `CatalogDraftContractErrorMock("conflict")`; call DELETE; assert `mockUploaderLog` called with `("warn", "catalog_slug_delete_conflict", expect.objectContaining({ slug: "studio-jacket" }))`; assert response status 409
  - TC-SLUG-NONE: Mock `readCloudDraftSnapshot` to throw `CatalogDraftContractErrorMock("unconfigured")`; call GET; assert `mockUploaderLog` NOT called
- **Execution plan:** Red → Green → Refactor — add `uploaderLog` import + 3 calls to route file; extend `route.test.ts` with `uploaderLogger` mock and 3 TC assertions + 1 negative assert
- **Planning validation (required for M/L):** N/A — S effort
- **Scouts:**
  - `slug` variable scope in GET handler — declared inside `try` block at line 47; not in scope at catch. Use minimal context `{ error: String(error) }` for GET error log.
  - `slug` variable scope in DELETE handler — declared outside try block at line 102; IS in scope at catch. Use `{ slug, error: String(error) }` for DELETE error log.
  - `unconfigured` branches: both GET and DELETE already return `catalogContractUnavailableResponse()` fast-fail — these do not add logging (established pattern).
- **Edge Cases & Hardening:** `conflict` branch in DELETE receives a `CatalogDraftContractError` with `code === "conflict"` — this is a `warn` (not `error`) consistent with optimistic-lock failure semantics used in other routes.
- **What would make this >=95%:** CI run confirming all 3 TC assertions and 1 negative assert green.
- **Rollout / rollback:**
  - Rollout: Additive changes to route and test files; no deploy ordering dependency.
  - Rollback: `git revert`; no production impact beyond loss of structured log events.
- **Documentation impact:** None — no public API change. New event strings (`catalog_slug_get_error`, `catalog_slug_delete_error`, `catalog_slug_delete_conflict`) are self-documenting.
- **Notes / references:**
  - Route source: `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`
  - GET catch at lines 63–74; DELETE catch at lines 123–143
  - Existing test: `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
  - Import path from route to logger: `"../../../../../lib/uploaderLogger"`
  - Import path from `__tests__/` to logger (for jest.mock): `"../../../../../../lib/uploaderLogger"`

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Logger fallback path test requires a non-serializable value that works in Jest's V8 environment | Low | Low — circular references reliably cause `JSON.stringify` to throw | Use `const obj: Record<string, unknown> = {}; obj.self = obj` — standard circular reference pattern |
| `String(err)` convention could expose sensitive error text in future callers | Low | High | Code review gate in TASK-02: confirm `CatalogDraftContractError` and generic network error types carry no user PII |
| CI remains unverified locally | Low | Low | Testing-policy.md constraint; flag CI as the validation gate |
| `slug` variable not in scope at GET catch site | Confirmed (scout) | Low | Use `{ error: String(error) }` minimal context for GET error log; `slug` is in scope at DELETE catch site |

## Observability

- Logging: After both tasks land, all 8 server-side catalog routes emit structured `uploaderLog` JSON events on material failures. New event strings: `catalog_slug_get_error`, `catalog_slug_delete_error`, `catalog_slug_delete_conflict`.
- Metrics: None — observability via `wrangler tail --format json` only.
- Alerts/Dashboards: None new — no change to monitoring infrastructure.

## Acceptance Criteria (overall)

- [ ] `apps/xa-uploader/src/lib/__tests__/uploaderLogger.test.ts` exists and all 4 TC assertions pass in CI
- [ ] `uploaderLog` is imported and called at 3 material error branches in `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts`
- [ ] `route.test.ts` for slug route contains `uploaderLog` mock + 3 TC assertions (TC-SLUG-01, TC-SLUG-02, TC-SLUG-03) + 1 negative assert (TC-SLUG-NONE)
- [ ] `pnpm typecheck && pnpm lint` pass
- [ ] CI green on all tests in `apps/xa-uploader`

## Decision Log

- 2026-03-12: Chose A1 (direct logger unit test) over A2 (integration-only) — A2 cannot cover logger internals (suppression gate, fallback). Chose B1 (per-branch pattern) over B2 (middleware wrapper) — B2 cannot capture recoverable error branches returned as structured HTTP responses.
- 2026-03-12: Scout finding: `slug` variable is inside the `try` block in the GET handler and not in scope at the catch site — GET error log will use minimal context `{ error: String(error) }`.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Create `uploaderLogger.test.ts` | Yes — logger source confirmed at `apps/xa-uploader/src/lib/uploaderLogger.ts`; all branch paths visible; Jest config confirmed (`testEnvironment: "node"`); mock pattern confirmed from `accessControl.test.ts` | None — logger has no external dependencies; all test seams are in place | No |
| TASK-02: Add `uploaderLog` to `[slug]/route.ts` + extend tests | Yes — route source confirmed; import path confirmed; 3 error branches identified; existing `__tests__/` directory and test files confirmed | Scout finding: `slug` declared inside GET `try` block — not in scope at catch site; use minimal context for GET error log | No — accommodated in scout note; no blocker |

## Overall-confidence Calculation

- S=1, M=2, L=3
- TASK-01: confidence 92%, effort weight S=1
- TASK-02: confidence 90%, effort weight S=1
- Overall-confidence = (92% × 1 + 90% × 1) / (1 + 1) = **91%**

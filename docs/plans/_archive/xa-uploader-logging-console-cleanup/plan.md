---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: "2026-03-12"
Last-reviewed: "2026-03-12"
Last-updated: "2026-03-12"
Build-completed: "2026-03-12"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-logging-console-cleanup
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# XA Uploader Logging Console Cleanup Plan

## Summary

The xa-uploader already has a structured `uploaderLog()` utility (shipped in the prior plan), but five
routes and helpers still call raw `console.warn` / `console.error` directly. This plan converts every
remaining raw console call to `uploaderLog()` and adds logging to three previously zero-coverage paths:
sync lock contention, currency-rates errors, and bulk validation summaries. All changes are additive
import-and-call edits with no behaviour modifications. The plan arose from an operator audit of the
logged idea "when the upload tool breaks in production, there is nothing to investigate".

## Active tasks

- [x] TASK-01: products/route.ts — migrate logContractFailure to uploaderLog — Complete (2026-03-12)
- [x] TASK-02: sync/route.ts — replace console.error + add lock/loadInputs logging — Complete (2026-03-12)
- [x] TASK-03: deploy-drain/route.ts — replace console.error calls — Complete (2026-03-12)
- [x] TASK-04: products/bulk/route.ts — replace console.error + add validation summary log — Complete (2026-03-12)
- [x] TASK-05: currency-rates/route.ts — add uploaderLog for error paths — Complete (2026-03-12)

## Goals

- Every server-side `console.warn` / `console.error` in xa-uploader routes emits a structured JSON event via `uploaderLog()`
- Lock contention, currency-rate failures, and bulk validation errors leave a retrievable log record in production
- No NODE_ENV test guards needed — `uploaderLog()` skips in `NODE_ENV === "test"` already

## Non-goals

- No Sentry or external log transport (left for a separate decision)
- No changes to `wrangler tail` or log retention setup
- No test changes — logging additions are additive and don't affect any existing assertions

## Constraints & Assumptions

- Constraints:
  - Tests run in CI only (testing-policy.md) — no local test execution
  - `uploaderLog()` already skips in `NODE_ENV === "test"` — remove any existing `process.env.NODE_ENV !== "test"` guards around the replaced console calls
  - No external logging deps — console-only
- Assumptions:
  - `uploaderLog` is already importable from `../../../../lib/uploaderLogger` (confirmed — file exists and exports `uploaderLog`)
  - `deployer-drain/route.ts` does not yet import `uploaderLog` (confirmed from source read)
  - `products/bulk/route.ts` does not yet import `uploaderLog` (confirmed)
  - `currency-rates/route.ts` does not yet import `uploaderLog` (confirmed)
  - `sync/route.ts` already imports `uploaderLog` at line 50 (confirmed)
  - `products/route.ts` does not yet import `uploaderLog` (confirmed)

## Inherited Outcome Contract

- **Why:** Operator-stated: when the upload tool breaks in production there is nothing to investigate — no record of what happened or why.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All xa-uploader server-side error paths emit structured log events observable via `wrangler tail`, leaving a clear trail for any production failure.
- **Source:** operator

## Analysis Reference

- Related analysis: none — scope fully defined from direct code reading in prior audit session
- Selected approach inherited:
  - Replace raw `console.*` with `uploaderLog()` calls at confirmed line numbers
  - Add `uploaderLog()` to three zero-coverage paths (lock contention, currency-rates errors, bulk validation summary)
- Key reasoning used:
  - `uploaderLog()` already exists and handles test suppression — no new infra needed
  - Changes are purely additive; no return values or HTTP responses are altered

## Selected Approach Summary

- What was chosen:
  - Per-file: add `uploaderLog` import if missing, replace each raw console call with an equivalent `uploaderLog()` call, remove any surrounding `NODE_ENV !== "test"` guards.
  - For zero-coverage paths: add `uploaderLog()` at the point the failure is detected (before returning the error response).
- Why planning is not reopening option selection:
  - Scope is fully specified from confirmed source line numbers. No architectural decision needed.

## Fact-Find Support

- Supporting brief: None — operator audit + direct source reading in this session.
- Evidence carried forward:
  - `products/route.ts` line 96-105: `logContractFailure()` calls `console.warn` with a `NODE_ENV` gate
  - `sync/route.ts` lines 230-236: `if (process.env.NODE_ENV !== "test") { console.error({...}) }` in `tryPublishCloudCatalogPayload`; line 539: lock busy branch has no log
  - `deploy-drain/route.ts` lines 59, 95: two `console.error()` calls
  - `products/bulk/route.ts` lines 171, 175, 184: three `console.error()` calls; line 132: validation diagnostics returned in response but not logged
  - `currency-rates/route.ts`: no `uploaderLog` import; GET and PUT catch blocks return errors silently

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | products/route.ts — migrate logContractFailure | 85% | S | Pending | - | - |
| TASK-02 | IMPLEMENT | sync/route.ts — console.error + lock/loadInputs logging | 85% | S | Pending | - | - |
| TASK-03 | IMPLEMENT | deploy-drain/route.ts — console.error → uploaderLog | 90% | S | Pending | - | - |
| TASK-04 | IMPLEMENT | products/bulk/route.ts — console.error + validation summary | 85% | S | Pending | - | - |
| TASK-05 | IMPLEMENT | currency-rates/route.ts — add uploaderLog for error paths | 85% | S | Pending | - | - |

## Engineering Coverage

| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — server-side only | - | No rendering changes |
| UX / states | N/A — logging only; no response changes | - | HTTP responses unchanged |
| Security / privacy | Required — no secrets in log context | All tasks | storefront IDs and error codes only; no tokens, passwords, hookUrl verbatim |
| Logging / observability / audit | Required — this IS the change | All tasks | All raw console calls replaced with structured events |
| Testing / validation | N/A — additive changes; no behavior change | - | Existing tests unaffected; uploaderLog skips in test env |
| Data / contracts | N/A — no schema changes | - | |
| Performance / reliability | N/A — console.log is synchronous; no hot-path concern | - | |
| Rollout / rollback | N/A — additive import + call edits | - | Safe to revert |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - | All independent; run in parallel |

## Delivered Processes

None: no material process topology change. These are additive log call additions; no workflow, lifecycle state, CI lane, or runbook is altered.

## Tasks

---

### TASK-01: products/route.ts — migrate logContractFailure to uploaderLog

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/xa-uploader/src/app/api/catalog/products/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/products/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — exact line numbers confirmed from source; trivial import + replace
  - Approach: 90% — same pattern used in sync/route.ts already; well-established
  - Impact: 85% — adds structured trace for contract list/upsert failures; held-back test: no single unknown would drop below 85 because this is a line-for-line replacement with no behaviour change
- **Acceptance:**
  - `uploaderLog` is imported from `../../../../lib/uploaderLogger`
  - `logContractFailure()` function body: replace `console.warn(...)` with `uploaderLog("warn", "catalog_contract_request_failed", { operation, code: error.code, status: error.status ?? null, endpoint: error.endpoint ?? null })`
  - Remove the `if (process.env.NODE_ENV === "test") return;` guard inside `logContractFailure` (uploaderLog already handles it)
  - `pnpm --filter @apps/xa-uploader typecheck` passes
  - `pnpm --filter @apps/xa-uploader lint` passes
- **Engineering Coverage:**
  - UI / visual: N/A — no UI
  - UX / states: N/A — no response change
  - Security / privacy: Required — context fields are `operation` (string enum), `code` (error code), `status` (HTTP int), `endpoint` (URL path, not secret); safe to log
  - Logging / observability / audit: Required — replaces unstructured warn with structured event
  - Testing / validation: N/A — additive; uploaderLog skips in test env
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A — safe to revert
- **Validation contract (TC-01):**
  - TC-01: file parses and typechecks without error after changes
  - TC-02: no `console.warn` calls remain in the file
- **Execution plan:** Add import → edit `logContractFailure` body (replace console.warn, remove NODE_ENV guard) → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:** Confirmed lines 96-105 in source read above.
- **Edge Cases & Hardening:** `error.endpoint` may be `undefined` — map to `null` in context (already done in existing console.warn call)
- **What would make this >=90%:** Only test assertions on log output would push further; deferred.
- **Rollout / rollback:**
  - Rollout: Deploy with normal xa-uploader release
  - Rollback: Revert import + function body edit
- **Documentation impact:** None
- **Notes / references:** `logContractFailure` is called from `GET` (line 214) and `buildProductsUpsertErrorResponse` (line 158)

---

### TASK-02: sync/route.ts — replace console.error + add lock/loadInputs logging

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — exact line numbers confirmed; file already imports `uploaderLog`
  - Approach: 90% — established pattern in same file
  - Impact: 85% — covers publish failure, lock contention, and currency-rates/snapshot load failures; held-back test: no single unknown drops this below 85 because all call sites confirmed from source
- **Acceptance:**
  - In `tryPublishCloudCatalogPayload` (lines 230-236): replace `if (process.env.NODE_ENV !== "test") { console.error({...}) }` with `uploaderLog("error", "catalog_publish_failed", { route: "POST /api/catalog/sync", error: getErrorMessage(error), durationMs: Date.now() - params.startedAt })`
  - In `POST` handler lock-busy branch (line 539): add `uploaderLog("warn", "sync_lock_busy", { storefront: storefrontId })` before the return
  - In `loadCloudSyncInputs` catch block: add `uploaderLog("error", "cloud_sync_inputs_load_failed", { storefront: params.storefrontId, code: error instanceof CatalogDraftContractError ? error.code : "unknown" })` before the return statement
  - No new imports needed — `uploaderLog` already imported at line 50
  - `pnpm --filter @apps/xa-uploader typecheck` passes
  - `pnpm --filter @apps/xa-uploader lint` passes
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — no response changes
  - Security / privacy: Required — no secret values in context; `storefrontId` is a non-sensitive identifier
  - Logging / observability / audit: Required — this IS the change
  - Testing / validation: N/A — uploaderLog skips in test env; existing mocks unaffected
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-02):**
  - TC-01: no `console.error` or `console.warn` calls remain in the file
  - TC-02: typecheck passes
- **Execution plan:** Replace console.error in tryPublishCloudCatalogPayload → add lock-busy log → add loadCloudSyncInputs catch log → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:** All three change sites confirmed from source read above.
- **Edge Cases & Hardening:** `loadCloudSyncInputs` catch re-throws non-`CatalogDraftContractError` errors — the added log runs before the `throw error` so it fires for all error types
- **What would make this >=90%:** Test spy on uploaderLog output.
- **Rollout / rollback:**
  - Rollout: Normal release
  - Rollback: Revert the three edits
- **Documentation impact:** None

---

### TASK-03: deploy-drain/route.ts — console.error → uploaderLog

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — two exact console.error lines confirmed; trivial replacement
  - Approach: 90% — same pattern as other routes
  - Impact: 90% — these are catch blocks covering session and state read failures; held-back test: no unknown would drop this below 90
- **Acceptance:**
  - `uploaderLog` imported from `../../../../lib/uploaderLogger`
  - Line 59 `.catch`: replace `console.error("[deploy-drain] session check failed:", err)` with `uploaderLog("error", "deploy_drain_session_check_failed", { error: String(err) })`
  - Line 95 `.catch`: replace `console.error("[deploy-drain] failed to read pending state:", err)` with `uploaderLog("error", "deploy_drain_pending_state_read_failed", { storefront: storefrontId, error: String(err) })`
  - `pnpm --filter @apps/xa-uploader typecheck` passes
  - `pnpm --filter @apps/xa-uploader lint` passes
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — `.catch` return values unchanged (still returns `false` / `null`)
  - Security / privacy: Required — `err` stringified; no token or session data in `err` for these catch sites
  - Logging / observability / audit: Required
  - Testing / validation: N/A
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-03):**
  - TC-01: no `console.error` calls remain in the file
  - TC-02: typecheck passes
- **Execution plan:** Add import → replace line 59 console.error → replace line 95 console.error → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:** Both console.error lines confirmed in source read above (lines 59 and 95).
- **Edge Cases & Hardening:** `storefrontId` is available at line 95 (parsed just above from `storefront` query param) — include it in context; at line 59 (session check) `storefrontId` is not yet known — omit it
- **What would make this >=90%:** Already at 90 — trivial change with full source confirmation.
- **Rollout / rollback:**
  - Rollout: Normal release
  - Rollback: Revert import + two replacements
- **Documentation impact:** None

---

### TASK-04: products/bulk/route.ts — console.error + validation summary log

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — three console.error lines + validation branch confirmed from source
  - Approach: 90% — same pattern
  - Impact: 85% — adds trace for contract errors and validation failures; held-back test: no single unknown drops below 85
- **Acceptance:**
  - `uploaderLog` imported from `../../../../../lib/uploaderLogger`
  - Line 171: replace `console.error("[products/bulk] catalog contract unconfigured:", error.message)` with `uploaderLog("error", "bulk_contract_unconfigured", { storefront, message: error.message })`
  - Line 175: replace `console.error("[products/bulk] catalog contract error:", error.message)` with `uploaderLog("error", "bulk_contract_error", { storefront, message: error.message })`
  - Line 184: replace `console.error("[products/bulk] unexpected error:", error)` with `uploaderLog("error", "bulk_upsert_failed", { storefront, error: String(error) })`
  - After `validation.diagnostics.length > 0` check (before the return at line 133): add `uploaderLog("warn", "bulk_validation_errors", { storefront, errorCount: validation.diagnostics.length, sample: validation.diagnostics.slice(0, 3) })`
  - `storefront` is available at line 130 (`parseStorefront(...)`) — use it in all four log calls
  - `pnpm --filter @apps/xa-uploader typecheck` passes
  - `pnpm --filter @apps/xa-uploader lint` passes
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — HTTP responses unchanged
  - Security / privacy: Required — `error.message` and `String(error)` may contain product data; acceptable for internal tool; `storefront` is non-sensitive; diagnostic `sample` contains row numbers + validation messages only (no credentials)
  - Logging / observability / audit: Required
  - Testing / validation: N/A
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-04):**
  - TC-01: no `console.error` calls remain in the file
  - TC-02: typecheck passes
  - TC-03: validation summary log fires before the 400 response when diagnostics are present
- **Execution plan:** Add import → replace three console.error calls → add validation summary log → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:** `storefront` variable confirmed available at line 130 (inside the outer try block); all console.error lines confirmed from source read.
- **Edge Cases & Hardening:** `sample: validation.diagnostics.slice(0, 3)` — safe; `BULK_MAX_DIAGNOSTICS = 25` so diagnostics.length is already bounded
- **What would make this >=90%:** Test spy on log output.
- **Rollout / rollback:**
  - Rollout: Normal release
  - Rollback: Revert import + four edits
- **Documentation impact:** None

---

### TASK-05: currency-rates/route.ts — add uploaderLog for error paths

- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — GET and PUT catch blocks confirmed from source; no existing logging at all
  - Approach: 90% — additive log before return statement; same pattern
  - Impact: 85% — closes the zero-coverage gap on currency-rates errors; held-back test: no single unknown drops below 85
- **Acceptance:**
  - `uploaderLog` imported from `../../../../lib/uploaderLogger`
  - `DEFAULT_STOREFRONT` is already imported — use it as the `storefront` context value for both GET and PUT
  - In `GET` catch (lines 63-76):
    - Before `CatalogDraftContractError` return: `uploaderLog("error", "currency_rates_read_failed", { storefront: DEFAULT_STOREFRONT, code: error.code })`
    - Before fallback return: `uploaderLog("error", "currency_rates_read_failed", { storefront: DEFAULT_STOREFRONT, error: String(error) })`
  - In `PUT` catch (lines 132-140):
    - Before `CatalogDraftContractError` return: `uploaderLog("error", "currency_rates_write_failed", { storefront: DEFAULT_STOREFRONT, code: error.code })`
    - Before fallback return: `uploaderLog("error", "currency_rates_write_failed", { storefront: DEFAULT_STOREFRONT, error: String(error) })`
  - `pnpm --filter @apps/xa-uploader typecheck` passes
  - `pnpm --filter @apps/xa-uploader lint` passes
- **Engineering Coverage:**
  - UI / visual: N/A
  - UX / states: N/A — responses unchanged
  - Security / privacy: Required — `code` is an error enum; `String(error)` for unexpected errors; no tokens/rates values logged
  - Logging / observability / audit: Required — closes zero-coverage gap
  - Testing / validation: N/A
  - Data / contracts: N/A
  - Performance / reliability: N/A
  - Rollout / rollback: N/A
- **Validation contract (TC-05):**
  - TC-01: typecheck passes
  - TC-02: GET and PUT catch blocks both have uploaderLog calls before returns
- **Execution plan:** Add import → add four log calls (two in GET catch, two in PUT catch) → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:** `DEFAULT_STOREFRONT` already imported at line 8. Catch structure confirmed from source read above.
- **Edge Cases & Hardening:** `error.code` only exists when `error instanceof CatalogDraftContractError` — only access `.code` inside that branch; use `String(error)` in fallback catch
- **What would make this >=90%:** Test spy on log output.
- **Rollout / rollback:**
  - Rollout: Normal release
  - Rollback: Revert import + four log call additions
- **Documentation impact:** None

---

## Risks & Mitigations

- `String(error)` for unexpected errors may produce `[object Object]` for non-Error throws — acceptable for an internal admin tool; `uploaderLog` already has a non-serializable fallback for the context object anyway.
- The `storefront` variable in `products/bulk/route.ts` TASK-04 is declared inside the outer `try` block — the `uploaderLog` for validation errors is also inside that `try`, so `storefront` is in scope. Confirmed from source lines 130-145.

## Observability

- Logging: All five files will emit structured JSON events via `uploaderLog()` on every error path
- Metrics: None
- Alerts/Dashboards: None — `wrangler tail --format json` is the operator's diagnostic channel

## Acceptance Criteria (overall)

- [ ] No raw `console.warn` or `console.error` calls remain in any of the five modified files
- [ ] `pnpm --filter @apps/xa-uploader typecheck` passes
- [ ] `pnpm --filter @apps/xa-uploader lint` passes
- [ ] Sync lock contention logs `sync_lock_busy`
- [ ] Currency-rates errors log `currency_rates_read_failed` / `currency_rates_write_failed`
- [ ] Bulk validation failures log `bulk_validation_errors` before the 400 response

## Decision Log

- 2026-03-12: Use `String(error)` for unexpected error context rather than `getErrorMessage()` — `getErrorMessage` is available in sync/route.ts but not imported in other files; `String()` is universal and avoids unnecessary imports.
- 2026-03-12: Use `DEFAULT_STOREFRONT` as storefront context in currency-rates route — the route hardcodes `DEFAULT_STOREFRONT` in all its read/write calls already; consistent with existing code.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: products/route.ts | Yes — uploaderLog exists, file confirmed | None | No |
| TASK-02: sync/route.ts | Yes — uploaderLog already imported | None — three change sites all confirmed | No |
| TASK-03: deploy-drain/route.ts | Yes — two console.error lines confirmed | None | No |
| TASK-04: products/bulk/route.ts | Yes — storefront var in scope for all edits | None — all four edit sites confirmed | No |
| TASK-05: currency-rates/route.ts | Yes — DEFAULT_STOREFRONT already imported | None — GET/PUT catch structures confirmed | No |

No blocking rehearsal findings.

## Overall-confidence Calculation

- TASK-01: 85% × S(1) = 85
- TASK-02: 85% × S(1) = 85
- TASK-03: 90% × S(1) = 90
- TASK-04: 85% × S(1) = 85
- TASK-05: 85% × S(1) = 85
- Sum weights: 5; Sum (confidence × weight): 430
- Overall-confidence: 430/5 = 86% → 85% (rounded to nearest 5)

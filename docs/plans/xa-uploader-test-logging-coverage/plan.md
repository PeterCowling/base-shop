---
Type: Plan
Status: Active
Domain: Platform
Workstream: Engineering
Created: "2026-03-11"
Last-reviewed: "2026-03-11"
Last-updated: "2026-03-11"
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-test-logging-coverage
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# XA Uploader Test and Logging Coverage Plan

## Summary

xa-uploader's golden path upload pipeline (edit → save → image upload → publish → sync → deploy) has gaps in both structured logging and test coverage. This plan adds a minimal structured logger utility, instruments server-side golden-path operations, and fills 14 test scenarios covering autosave conflict retry, image cycle, session expiry, unpublish state, currency rates missing, concurrent sync lock, rate limit headers, media validation strict mode, empty sync confirmation, middleware cookie handling, and image reorder/promote operations. All tasks are additive (no behavior changes), CI-only for tests, and safe to revert.

## Active tasks
- [ ] TASK-01: Add structured logger utility
- [ ] TASK-02: Instrument server-side routes and libs
- [ ] TASK-03: Structured logging for client-side console actions
- [ ] TASK-04: Golden path tests — autosave, image cycle, session, unpublish, currency
- [ ] TASK-05: Sync lock and rate limit branch coverage tests
- [ ] TASK-06: Media validation, empty sync, middleware cookie, image reorder tests

## Goals
- Add structured logging across the xa-uploader golden path for production diagnostics
- Lock down key edit/publish/sync paths against regression with deterministic tests
- Cover branching failure modes (lock conflict, rate limit, strict validation, empty input) with tests

## Non-goals
- No behavior changes to existing routes or components
- No new live Playwright/browser-matrix tests
- No changes to xa-b or xa-drop-worker

## Constraints & Assumptions
- Constraints:
  - Tests run in CI only (testing-policy.md) — no local test execution
  - Logger must be Cloudflare Workers compatible (no Node-only APIs in server logger)
  - Client-side code (catalogConsoleActions.ts) runs in browser — use structured console.log pattern, not Node logger
  - No external logging dependencies (wrangler tail is the target output for structured logs)
- Assumptions:
  - Existing Jest mock patterns in xa-uploader test suite are correct and representative
  - `acquireCloudSyncLock` returning `{ status: "busy" }` is the correct mock for lock-held scenario (confirmed in sync route source)
  - `withRateHeaders` sets X-RateLimit-Limit/Remaining/Reset headers (confirmed in rateLimit.ts)
  - `applyCloudMediaExistenceValidation` strict mode with too-many-keys returns 400 (confirmed in catalogCloudPublish.ts)

## Inherited Outcome Contract

- **Why:** Operator-stated: the XA upload golden path has no structured logging and key paths are untested, making production failures invisible and regressions undetectable.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** xa-uploader golden path emits structured log events for production diagnosis, and 14 deterministic test scenarios prevent silent regression across the core upload pipeline.
- **Source:** operator

## Analysis Reference
- Related analysis: none — micro_build_ready dispatch packets (IDEA-DISPATCH-20260311153000-0001/0002/0003); scope fully defined from direct code exploration
- Selected approach inherited:
  - Add minimal `uploaderLogger` utility (structured JSON-line console.log wrapper)
  - Instrument server-side routes and libs at start/success/error call sites
  - Add tests using established mock patterns from existing xa-uploader test suite
- Key reasoning used:
  - No external logging deps keeps Cloudflare Workers compatibility and zero bundle impact
  - All tests use jest.fn() mock patterns confirmed in existing sync/publish/products test files

## Selected Approach Summary
- What was chosen:
  - Structured logging: `uploaderLogger.ts` wrapping `console.log(JSON.stringify({level, event, ts, ...context}))` — workers-compatible, no deps
  - Tests: extend existing test files where tests exist; create new test files where none exists
- Why planning is not reopening option selection:
  - Scope is fully defined from direct code exploration
  - No architectural decision needed; all tasks are additive code additions

## Fact-Find Support
- Supporting brief: None — operator-provided spec from direct exploration session
- Evidence carried forward:
  - Sync route: `acquireCloudSyncLock` returns `{ status: "busy" }` → route returns HTTP 409 `{error: "conflict", reason: "sync_already_running"}`
  - Sync route: empty publishable products + no confirmEmptyInput → HTTP 409 `{error: "no_publishable_products", requiresConfirmation: true}`
  - rateLimit.ts: `withRateHeaders` sets X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset; adds Retry-After when not allowed
  - catalogCloudPublish.ts: strict mode + keys > CLOUD_MEDIA_HEAD_MAX_KEYS → HTTP 400; strict mode + bucket null → HTTP 400
  - middleware.ts + uploaderAuth.ts: invalid/missing session cookie → redirect to login

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add structured logger utility | 85% | S | Pending | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Instrument server-side routes and libs | 80% | S | Pending | TASK-01 | - |
| TASK-03 | IMPLEMENT | Structured logging for client console actions | 80% | S | Pending | TASK-01 | - |
| TASK-04 | IMPLEMENT | Golden path tests — autosave, image, session, unpublish, currency | 80% | S | Pending | - | - |
| TASK-05 | IMPLEMENT | Sync lock and rate limit branch coverage tests | 80% | S | Pending | - | - |
| TASK-06 | IMPLEMENT | Media validation, empty sync, middleware, image reorder tests | 80% | S | Pending | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | N/A — no visual changes | - | All changes are server-side code and test files |
| UX / states | Required — tests cover conflict, lock, session expiry, unpublish, empty sync | TASK-04, TASK-05, TASK-06 | Deterministic test assertions; no UI component changes |
| Security / privacy | N/A — logger masks hookUrl; no new auth surface | - | deployhook URL is not logged verbatim; only masked form |
| Logging / observability / audit | Required — structured logger added to golden path | TASK-01, TASK-02, TASK-03 | wrangler tail is the target output |
| Testing / validation | Required — 14 new test scenarios | TASK-04, TASK-05, TASK-06 | CI-only per testing-policy.md |
| Data / contracts | N/A — no schema or API contract changes | - | Logging is additive; tests assert existing contracts |
| Performance / reliability | Required — tests cover concurrency (sync lock), rate limiting | TASK-05 | No performance-sensitive changes |
| Rollout / rollback | N/A — additive changes only | - | Logging additions and tests can be reverted safely |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Logger utility must exist before instrumentation tasks |
| 2 | TASK-02, TASK-03, TASK-04, TASK-05, TASK-06 | TASK-01 (only for TASK-02/03) | TASK-04/05/06 can run in parallel with TASK-02/03 |

## Tasks

---

### TASK-01: Add structured logger utility
- **Type:** IMPLEMENT
- **Deliverable:** New file `apps/xa-uploader/src/lib/uploaderLogger.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/xa-uploader/src/lib/uploaderLogger.ts` (new)
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — trivial utility, confirmed no external deps needed, workers-compatible
  - Approach: 90% — structured JSON console.log is the established pattern for Cloudflare Workers logging
  - Impact: 85% — enables all downstream instrumentation; additive only
- **Acceptance:**
  - `uploaderLogger.ts` exports `log(level: "info" | "warn" | "error", event: string, context?: Record<string, unknown>): void`
  - Output format: `console.log(JSON.stringify({ level, event, ts: new Date().toISOString(), ...context }))`
  - Works in both Node.js (server routes) and browser (no runtime check needed — console.log is universal)
  - No external dependencies imported
  - Passes typecheck: `pnpm --filter @apps/xa-uploader typecheck`
- **Engineering Coverage:**
  - UI / visual: N/A — new utility file, no UI surface
  - UX / states: N/A — no user-facing behavior
  - Security / privacy: N/A — no sensitive data in utility itself; callers responsible for not logging secrets
  - Logging / observability / audit: Required — this IS the logging utility
  - Testing / validation: N/A — S-effort utility; typecheck + lint sufficient; no behavioral branches to test
  - Data / contracts: N/A — no data schema
  - Performance / reliability: N/A — `console.log` is synchronous and zero-allocation aside from JSON.stringify
  - Rollout / rollback: N/A — additive file; safe to delete
- **Validation contract (TC-01):**
  - TC-01: `log("info", "upload_start", { storefront: "xa" })` → emits valid JSON string with `level`, `event`, `ts`, `storefront` fields to console.log
  - TC-02: `log("error", "upload_failed")` (no context) → emits valid JSON with `level`, `event`, `ts` only
- **Execution plan:** Create `uploaderLogger.ts` with the three-field `log` function → verify typecheck passes
- **Planning validation (required for M/L):** None — S effort
- **Scouts:** None — utility is trivial, no external API calls
- **Edge Cases & Hardening:** log() must not throw even if context is not JSON-serializable; add `try { ... } catch { console.log(JSON.stringify({level, event, ts})) }` fallback
- **What would make this >=90%:** Already at 85-90 on implementation/approach; impact capped at 85 because we don't verify wrangler tail display until a live test.
- **Rollout / rollback:**
  - Rollout: Deploy with any xa-uploader release; no feature flag needed
  - Rollback: Delete the file; remove import sites in TASK-02/03
- **Documentation impact:** None — internal utility
- **Notes / references:**
  - Cloudflare Workers: `console.log` output is captured by `wrangler tail --format json`; structured JSON is parseable
  - Dispatch: IDEA-DISPATCH-20260311153000-0001

---

### TASK-02: Instrument server-side routes and libs
- **Type:** IMPLEMENT
- **Deliverable:** Updated files: `apps/xa-uploader/src/app/api/catalog/images/route.ts`, `apps/xa-uploader/src/app/api/catalog/publish/route.ts`, `apps/xa-uploader/src/lib/deployHook.ts`, `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/images/route.ts`
  - `apps/xa-uploader/src/app/api/catalog/publish/route.ts`
  - `apps/xa-uploader/src/lib/deployHook.ts`
  - `apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
  - `[readonly] apps/xa-uploader/src/lib/uploaderLogger.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — call-site additions confirmed from source reading; straightforward import + call pattern
  - Approach: 85% — established pattern; uploaderLogger already defined in TASK-01
  - Impact: 80% — adds production diagnostics for 4 key modules
  - Held-back test for impact=80: No single unresolved unknown would drop impact below 80 because logs are additive and don't change any existing behavior.
- **Acceptance:**
  - images/route.ts: logs `upload_start` (storefront, slug, contentType, bytes), `upload_success` (storefront, key, bytes), `upload_failed` (storefront, errorCode)
  - publish/route.ts: logs `publish_start` (storefront), `publish_complete` (storefront, durationMs, publishState), `publish_error` (storefront, reason)
  - deployHook.ts: logs `deploy_hook_triggered` (storefront), `deploy_hook_failed` (storefront, reason, httpStatus, attempt), `deploy_hook_retry` (attempt, delayMs), `deploy_hook_exhausted` (storefront, attempts)
  - catalogDraftContractClient.ts: logs `sync_lock_failed` (storefront, code), `read_snapshot_error` (storefront, code), `write_snapshot_error` (storefront)
  - All log calls use `uploaderLogger.log(...)` — no raw `console.log` replaced in these files (additive only)
  - hookUrl is NOT logged verbatim in deployHook.ts (omit or log only the hostname)
  - Passes typecheck and lint
- **Engineering Coverage:**
  - UI / visual: N/A — server-side files only
  - UX / states: N/A — logging calls don't affect response behavior
  - Security / privacy: Required — hookUrl must not be logged verbatim (omit or log masked form)
  - Logging / observability / audit: Required — this IS the instrumentation
  - Testing / validation: N/A — logging calls are additive; existing route tests continue passing (no behavior change)
  - Data / contracts: N/A — no schema changes
  - Performance / reliability: N/A — console.log is synchronous; no hot-path concern for infrequent ops
  - Rollout / rollback: N/A — additive import + log calls
- **Validation contract (TC-02):**
  - TC-01: After change, `pnpm --filter @apps/xa-uploader typecheck` passes
  - TC-02: After change, `pnpm --filter @apps/xa-uploader lint` passes
  - TC-03: No existing test assertions broken (tests mock these modules; log calls don't affect mock return values)
- **Execution plan:** Import `uploaderLogger` in each file → add log calls at documented call sites → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:**
  - deployHook.ts: `maybeTriggerXaBDeploy` function — confirmed log sites: line ~624 (triggered), ~642 (failed), ~653 (exhausted), retry inside loop
  - images/route.ts: confirmed session check + r2 upload path — log sites: after rate limit pass, before/after `bucket.put()`, in error branches
  - catalogDraftContractClient.ts: `acquireCloudSyncLock` and `readCloudDraftSnapshot` are the key functions
- **Edge Cases & Hardening:**
  - Do not log inside test environment (existing pattern: `if (process.env.NODE_ENV !== "test") { console.error(...) }` already present in sync route) — follow same pattern for structured logs to avoid polluting test output
- **What would make this >=90%:** Test assertions on log output (would require spy on console.log); deferred to post-build if needed.
- **Rollout / rollback:**
  - Rollout: Deploy with normal xa-uploader release
  - Rollback: Remove log import lines; no state change
- **Documentation impact:** None
- **Notes / references:**
  - Existing pattern in sync route (line 222): `if (process.env.NODE_ENV !== "test") { console.error(...) }` — follow this for structured logs
  - Dispatch: IDEA-DISPATCH-20260311153000-0001

---

### TASK-03: Structured logging for client-side console actions
- **Type:** IMPLEMENT
- **Deliverable:** Updated file `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `[readonly] apps/xa-uploader/src/lib/uploaderLogger.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — confirmed call sites in saveDraft/saveProduct functions; browser-safe pattern
  - Approach: 85% — console.log with structured args is browser-compatible
  - Impact: 80% — adds edit/save diagnostics visible in browser devtools and (if SSR) server logs
  - Held-back test: No single unknown drops below 80; this is an additive console.log call.
- **Acceptance:**
  - saveDraft / saveProduct: logs `product_save_start` (slug), `product_save_conflict` (slug), `product_save_success` (slug, revision), `product_save_error` (slug, error reason)
  - Uses `uploaderLogger.log(...)` (same utility — console.log works in browser context)
  - No behavioral change; `SaveResult` return values unchanged
  - Passes typecheck and lint
- **Engineering Coverage:**
  - UI / visual: N/A — no rendering change
  - UX / states: N/A — logging only; save result types unchanged
  - Security / privacy: N/A — slug is not sensitive; no session tokens or user data logged
  - Logging / observability / audit: Required — adds save-path diagnostics
  - Testing / validation: N/A — additive; existing tests not affected
  - Data / contracts: N/A — no contract change
  - Performance / reliability: N/A — console.log in browser is negligible
  - Rollout / rollback: N/A — additive import + log calls
- **Validation contract (TC-03):**
  - TC-01: `pnpm --filter @apps/xa-uploader typecheck` passes
  - TC-02: `pnpm --filter @apps/xa-uploader lint` passes
- **Execution plan:** Add log calls at `product_save_start`, conflict branch, success branch, error branch → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:**
  - `saveDraft` function in catalogConsoleActions.ts uses `useCatalogConsole.client.ts` — confirmed this is a client component
  - SaveResult type confirmed: `"saved" | "busy" | "validation_error" | "conflict" | "cancelled" | "error"`
- **Edge Cases & Hardening:** Only log in non-test environment (`NODE_ENV !== "test"`) to avoid test output pollution
- **What would make this >=90%:** Same as TASK-02 — spy on console.log in tests.
- **Rollout / rollback:**
  - Rollout: Normal release
  - Rollback: Remove log calls
- **Documentation impact:** None
- **Notes / references:**
  - Dispatch: IDEA-DISPATCH-20260311153000-0001

---

### TASK-04: Golden path tests — autosave conflict, image cycle, session expiry, unpublish, currency rates
- **Type:** IMPLEMENT
- **Deliverable:** New/extended test files in `apps/xa-uploader/src/`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/__tests__/catalogConsoleActions.test.ts` (new)
  - `apps/xa-uploader/src/app/api/catalog/products/[slug]/__tests__/route.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts`
  - `apps/xa-uploader/src/app/api/catalog/currency-rates/__tests__/route.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — mock patterns confirmed in existing sync/publish tests; route behavior confirmed from source
  - Approach: 85% — Jest mock pattern with jest.fn() mocks is established throughout the codebase
  - Impact: 80% — prevents silent regression on autosave conflict, image cycle, session, unpublish, currency paths
  - Held-back test for impact=80: No single unknown drops below 80 because mock patterns are directly confirmed and route behavior is deterministic.
- **Acceptance:**
  - **B1 (autosave conflict):** `mergeAutosaveImageTuples` test in `catalogConsoleActions.test.ts` covers: local image added + server baseline has older image → merged result contains both; deleted image removed from merged result
  - **B2 (image cycle):** `mergeAutosaveImageTuples` covers: upload → imageFiles includes new path; remove → imageFiles excludes removed path
  - **B3 (session expiry):** `[slug]/route.test.ts` has a test: missing session cookie → PUT /products/[slug] → HTTP 401/404 (per route behavior: returns 404 when unauthenticated)
  - **B4 (unpublish):** `route.publish.test.ts` has a test: POST /publish with publishState absent or `"draft"` → appropriate route response (either accepted or rejected based on actual route behavior)
  - **B5 (currency rates missing):** `currency-rates/route.test.ts` has a test: currency rates source returns null/empty → route returns appropriate response
  - All tests follow existing file mock patterns
  - `pnpm --filter @apps/xa-uploader typecheck` and lint pass
- **Engineering Coverage:**
  - UI / visual: N/A — test files only
  - UX / states: Required — tests assert behavior for conflict, expiry, unpublish, missing rates states
  - Security / privacy: N/A — tests mock session; no live auth
  - Logging / observability / audit: N/A — tests don't assert log output
  - Testing / validation: Required — 5 new test scenarios
  - Data / contracts: N/A — tests use existing mock data shapes
  - Performance / reliability: N/A — unit tests; no performance concern
  - Rollout / rollback: N/A — test additions are safe to revert
- **Validation contract (TC-04):**
  - TC-01: `mergeAutosaveImageTuples` — local adds image → merged includes it
  - TC-02: `mergeAutosaveImageTuples` — local removes image vs baseline → merged excludes it
  - TC-03: PUT /products/[slug] without session → HTTP 404
  - TC-04: Currency rates route with null source → response handled without 500
  - TC-05: Publish route — test verifies expected behavior for draft→live or live→draft transition
- **Execution plan:** Create `catalogConsoleActions.test.ts` with `mergeAutosaveImageTuples` tests; extend `[slug]/route.test.ts` with missing-session test; extend `route.publish.test.ts` with state transition test; extend `currency-rates/route.test.ts` with null-rates test → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:**
  - Confirmed: `[slug]/route.test.ts` already has mock structure for `hasUploaderSession` → can add unauthenticated case
  - Confirmed: `route.publish.test.ts` has `hasUploaderSessionMock` and `publishCatalogPayloadToContractMock` → can extend
  - Confirmed: `currency-rates/route.test.ts` exists for extension
  - Note: B4 (unpublish) requires reading the publish route more carefully to understand what publishState values are accepted — execution agent should read `publish/route.ts` before writing the test
- **Edge Cases & Hardening:**
  - `mergeAutosaveImageTuples` is a pure function with no mocks needed — straightforward unit test
  - Publish route may not currently accept publishState transitions (may be handled elsewhere) — execution agent must read the route before asserting behavior
- **What would make this >=90%:** Adding integration-style tests that exercise the full route handler (rather than pure function tests). Deferred — pure function + route mock tests are appropriate for S effort.
- **Rollout / rollback:**
  - Rollout: Tests are CI-only; no deploy impact
  - Rollback: Delete new test file; revert extended test files
- **Documentation impact:** None
- **Notes / references:**
  - Dispatch: IDEA-DISPATCH-20260311153000-0002
  - `mergeAutosaveImageTuples` is in `catalogConsoleActions.ts` lines 72-113 — exported and pure, easy to unit test without mocks

---

### TASK-05: Sync lock and rate limit branch coverage tests
- **Type:** IMPLEMENT
- **Deliverable:** Extended test files for sync route and rateLimit
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/rateLimit.test.ts`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — mock patterns confirmed; response codes confirmed from source (`acquireCloudSyncLock` busy → 409; rate limit exceeded → 429 with X-RateLimit-* headers)
  - Approach: 85% — extend existing test files with new `it()` blocks using confirmed mock patterns
  - Impact: 80% — covers two critical reliability paths: concurrent sync prevention and rate limit enforcement
  - Held-back test for impact=80: No single unknown drops below 80 — route behavior is deterministic and confirmed in source.
- **Acceptance:**
  - **B6 (concurrent sync lock):** sync route test: `acquireCloudSyncLockMock.mockResolvedValueOnce({ status: "busy" })` → POST /catalog/sync → HTTP 409 with `{ error: "conflict", reason: "sync_already_running" }`
  - **C1 (rate limit headers):** rateLimit.test.ts: `withRateHeaders` / `applyRateLimitHeaders` — allowed request → response has X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers; denied request (nextCount > max) → also has Retry-After header
  - All tests pass typecheck and lint
- **Engineering Coverage:**
  - UI / visual: N/A — test files only
  - UX / states: Required — tests assert lock conflict (409) and rate limit (429) behavior
  - Security / privacy: N/A — no auth change
  - Logging / observability / audit: N/A — no logging assertions
  - Testing / validation: Required — 2 new test scenarios
  - Data / contracts: N/A — tests use existing mock shapes
  - Performance / reliability: Required — concurrency lock test directly covers reliability path
  - Rollout / rollback: N/A — test additions
- **Validation contract (TC-05):**
  - TC-01: sync route, lock busy → HTTP 409 `{error: "conflict", reason: "sync_already_running"}`
  - TC-02: `withRateHeaders` on allowed result → response headers include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset; no Retry-After
  - TC-03: `withRateHeaders` on denied result → response headers include Retry-After
- **Execution plan:** Add `it("returns 409 when sync lock is already acquired", ...)` to sync route test; add `it("sets rate limit headers on responses", ...)` and `it("sets Retry-After header when rate limited", ...)` to rateLimit.test.ts → typecheck + lint
- **Planning validation (required for M/L):** None — S effort
- **Scouts:**
  - Confirmed in route.ts lines 524-533: `acquired.status === "busy"` → returns 409 with `{ ok: false, error: "conflict", reason: "sync_already_running" }`
  - Confirmed in rateLimit.ts lines 96-108: `withRateHeaders` calls `applyRateLimitHeaders` which sets all 3 headers; Retry-After only set when `!result.allowed`
  - Note: `withRateHeaders` is not directly importable in the rateLimit test since it takes a `NextResponse`. The test can test `applyRateLimitHeaders` directly with a `new Headers()` instance.
- **Edge Cases & Hardening:**
  - `withRateHeaders` returns the NextResponse — test should verify the returned response has the expected headers
  - For the sync lock test, also verify `releaseCloudSyncLockMock` is NOT called (lock was never acquired)
- **What would make this >=90%:** Testing more rate limit store edge cases (store overflow, pruning). Deferred — scope is branch coverage of known paths.
- **Rollout / rollback:**
  - Rollout: CI-only
  - Rollback: Revert test additions
- **Documentation impact:** None
- **Notes / references:**
  - Dispatch: IDEA-DISPATCH-20260311153000-0002 (B6) and IDEA-DISPATCH-20260311153000-0003 (C1)
  - `applyRateLimitHeaders` is exported from rateLimit.ts — use this for the header test to avoid NextResponse dependency

---

### TASK-06: Media validation, empty sync confirmation, middleware cookie, image reorder tests
- **Type:** IMPLEMENT
- **Deliverable:** Extended test files covering remaining branch coverage gaps
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
  - `apps/xa-uploader/src/lib/__tests__/catalogSyncInput.test.ts`
  - `apps/xa-uploader/src/__tests__/middleware.test.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductImagesFields.test.ts`
  - (Optional) `apps/xa-uploader/src/lib/__tests__/catalogCloudPublish.test.ts` (new if needed for C2)
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 85% — mock patterns confirmed; route behavior confirmed; middleware test file already exists
  - Approach: 85% — extend existing test files; catalogCloudPublish tests may need a new file
  - Impact: 80% — closes 5 branch-coverage gaps that could silently regress
  - Held-back test for impact=80: No single unknown drops below 80 — all confirmed from source reading.
- **Acceptance:**
  - **C2 (media validation strict mode):** `applyCloudMediaExistenceValidation` with `policy: "strict"` and `keysToCheck.length` exceeding `CLOUD_MEDIA_HEAD_MAX_KEYS` → returns `{ ok: false }` with status 400. Also: strict + bucket null → returns `{ ok: false }` with status 400. Tested via unit test on `catalogCloudPublish.ts` (or via sync route with `applyCloudMediaExistenceValidationMock`).
  - **C3 (empty sync confirmation):** sync route test: snapshot with 0 publishable products + `confirmEmptyInput: false` → HTTP 409 `{error: "no_publishable_products", requiresConfirmation: true}`; with `confirmEmptyInput: true` → sync proceeds past the gate (no 409 from this check)
  - **C4 (middleware malformed cookie):** middleware test: request with malformed/truncated session cookie value → middleware does not throw; response is a redirect or 401/404 (per existing middleware behavior)
  - **C5 (image reorder/promote):** `mergeAutosaveImageTuples` tests — already covered by TASK-04 for add/remove; add: local tuple array in different order than server → merged result follows local order; promote (first element) → merged result has promoted image first
  - All tests pass typecheck and lint
- **Engineering Coverage:**
  - UI / visual: N/A — test files only
  - UX / states: Required — tests assert empty sync (requiresConfirmation), malformed auth, image ordering
  - Security / privacy: Required — middleware malformed cookie test exercises auth boundary
  - Logging / observability / audit: N/A — no logging assertions
  - Testing / validation: Required — 5 new test scenarios
  - Data / contracts: N/A — tests use existing mock shapes
  - Performance / reliability: N/A — unit tests
  - Rollout / rollback: N/A — test additions
- **Validation contract (TC-06):**
  - TC-01: `applyCloudMediaExistenceValidation` strict + too many keys → `{ ok: false }` with 400 response body
  - TC-02: `applyCloudMediaExistenceValidation` strict + bucket null → `{ ok: false }` with 400 response body
  - TC-03: sync route, 0 publishable products + no confirmEmptyInput → HTTP 409 `requiresConfirmation: true`
  - TC-04: sync route, 0 publishable products + `confirmEmptyInput: true` → proceeds past empty-check gate
  - TC-05: middleware with malformed cookie → does not throw; returns redirect or 401/404
  - TC-06: `mergeAutosaveImageTuples` — local reorders images → result order follows local
  - TC-07: `mergeAutosaveImageTuples` — promote image to position 0 → merged result starts with promoted image
- **Execution plan:**
  - Test `applyCloudMediaExistenceValidation` directly (unit test on pure function with mocked R2 bucket) or extend sync route test with `applyCloudMediaExistenceValidationMock.mockResolvedValueOnce({ ok: false, errorResponse: ... })`
  - Extend sync route test with empty-products scenarios
  - Extend middleware test with malformed cookie header
  - Extend `catalogConsoleActions.test.ts` with reorder/promote assertions on `mergeAutosaveImageTuples`
- **Planning validation (required for M/L):** None — S effort
- **Scouts:**
  - Confirmed: sync route line 390: `if (publishableProducts.length === 0 && !payload.options.confirmEmptyInput)` → 409
  - Confirmed: `applyCloudMediaExistenceValidation` is a pure async function in `catalogCloudPublish.ts` — can be unit tested directly
  - Note: `applyCloudMediaExistenceValidation` depends on `getMediaBucket()` — this is mockable
  - Confirmed: middleware test file exists at `src/__tests__/middleware.test.ts`; has existing patterns
  - Note: C2 may need a dedicated test file `catalogCloudPublish.test.ts` — execution agent to check if `applyCloudMediaExistenceValidation` can be tested via sync route mock or needs direct import
- **Edge Cases & Hardening:**
  - C4: malformed cookie — test with `Cookie: session=not-json`, `Cookie: session=`, and `Cookie: session={invalid}` — middleware must handle all gracefully
  - C3: For `confirmEmptyInput: true` path, also verify no HTTP 409 is returned from the empty-check; the sync may still fail downstream for other reasons (e.g., unconfigured contract) — mock those downstream calls to succeed
- **What would make this >=90%:** Direct unit tests for `applyCloudMediaExistenceValidation` rather than via sync route mock. Execution agent should implement direct tests if feasible.
- **Rollout / rollback:**
  - Rollout: CI-only
  - Rollback: Revert test additions; delete new test files
- **Documentation impact:** None
- **Notes / references:**
  - Dispatch: IDEA-DISPATCH-20260311153000-0003
  - C5 (image reorder/promote) can reuse `mergeAutosaveImageTuples` test from TASK-04; add reorder/promote assertions there

## Risks & Mitigations
- Logging in test environment: Existing pattern `if (process.env.NODE_ENV !== "test") { console.error(...) }` must be followed to prevent test output pollution. Mitigated by explicit note in TASK-02/03.
- Publish route test for unpublish (B4): The publish route may not support downgrading publishState from "live" to "draft" — this may simply be a test of what the route currently rejects. Execution agent must read `publish/route.ts` before writing the assertion.
- Image reorder overlaps with TASK-04/06: Both tasks test `mergeAutosaveImageTuples`; execution agent should consolidate into one test file to avoid duplication.

## Observability
- Logging: TASK-01-03 add structured JSON logging to golden path operations
- Metrics: None — no metrics collection added
- Alerts/Dashboards: None — wrangler tail is the operator's diagnostic channel

## Acceptance Criteria (overall)
- [ ] `apps/xa-uploader/src/lib/uploaderLogger.ts` exists and exports `log(level, event, context?)`
- [ ] Golden path routes (images, publish) and libs (deployHook, catalogDraftContractClient) import and call uploaderLogger
- [ ] `pnpm --filter @apps/xa-uploader typecheck` passes
- [ ] `pnpm --filter @apps/xa-uploader lint` passes
- [ ] 14 new test scenarios added across TASK-04, TASK-05, TASK-06 test files
- [ ] No existing tests broken

## Decision Log
- 2026-03-11: Chose structured JSON console.log wrapper over an external logging library (pino, etc.) — Cloudflare Workers compatibility and zero bundle impact; wrangler tail captures console.log in JSON format natively.
- 2026-03-11: Confirmed tests run in CI only per testing-policy.md — no local test execution in validation commands.
- 2026-03-11: Image reorder/promote tests (C5) added to TASK-04's catalogConsoleActions.test.ts rather than CatalogProductImagesFields.test.ts — `mergeAutosaveImageTuples` is the logic function to test, not the UI component.
- [Adjacent: delivery-rehearsal] Add console.log spy in tests to assert structured log output — adjacent scope; would require test behavior changes and is low value for S-effort tasks. Route to post-build reflection.

## Overall-confidence Calculation
- TASK-01: 85% × S(1) = 85
- TASK-02: 80% × S(1) = 80
- TASK-03: 80% × S(1) = 80
- TASK-04: 80% × S(1) = 80
- TASK-05: 80% × S(1) = 80
- TASK-06: 80% × S(1) = 80
- Sum weights: 6; Sum (confidence × weight): 485
- Overall-confidence: 485/6 = ~81%

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Add uploaderLogger | Yes — new file, no deps | None | No |
| TASK-02: Instrument server routes/libs | Yes — TASK-01 must complete first (import dependency) | None — all call sites confirmed from source reading | No |
| TASK-03: Instrument client console actions | Yes — TASK-01 must complete first | None — browser-compatible pattern | No |
| TASK-04: Golden path tests | Yes — no code dep; mock patterns confirmed | Minor: publish route behavior for state transitions needs source read before asserting | No — noted in Scouts |
| TASK-05: Sync lock + rate limit tests | Yes — no code dep; route behavior confirmed | Minor: `withRateHeaders` returns NextResponse — test must call it via the route or test `applyRateLimitHeaders` directly | No — noted in Scouts |
| TASK-06: Media validation + misc tests | Yes — no code dep; route behaviors confirmed | Minor: C2 may need new test file; C4 malformed cookie edge cases noted | No — noted in Scouts |

No blocking rehearsal findings. All notes are advisory and addressed in Scout/Edge Cases sections.

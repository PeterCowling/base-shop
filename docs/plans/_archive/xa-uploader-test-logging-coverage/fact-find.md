---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-analysis
Domain: API
Workstream: Engineering
Created: 2026-03-12
Last-updated: 2026-03-12
Feature-Slug: xa-uploader-test-logging-coverage
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Analysis: docs/plans/xa-uploader-test-logging-coverage/analysis.md
Dispatch-IDs: none
Work-Package-Reason: Two P1 observability items (test coverage gaps and absent production logging) for apps/xa-uploader bundled as one code-change work package because both gaps share the same module boundary and fixing logging first enables verifiable test assertions.
Trigger-Why: The upload pipeline had no automated test protection on critical paths and no structured logging for production diagnostics.
Trigger-Intended-Outcome: type: operational | statement: all critical upload pipeline paths (save, image upload/delete, publish, sync) have unit test coverage and emit structured JSON-line log events observable via wrangler tail in production | source: auto
---

# XA Uploader Test and Logging Coverage — Fact-Find Brief

## Scope

### Summary

Two P1 items were opened for `apps/xa-uploader`: (1) no test coverage on critical upload paths, meaning regressions shipped silently, and (2) no production logging, meaning upload failures were invisible in production. Investigation reveals that both problems have been substantially resolved by a series of commits landed between 2026-03-05 and 2026-03-12. This fact-find documents the current state, identifies the remaining residual gaps, and determines what — if anything — requires further work.

### Goals
- Confirm what test coverage now exists across all critical upload pipeline paths.
- Confirm what structured logging now exists and where raw `console.*` calls remain in production paths.
- Identify any genuine remaining gaps that warrant a planning task.
- Provide a truthful coverage map for future regression protection.

### Non-goals
- Assessing UI test coverage for the catalog editor components (non-critical path for the P1 scope).
- End-to-end or integration test coverage (the existing policy is unit tests per `docs/testing-policy.md`).
- Coverage for `apps/xa-b` storefront routes (separate app).

### Constraints & Assumptions
- Constraints:
  - Tests run in CI only — no local `jest` execution. Evidence is from source inspection only.
  - `uploaderLogger.ts` uses `console.info/warn/error` as its transport — this is the correct pattern for `wrangler tail --format json` parsing. Not a defect.
- Assumptions:
  - The `wrangler tail` JSON-line approach is the agreed production observability mechanism for Cloudflare Workers.
  - Test coverage is measured at the route-handler and library level; React component hooks are out of scope for the two P1 items.

## Outcome Contract

- **Why:** The upload pipeline is the sole path for product data entering the XA storefront. Regressions silently affecting save, publish, or image upload create data loss risk. Absent logging means failures are invisible in production until a user reports them.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All critical upload pipeline routes and the `handleSaveImpl` action have automated test coverage; 7 of 8 server routes already emit structured `uploaderLog` JSON events on material failure paths (contract errors, R2 failures, sync failures, auth anomalies); the remaining gap (`products/[slug]/route.ts` GET/DELETE failure paths) and the missing `uploaderLogger.ts` unit test are addressed. Note: auth-denied and rate-limited branches across all routes intentionally return fast responses without logging — this is the established pattern and is not a gap.
- **Source:** auto

## Current Process Map

None: local code path only. The changes being assessed add tests and logging instrumentation to an existing pipeline; no multi-step operator workflow, CI lane, or deployment approval path is being altered.

## Discovery Contract Output

- **Gap Case ID:** n/a
- **Recommended First Prescription:** n/a
- **Required Inputs:** n/a
- **Expected Artifacts:** n/a
- **Expected Signals:** n/a

### Prescription Candidates

Not applicable — direct-inject path, no self-evolving discovery contract.

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — client-side action dispatcher; `handleSaveImpl` is the primary save orchestrator
- `apps/xa-uploader/src/app/api/catalog/products/route.ts` — product upsert/list route (POST/GET)
- `apps/xa-uploader/src/app/api/catalog/images/route.ts` — image upload (POST) and delete (DELETE) route
- `apps/xa-uploader/src/app/api/catalog/publish/route.ts` — single-product publish route
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — full catalog sync/publish route
- `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts` — per-product GET/DELETE route
- `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts` — bulk product upsert route
- `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` — currency rates GET/PUT
- `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts` — deploy drain route
- `apps/xa-uploader/src/lib/uploaderLogger.ts` — structured logging utility (JSON-line via console)

### Key Modules / Files

- `apps/xa-uploader/src/lib/uploaderLogger.ts` — Added in commit `e9132bd` (2026-03-05). Emits JSON-line records via `console.info/warn/error` so `wrangler tail --format json` can parse them. Skips all output in `NODE_ENV=test` to avoid polluting test output.
- `apps/xa-uploader/src/components/catalog/__tests__/catalogConsoleActions.test.ts` — Tests `handleSaveImpl` (conflict retry, image lifecycle, suppressUiBusy mutual exclusion, publish gate). 4 describe blocks, ~12 test cases.
- `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts` — Happy-path and error-path tests for POST/GET including server normalization regression guards TC-01/TC-02.
- `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.branches.test.ts` — Rate-limit, auth, payload-too-large branch coverage for products route.
- `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts` — Full coverage of POST (TC-01 through TC-10) and DELETE (TC-D01 through TC-D12) for the image upload route.
- `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` — Publish route tests including lock contention, revision conflict, publish state promotion, missing image warnings.
- `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts` and `route.cloud-publish.test.ts` — Sync route tests covering lock, no-publishable-products guard, cloud publish path.
- `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts` — Access control tests including `uploaderLog` coherence warning assertions (verifies the logger is correctly invoked).
- `apps/xa-uploader/src/lib/__tests__/uploaderAuth.test.ts` — Auth/session checking tests with `uploaderLog` mock assertions.

### Patterns & Conventions Observed

- Logging pattern: 7 of 8 server routes import `uploaderLog` from `../../../../lib/uploaderLogger` and call it at error/warn/info boundaries. The holdout is `products/[slug]/route.ts` which has no `uploaderLog` import or calls. Pattern introduced by commit `e9132bd` and extended by `2c4eb493` (2026-03-12).
- Test pattern: Jest with `jest.fn()` mocks for external dependencies; `beforeEach` resets mocks; `import("../route")` dynamic import after mocks are set up. All route tests use this identical pattern consistently.
- Rate-limit test clearing: tests that exercise rate-limit paths call `__clearRateLimitStoreForTests()` in `beforeEach` to avoid state bleed.

### Data & Contracts

- Types/schemas/events: `uploaderLog(level, event, context)` — structured JSON output per `uploaderLogger.ts:24-51`. Event strings include `upload_start`, `upload_success`, `upload_failed`, `image_delete_*`, `publish_start`, `publish_complete`, `publish_error`, `sync_lock_busy`, `catalog_publish_failed`, `bulk_validation_errors`, `currency_rates_read_failed`, `login_failed`, `session_revoked`, etc.
- Persistence: logging is fire-and-forget to `wrangler tail`; no persistence layer involved.
- API/contracts: all route handlers return `NextResponse.json({ok, error?, reason?})` — consistent shape.

### Dependency & Impact Map

- Upstream dependencies: `uploaderLogger.ts` has zero external dependencies (uses only `console.*` and `process.env`).
- Downstream dependents: 7 of 8 server route handlers import `uploaderLogger`; the exception is `products/[slug]/route.ts`. Client components (`CatalogProductImagesFields.client.tsx`) still use raw `console.warn` (browser context — see Gap section).
- Likely blast radius: any changes to the logger signature would require updating all 8+ import sites, but the current API is stable.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest via `@acme/config/jest.preset.cjs`, `testEnvironment: "node"`
- Commands: governed runner `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs --testPathPattern=<pattern> --no-coverage` (CI only)
- CI integration: tests run on CI via the governed runner; no local execution

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| `handleSaveImpl` (save action) | Unit | `catalogConsoleActions.test.ts` | Conflict retry, image lifecycle, suppressUiBusy, busy lock, publish gate — good coverage |
| `mergeAutosaveImageTuples` | Unit | `catalogConsoleActions.test.ts` | Add image, delete image scenarios |
| Products route POST/GET | Unit | `route.test.ts`, `route.branches.test.ts` | Happy path, conflict, auth, rate-limit, payload errors, publish-state normalization |
| Image upload/delete | Unit | `images/route.test.ts` | 10 POST + 12 DELETE scenarios including R2 failure, fence conflict, format validation |
| Publish route | Unit | `publish/route.publish.test.ts` | Lock contention, revision conflict, state promotion, media warning path |
| Catalog sync route | Unit | `sync/route.test.ts`, `route.cloud-publish.test.ts` | Lock busy, no publishable products, confirmEmptyInput, cloud publish path |
| Per-product slug route | Unit | `[slug]/route.test.ts`, `route.branches.test.ts` | GET, DELETE, auth, rate-limit |
| Bulk upsert route | Unit | `products/bulk/route.test.ts` | Duplicate slugs, cloud upsert path, contract unavailable |
| Currency rates route | Unit | `currency-rates/route.test.ts` | GET, PUT, error paths, B5 missing rates |
| Deploy drain route | Unit | `deploy-drain/route.test.ts` | Auth, idle state, trigger, cooldown, unconfigured |
| Access control / IP allowlist | Unit | `accessControl.test.ts` | All IP/proxy scenarios, coherence warning dedup |
| Auth / session | Unit | `uploaderAuth.test.ts` | Session check, revocation, KV unavailable |
| Middleware | Unit | `middleware.test.ts` | IP deny/allow, security headers |

#### Coverage Gaps

- **Untested paths:**
  - `CatalogProductImagesFields.client.tsx` — client-side image delete error path uses raw `console.warn` (lines 276, 284). `uploaderLog` explicitly supports browser runtimes (the module comment at `uploaderLogger.ts:13` states "Compatible with both Node.js (server routes) and browser (client components) runtimes"). These calls could technically use `uploaderLog`; however, they are UI feedback diagnostics for client-side network errors where the server-side route already logs via `uploaderLog` at the `image_delete_*` events. Replacing them is optional, not a gap in the P1 scope. There are no tests asserting the error-path behavior in this component.
  - No test for `uploaderLogger.ts` itself — the logger module has no dedicated unit test. Correctness is inferred from its consumers (e.g., `accessControl.test.ts` mocks it, `uploaderAuth.test.ts` mocks it).
  - No test exercises the `try/catch` fallback in `uploaderLogger.ts` (lines 41-49) that handles non-serializable context values.
- **Extinct tests:** None detected.

#### Testability Assessment

- Easy to test: `uploaderLogger.ts` unit tests — no external dependencies, deterministic output, `process.env.NODE_ENV` controls suppression.
- Hard to test: `CatalogProductImagesFields.client.tsx` — client component requiring React render environment and fetch mocking.
- Test seams needed: None for server paths. Client component already has React test infrastructure in place (`CatalogProductImagesFields.test.ts` exists but only tests `reorderPipeEntry`).

### Recent Git History (Targeted)

- `apps/xa-uploader/src/lib/uploaderLogger.ts` — created `e9132bd` (2026-03-05): minimal structured logger added
- `apps/xa-uploader/src/components/catalog/__tests__/catalogConsoleActions.test.ts` — added `9b98ed0` + `10f1432f` (suppressUiBusy, publish gate regression tests)
- `apps/xa-uploader/src/app/api/catalog/products/__tests__/route.test.ts` — added `fcae38a0` + recent commits
- `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts` — added `e50f5699` (Wave 1 baseline DELETE tests)
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — `2c4eb493` (2026-03-12): replaced all remaining `console.*` with `uploaderLog`
- `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts` — `2c4eb493`: added `uploaderLog` to contract/validation error paths
- `apps/xa-uploader/src/app/api/catalog/currency-rates/route.ts` — `2c4eb493`: added `uploaderLog` to read/write failure paths
- `apps/xa-uploader/src/app/api/catalog/deploy-drain/route.ts` — `2c4eb493`: added `uploaderLog` for session check and pending state read failures

## Engineering Coverage Matrix

| Coverage Area | Applicable? | Current-state evidence | Gap / risk | Carry forward to analysis |
|---|---|---|---|---|
| UI / visual | N/A | No visual changes — logging and tests only | None | No |
| UX / states | N/A | No user-facing flow changes | None | No |
| Security / privacy | Required | Log context fields are: `storefront` (ID string), `slug` (product slug), `ip` (already in headers), `event` (enum string), `status` (HTTP numeric code), `operation` (enum string), `endpoint` (URL path fragment), `error` (`String(err)` — includes the error message string for ordinary `Error` objects, which can contain arbitrary text), `message` (error code string), `route` (path template string), `durationMs` (number). None of the currently logged fields are user PII. The `String(err)` pattern is a residual risk: if a future error type includes sensitive text in its message, it would appear in the log. This risk is speculative for current callers but should be documented as a convention to review. | Low: no current PII leakage identified. Residual risk from `String(err)` convention in error context if error messages ever contain credentials or user data. | Yes — note in planning: `String(err)` is the accepted pattern; review must confirm no error type includes sensitive message text |
| Logging / observability / audit | Required | `uploaderLogger.ts` present and adopted across 7 of 8 server routes as of 2026-03-12. The holdout is `products/[slug]/route.ts` (GET and DELETE error paths not logged). Raw `console.*` eliminated from all other server production paths. Remaining `console.warn` in `CatalogProductImagesFields.client.tsx:276,284` is browser-side. No test for logger fallback path. | Gap: `products/[slug]/route.ts` errors are not logged. Logger fallback path (lines 41-49) is untested. | Yes — add `uploaderLog` to slug route; add logger unit test |
| Testing / validation | Required | All 8 catalog API routes and middleware have unit tests. `handleSaveImpl` has 12+ test cases. `mergeAutosaveImageTuples` covered. Auth, access control, rate-limit all tested. | Low: `uploaderLogger.ts` itself has no dedicated test; client image-delete error path untested | Yes — logger unit test is a quick win |
| Data / contracts | Required | `uploaderLog` signature is `(level, event, context?)` — stable. No schema changes. All existing tests continue to pass (inferred from CI green history). | None | No |
| Performance / reliability | N/A | Logging is synchronous JSON serialization to console — negligible cost on Cloudflare Workers | None | No |
| Rollout / rollback | N/A | Tests and logging are additive. No migration, no flag, no deploy ordering dependency. Rollback = revert commits. | None | No |

## External Research

Not investigated: no external service integration for logging (Cloudflare native `wrangler tail` approach verified from `uploaderLogger.ts` design comment).

## Questions

### Resolved

- Q: Is `uploaderLogger.ts` just `console.log` under a different name, or is it genuinely production-visible?
  - A: It emits JSON-line records via `console.info/warn/error`. Cloudflare Workers runtime forwards all `console.*` output to `wrangler tail`. The logger adds structured `{level, event, ts, ...context}` JSON wrapping, making events parseable with `--format json`. This is the correct approach for Cloudflare Workers observability.
  - Evidence: `apps/xa-uploader/src/lib/uploaderLogger.ts:3-7, 24-51`

- Q: Did the recent commit wave address all routes, or only some?
  - A: 7 of 8 server-side catalog and auth routes now import and call `uploaderLog`. The commit `2c4eb493` (2026-03-12) converted the last 4 holdouts (`sync`, `deploy-drain`, `products/bulk`, `currency-rates`). The one remaining gap is `products/[slug]/route.ts`, which has zero `uploaderLog` calls — its GET and DELETE error paths are not logged to structured output.
  - Evidence: grep output across all route.ts files; `apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts` shows 0 `uploaderLog` imports

- Q: Are the existing tests shallow (smoke tests) or meaningful (branch/error path coverage)?
  - A: Meaningful. The test suite covers rate-limit branches, auth denial, revision conflict, payload-too-large, R2 unavailable, R2 failure, fence write conflicts, reference check failures, cooldown state, and publish-state normalization. Multiple tests explicitly assert on `uploaderLog` mock call arguments (e.g., `accessControl.test.ts:86-92`).
  - Evidence: `apps/xa-uploader/src/app/api/catalog/images/__tests__/route.test.ts:TC-D01 through TC-D12`, `apps/xa-uploader/src/lib/__tests__/accessControl.test.ts:79-93`

- Q: Is there a dedicated test for `uploaderLogger.ts`?
  - A: No. The module is tested indirectly via consumer mocks. There are no tests for the JSON serialization logic, the fallback error path (lines 41-49), or the `NODE_ENV=test` suppression gate.
  - Evidence: `ls apps/xa-uploader/src/lib/__tests__/` — no `uploaderLogger.test.ts`

- Q: Does `products/[slug]/route.ts` have `uploaderLog` calls?
  - A: No. Grep confirms zero `uploaderLog` calls in this route. It handles GET (product fetch) and DELETE (product removal). Errors in this route (auth failure, contract error, network error) are not logged to structured output.
  - Evidence: `grep -c "uploaderLog" apps/xa-uploader/src/app/api/catalog/products/[slug]/route.ts` → `0`

- Q: Do the `console.warn` calls in `CatalogProductImagesFields.client.tsx` need replacing with `uploaderLog`?
  - A: Not required by the P1 scope. `uploaderLog` is browser-compatible (per `uploaderLogger.ts:13` design comment), but it is primarily used for server-side Worker observability via `wrangler tail`. The two `console.warn` calls are developer diagnostics for client-side image-delete network errors; the corresponding server-side route already logs via `uploaderLog` at the `image_delete_*` events. Replacing the client-side calls would add log noise without improving production diagnosability — the server log is the authoritative failure record.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx:276,284`; `apps/xa-uploader/src/lib/uploaderLogger.ts:13`

### Open (Operator Input Required)

No operator-only questions. All questions resolved from repository evidence.

## Confidence Inputs

- Implementation: 92% — the core work (logger creation, route adoption, test file creation) is confirmed present. The 8% gap is the `products/[slug]/route.ts` missing logging and the `uploaderLogger.ts` missing unit test, both straightforward additions.
  - What would raise to 95%+: CI run confirming all tests pass; confirmation the `wrangler tail` JSON parsing behavior matches expectations.
- Approach: 95% — JSON-line via console is the established Cloudflare Workers pattern. The approach is already implemented and in use.
  - What would raise to 98%: operator confirmation that `wrangler tail` monitoring is active in production.
- Impact: 88% — the major risk (silent regressions) is addressed by the test suite. The remaining gap (`[slug]/route.ts` logging) is a real but low-frequency path.
  - What would raise to 95%: add `uploaderLog` to `[slug]/route.ts` + logger unit test.
- Delivery-Readiness: 90% — all dependencies are internal; no external service, schema change, or migration required.
  - What would raise to 95%: validators passing on this document.
- Testability: 95% — `uploaderLogger.ts` is pure (no external deps); `[slug]/route.ts` follows the identical test pattern as all other routes. Test seams exist.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Logger fallback path (non-serializable context) is untested | Medium | Low — fallback silently emits minimal record; no user impact | Add unit test for the fallback branch in `uploaderLogger.ts` |
| `products/[slug]/route.ts` errors are not logged in production | Medium | Medium — DELETE failures (product removal errors) are invisible | Add `uploaderLog` calls to GET/DELETE error paths in this route |
| Log context objects could leak sensitive data in future calls | Low | High | Code review gate: ensure `context` values are always safe primitives (storefront IDs, counts, error codes — not user data) |
| Test assertions on `uploaderLog` mock may not catch event name typos | Low | Low | Adding a logger unit test with event-string assertions would catch this at the source |

## Planning Constraints & Notes

- Must-follow patterns:
  - All new tests follow the Jest dynamic-import pattern: `jest.mock(...)` for dependencies, then `const { HANDLER } = await import("../route")`.
  - Logger calls follow `uploaderLog(level, event_string, { storefront, ...context })` — context must be a plain object of safe primitives.
  - New test files go in `__tests__/` sibling directories per existing convention.
- Rollout/rollback expectations: Additive changes only. Rollback = revert. No flags, no migrations.
- Observability expectations: After completing the remaining items, all material failure paths in server routes (contract errors, storage failures, auth anomalies, sync failures) emit structured JSON-line events consumable via `wrangler tail --format json`. Intentionally silent paths: auth-denied (404) and rate-limited (429) fast-fail branches across all routes — these are not logged per the established pattern.

## Suggested Task Seeds (Non-binding)

- TASK-01: Add `uploaderLog` calls to `products/[slug]/route.ts` GET and DELETE material error paths (contract errors, network failures) — following the same pattern used in `products/route.ts` (`logContractFailure`) and `images/route.ts` (per-path error events). Auth-denied and rate-limited branches do not need logging.
- TASK-02: Create `apps/xa-uploader/src/lib/__tests__/uploaderLogger.test.ts` — test JSON serialization, `NODE_ENV=test` suppression gate, fallback path for non-serializable context, and level routing.

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package: two new/modified source files; validator passes (`pnpm typecheck && pnpm lint`); CI tests green
- Post-delivery measurement plan: `wrangler tail --format json` on the deployed worker shows structured JSON events for upload operations

## Evidence Gap Review

### Gaps Addressed

1. **Citation integrity** — every coverage claim is backed by a file:line reference or grep output. The `uploaderLog` call count per file was verified directly.
2. **Boundary coverage** — all 8 catalog routes plus middleware inspected. Auth, rate-limit, and IP allowlist boundaries confirmed covered.
3. **Testing/validation coverage** — existing tests verified by reading actual test file contents (not just listing filenames). Coverage gaps identified precisely.
4. **Business validation coverage** — not applicable; this is infrastructure instrumentation, no hypothesis to validate.
5. **Confidence calibration** — 92% implementation confidence reflects one confirmed remaining gap (`[slug]/route.ts`), not optimism.

### Confidence Adjustments

- Testing confidence raised from initial estimate (50%) to 92% after confirming the test wave is substantially complete across all critical paths.
- Logging confidence raised from initial estimate (30%) to 92% after confirming `uploaderLogger.ts` is present and adopted in 7/8 routes, with the single holdout (`[slug]/route.ts`) being a confirmed, small, non-blocking gap.

### Remaining Assumptions

- CI remains green — tests are confirmed to exist and follow correct patterns, but actual pass/fail cannot be verified locally (testing-policy.md constraint).
- `wrangler tail` JSON parsing behavior is as documented — not independently verified in this fact-find.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `handleSaveImpl` save action test coverage | Yes | None | No |
| Image upload/delete route test coverage | Yes | None | No |
| Publish route test coverage | Yes | None | No |
| Sync route test coverage | Yes | None | No |
| Bulk upsert route test coverage | Yes | None | No |
| `products/[slug]/route.ts` test coverage | Yes | None (tests exist in `route.test.ts` and `route.branches.test.ts`) | No |
| `uploaderLogger.ts` adoption across routes | Yes | [Scope gap] [Minor]: `products/[slug]/route.ts` has zero `uploaderLog` calls — errors not logged | No (minor, does not block) |
| `uploaderLogger.ts` unit test | Partial | [Missing domain] [Minor]: No `uploaderLogger.test.ts` exists; fallback path untested | No (minor) |
| Client-side `console.warn` in browser component | Yes | [Scope gap] [Minor]: `CatalogProductImagesFields.client.tsx:276,284` uses raw `console.warn` — correct for browser context, but no test covers these error paths | No (minor, correct behavior) |
| Auth and access control coverage | Yes | None | No |
| Middleware coverage | Yes | None | No |

## Scope Signal

Signal: right-sized

Rationale: The two P1 problems are substantially resolved. The remaining work is two small, bounded tasks: add `uploaderLog` to one route (`products/[slug]/route.ts`) and create a unit test for `uploaderLogger.ts`. Both tasks follow existing patterns with no external dependencies, no schema changes, and no migration risk. Expanding scope further (e.g., client-side component tests or e2e logging verification) is not warranted by current evidence — the client `console.warn` calls are intentionally browser-side and the server logging gap is one route with two error paths.

## Analysis Readiness

- Status: Ready-for-analysis
- Blocking items: none
- Critique: 3 rounds, final verdict credible, score 4.5/5.0
- Validators: validate-fact-find.sh PASS (score 4.5, 0 critical), validate-engineering-coverage.sh PASS
- Recommended next step: `/lp-do-analysis xa-uploader-test-logging-coverage`

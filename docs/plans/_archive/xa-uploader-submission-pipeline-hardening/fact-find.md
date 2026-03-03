---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: xa-uploader-submission-pipeline-hardening
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-submission-pipeline-hardening/plan.md
Trigger-Source: direct-operator-decision: dispatch IDEA-DISPATCH-20260302-0093; operator-stated process audit items F2/F3/F4/F6/F8
Dispatch-ID: IDEA-DISPATCH-20260302-0093
artifact: fact-find
---

# XA Uploader Submission Pipeline Hardening Fact-Find Brief

## Scope

### Summary

The xa-uploader backend has five confirmed gaps in its submission and sync pipeline: (F2) the submission route does not validate products against the shared Zod draft schema before building the zip, creating a path where malformed drafts can be submitted; (F3) both the submission zip build and the sync pipeline run synchronously inside the route handler with no async job queue or status polling, creating timeout risk for large batches; (F4) the sync route has no mutex to prevent two concurrent sync runs from running in parallel, creating state corruption risk; (F6) the async job and mutex KV entries that will be written as part of F3/F4 have no TTL set, meaning orphaned job or mutex entries can persist indefinitely if a route crashes mid-operation (note: the catalog draft contract is persisted via an external HTTP endpoint, not direct KV — TTL on that path is an external concern); (F8) neither the submission nor the sync route emits any structured error log on failure, making production errors invisible without log inspection.

The dispatch scope is confined to these five items. F7 (Durable Objects rate limiting) is explicitly out of scope — free-tier only constraint.

### Goals

- F2: Add Zod schema validation (`catalogProductDraftSchema.safeParse`) to the submission route before the zip build step, so malformed products are rejected with a structured error rather than silently included or causing a downstream panic.
- F3: Add a KV-based async job system to the submission route: POST enqueues a job and returns a job ID immediately; a new `GET /api/catalog/submission/status/[jobId]` endpoint returns job state and download URL when ready.
- F4: Add a KV mutex to the sync route that prevents concurrent sync runs for the same storefront. The mutex acquires before `runSyncPipeline` / `runCloudSyncPipeline`, releases on completion or error.
- F6: Add `expirationTtl` to all KV job store entries written as part of F3, and to the sync mutex key written as part of F4. This is the only direct KV write path in this app — the draft contract client uses HTTP to an external endpoint and is not a KV write target.
- F8: Add a structured `console.error` (or equivalent) call in the `catch` branch of both the submission route and the sync route, emitting at minimum: route, error code, error message, and `durationMs`.

### Non-goals

- F7: Durable Objects rate limiting — explicitly excluded by dispatch constraint.
- Changing the client-side draft form shape or the `catalogProductDraftSchema` definition.
- Adding new product fields or taxonomy changes.
- Any changes to the `xa-b` storefront app or catalog contract endpoint.

Note: adding `[[kv_namespaces]]` to `wrangler.toml` is IN scope — it is a prerequisite for F3 and F4. This is not excluded.

### Constraints & Assumptions

- Constraints:
  - Free Cloudflare tier only: KV for F3/F4/F6. No Durable Objects (F7 excluded).
  - `wrangler.toml` currently has no KV namespace bindings at all — they must be added as part of this work.
  - The app uses `export const runtime = "nodejs"` in routes — OpenNext/Cloudflare Workers compat applies.
  - Sync route timeout is configurable (`XA_UPLOADER_SYNC_TIMEOUT_MS`, default 300s) and already exceeds free-tier Worker CPU limits for the local FS path — the async job (F3) mainly applies to the cloud path.
  - Rate limit store is in-memory (`globalThis.__xaUploaderRateLimitStore`) — not KV. This is outside scope for this plan.
- Assumptions:
  - Cloudflare KV is accessible via `getCloudflareContext` from `@opennextjs/cloudflare` (same pattern as `apps/business-os`).
  - The submission route's F3 async job needs a download step: after the job completes, the zip is stored somewhere accessible (R2 or KV). Given free-tier, temporary KV storage of small zips (≤25 MB) is the only option — this is within KV value size limits only for very small payloads. R2 presigned URLs are the correct target for larger zips. This may affect F3 scope.
  - `console.error` in a Cloudflare Worker is captured in Cloudflare's log stream (F8 satisfies the telemetry requirement without a third-party logger).

## Outcome Contract

- **Why:** Operator-identified process audit findings F2/F3/F4/F6/F8 represent reliability and observability gaps that increase risk for production catalog submissions as submission volume grows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this build: (1) malformed drafts are rejected at submission time with a structured error; (2) large submission zip builds do not time out the request handler; (3) concurrent sync runs are prevented for the same storefront; (4) orphaned async job and mutex KV entries expire automatically via TTL, preventing indefinite accumulation; (5) submission and sync errors are logged with enough context to diagnose production failures.
- **Source:** auto

## Access Declarations

No external services, APIs, or credentials are needed for the fact-find investigation. All evidence is in the repository.

For the build phase: Cloudflare KV namespace binding (`XA_UPLOADER_KV`) will be required in `wrangler.toml`. This binding does not exist yet and must be created as a wrangler setup step.

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/app/api/catalog/submission/route.ts` — POST handler: reads slugs, loads catalog, builds and streams zip synchronously; no schema validation of selected products, no error logging
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — POST handler: runs validate + sync scripts synchronously via `spawn`; GET handler: readiness check; no mutex, no error logging
- `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` — `readCloudDraftSnapshot`, `writeCloudDraftSnapshot`: all draft persistence goes through `fetch()` to an external HTTP contract endpoint — this client does not write to KV; it is not an F6 target

### Key Modules / Files

- `apps/xa-uploader/src/app/api/catalog/submission/route.ts` — F2 target (add schema validation), F3 target (async job), F8 target (error logging)
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — F4 target (mutex), F8 target (error logging)
- `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` — not an F6 target; routes all draft persistence through external HTTP contract endpoint via `fetch()`; no direct KV writes
- `apps/xa-uploader/src/lib/rateLimit.ts` — in-memory rate limit store; not KV-backed; out of scope but relevant context
- `apps/xa-uploader/src/lib/localFsGuard.ts` — `isLocalFsRuntimeEnabled()`: determines which code path runs (local FS vs cloud/KV path)
- `apps/xa-uploader/wrangler.toml` — currently has no KV namespace bindings; `nodejs_compat` is set
- `packages/lib/src/xa/catalogAdminSchema.ts` — `catalogProductDraftSchema` Zod schema; source of truth for draft validation
- `apps/xa-uploader/src/components/catalog/catalogDraft.ts` — client draft shape (`EMPTY_DRAFT`, `CatalogProductDraftInput`); already typed against the same Zod input type — no type drift, but submission route does not call `.safeParse` on products before zip build
- `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts` — uses `catalogProductDraftSchema.safeParse` correctly; the pattern to replicate for F2

### Patterns & Conventions Observed

- Rate limiting: uses in-memory `globalThis.__xaUploaderRateLimitStore` (not KV) — evidence: `rateLimit.ts`
- Auth: `hasUploaderSession(request)` called in every route handler before any logic — pattern to preserve in new polling endpoint
- Dual runtime paths: `isLocalFsRuntimeEnabled()` gates local FS vs cloud path throughout — new async job system must respect this gate
- Error shape: `{ ok: false, error: string, reason: string }` — must be preserved for new error paths
- Structured error suppression: `catch` blocks in submission/sync routes return HTTP error responses but emit nothing to logs — F8 gap confirmed
- `export const runtime = "nodejs"` on both routes — OpenNext/Cloudflare Workers compat, NOT edge runtime
- `getCloudflareContext()` pattern used in `apps/business-os` for D1/KV access — this is the correct pattern for F3/F4 KV access

### Data & Contracts

- Types/schemas/events:
  - `CatalogProductDraftInput` — Zod input type from `catalogProductDraftSchema`; used by client forms and cloud draft contract client; field set is identical between client and Zod schema (confirmed: 23 fields, zero drift in field names)
  - `CatalogProductDraft` — Zod output type (parsed/transformed); differs from input in that `price`, `stock`, `deposit`, `popularity`, `compareAtPrice` are numbers in output vs strings in input
  - F2 gap: submission route filters products by slug from the catalog snapshot (`catalog.products`) without calling `catalogProductDraftSchema.safeParse` — products could be partially malformed if the draft contract stored bad data
  - F3 gap: submission route returns a streaming zip response inline — no job ID, no status polling, no download URL
  - F4 gap: sync route has no KV key like `xa-sync-lock:{storefront}` to prevent concurrent runs
  - F6 clarification: the "catalog KV" referenced in the dispatch is the external draft contract (`XA_CATALOG_CONTRACT_BASE_URL`) — the app itself writes to this via HTTP PUT, not direct KV. TTL enforcement must be on the contract endpoint side, not in this app. This is a **scope boundary finding** (see Open Questions Q1).
  - F8 gap: no `console.error` or structured logger calls in submission/sync catch blocks — confirmed by grep

- Persistence:
  - Draft contract: external HTTP endpoint at `XA_CATALOG_CONTRACT_BASE_URL` — the app reads/writes via `catalogDraftContractClient.ts` using fetch
  - KV: no current KV namespace binding in `wrangler.toml` — must be added for F3/F4
  - Rate limit: in-memory only (`globalThis.__xaUploaderRateLimitStore`)
  - Publish history: local FS JSON file at `uploaderDataDir/publish-history/{storefront}.json` — local FS path only

- API/contracts:
  - Submission route: `POST /api/catalog/submission` — currently returns streaming zip response; F3 changes this to return `{ ok: true, jobId: string }` and adds `GET /api/catalog/submission/status/[jobId]`
  - Sync route: `POST /api/catalog/sync`, `GET /api/catalog/sync` — F4 adds mutex acquire/release around the sync pipeline call
  - New KV namespace: `XA_UPLOADER_KV` — must be declared in `wrangler.toml` with `[[kv_namespaces]]` block

### Dependency & Impact Map

- Upstream dependencies:
  - `catalogProductDraftSchema` from `@acme/lib/xa/catalogAdminSchema` — F2 validation target; stable
  - `buildSubmissionZipStream` / `buildSubmissionZipFromCloudDrafts` from `submissionZip.ts` — called after F2 validation; unchanged
  - `readCloudDraftSnapshot` from `catalogDraftContractClient.ts` — upstream of submission filter; F6 scoped to contract endpoint
  - `getCloudflareContext` from `@opennextjs/cloudflare` — needed for KV access in F3/F4
  - `isLocalFsRuntimeEnabled()` — determines which sync path runs; must be checked in new KV code to avoid calling KV on local FS dev path

- Downstream dependents:
  - `CatalogSubmissionPanel.client.tsx` — calls `fetchSubmissionZip` from `catalogSubmissionClient.ts`; F3 changes the client call pattern: instead of a single blocking fetch returning a blob, it must (1) POST to enqueue job, (2) poll status endpoint, (3) fetch zip when ready. This is a significant client-side change.
  - `useCatalogConsole.client.ts` → `handleExportSubmissionImpl` → `handleUploadSubmissionToR2Impl` — both call `fetchSubmissionZip`; F3 requires updating both
  - `catalogSubmissionClient.ts` — `fetchSubmissionZip` must be refactored or replaced with async flow
  - Existing tests: `route.test.ts` and `route.branches.test.ts` for submission — all expect synchronous zip response; must be updated for F3

- Likely blast radius:
  - F2: submission route only — adding a pre-filter `safeParse` step; low blast radius; existing tests test the zip-build path, not the validation path
  - F3: HIGH blast radius — changes the submission route response shape, client `fetchSubmissionZip` function, `CatalogSubmissionPanel`, `useCatalogConsole` state machine, and adds new route. Requires client state for polling, new loading states.
  - F4: sync route only — adds a KV acquire/release around the existing pipeline; low blast radius
  - F6: app-owned KV TTL — implemented by setting `expirationTtl` on the job store KV puts (F3) and mutex KV puts (F4); low blast radius. The external draft contract endpoint's TTL behavior is a separate concern outside this scope.
  - F8: submission and sync routes — adding `console.error` in catch blocks; trivially low blast radius

### Test Landscape

#### Test Infrastructure

- Framework: Jest (via governed test runner `pnpm -w run test:governed`)
- Config: `apps/xa-uploader/jest.config.cjs`
- CI: tests run in CI only per `docs/testing-policy.md`

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Submission route | Unit | `submission/__tests__/route.test.ts`, `route.branches.test.ts` | Covers: auth, rate limit, slug cap, validation errors (zip), cloud vs local path. Does NOT cover: schema validation of products pre-zip, async job shape |
| Sync route | Unit | `sync/__tests__/route.test.ts`, `route.branches.test.ts` | Covers: auth, rate limit, script readiness, validation/sync failure, publish flow, cloud mode, dry run, currency rates. Does NOT cover: concurrent call mutex |
| Rate limit | Unit | `lib/__tests__/rateLimit.test.ts` | In-memory rate limit logic covered |
| Bulk products | Unit | `products/bulk/__tests__/route.test.ts` | Covers `catalogProductDraftSchema.safeParse` usage pattern — template for F2 |
| catalogAdminSchema | Unit | `lib/__tests__/catalogAdminSchema.test.ts` | Schema validation logic covered |

#### Coverage Gaps

- Untested paths:
  - Submission route: schema validation of products fetched from catalog (F2 gap — no test for malformed product in catalog snapshot)
  - Sync route: concurrent POST calls to same storefront (F4 gap — no mutex test)
  - New status polling endpoint (F3 — does not exist yet)
  - KV acquire/release in F3/F4 (does not exist yet)
- Extinct tests:
  - After F3: `route.test.ts` and `route.branches.test.ts` assertions that check for `Content-Type: application/zip` from POST will need to change to check for `{ ok: true, jobId: string }`. These are not extinct now but become incorrect after F3.

#### Testability Assessment

- Easy to test:
  - F2: add `catalogProductDraftSchema.safeParse` test case in submission route test; mock catalog snapshot to include a malformed product
  - F4: mock KV, call POST twice in parallel, assert second receives 409 conflict
  - F8: spy on `console.error`, assert it is called on error path
- Hard to test:
  - F3: requires mocking KV `put`/`get` in Jest environment (no Cloudflare Workers runtime in Node Jest); need to mock `getCloudflareContext` similarly to how `catalogDraftContractClient` is mocked
  - F6: testable via KV mock — assert that `put` calls for job store and mutex include an `expirationTtl` option; straightforward with the same KV mock used for F3/F4

#### Recommended Test Approach

- Unit tests for: F2 validation rejection, F4 mutex acquire/release (with KV mock), F6 KV `put` called with `expirationTtl` for job/mutex keys, F8 console.error call
- Unit tests updated: F3 submission POST response shape change (from zip stream to job ID JSON)
- New unit tests: F3 status polling endpoint (GET `/api/catalog/submission/status/[jobId]`)

### Recent Git History (Targeted)

- `apps/xa-uploader/src/app/api/catalog/submission/route.ts`, `sync/route.ts` — recent commits:
  - `16f8740487` "fix xa-uploader submission test fixtures for schema and stream" — indicates recent test alignment work, suggests the routes are actively maintained
  - `bad9804f2a` "fix xa-uploader tests for stricter draft schema and fetch flow" — schema tightening in recent cycle; F2 gap not yet addressed
  - `284e413e73` "harden xa anti-copy controls for free tier" — anti-copy hardening in prior cycle
  - `5dcf0d8fd4` "tighten xa free-tier contracts and defaults" — free-tier focus established recently
  - `9df07b6a0c` "feat(xa): enforce free-tier hard limits and diagnostics" — diagnostics improved but error telemetry not added

## Questions

### Resolved

- Q: Does `xa-schema.ts` or `kv-catalog.ts` exist as named in the dispatch location anchors?
  - A: No. These are approximate names. The actual files are `packages/lib/src/xa/catalogAdminSchema.ts` (Zod schema) and `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` (draft contract client). No file named `xa-schema.ts` or `kv-catalog.ts` exists.
  - Evidence: `Glob` search of `apps/xa-uploader/src/**/*.ts` — 54 files found, none with those names.

- Q: Is there actually a KV binding in `wrangler.toml` that the app uses currently?
  - A: No. `wrangler.toml` has no `[[kv_namespaces]]` block. The app does not currently use Cloudflare KV directly at all. The "catalog KV" referenced in the dispatch refers to the external draft contract endpoint (HTTP-based, not direct KV).
  - Evidence: `apps/xa-uploader/wrangler.toml` — only `[assets]` binding present; no KV namespace declarations.

- Q: Is F6 ("catalog KV key lacks TTL") achievable within this app, or does it require changes to the external catalog contract endpoint?
  - A: The app itself does not write to KV directly — all draft persistence goes through the external HTTP contract at `XA_CATALOG_CONTRACT_BASE_URL`. TTL enforcement would need to happen in the contract endpoint, not in `catalogDraftContractClient.ts`. However, F6 can be implemented within this app if KV is adopted as the draft persistence layer directly (replacing the HTTP contract for drafts), or if a new KV namespace is introduced for the async job store (F3) and job entries get TTL set. For the dispatch intent, F6 can be satisfied by setting `expirationTtl` on the KV job store entries written for F3, which is directly within scope.
  - Evidence: `apps/xa-uploader/src/lib/catalogDraftContractClient.ts` — `readCloudDraftSnapshot`/`writeCloudDraftSnapshot` use `fetch()` to external URL, not KV API.

- Q: Does F3 (async submission) require zip storage in KV or R2?
  - A: The zip must be stored somewhere between job creation and client download. KV values are limited to 25 MB — which exactly matches the current `FREE_TIER_SUBMISSION_MAX_BYTES = 25 * 1024 * 1024`. Using KV for zip storage is technically feasible but borderline. R2 is the natural choice. However, the dispatch says "free-tier only" — R2 has a free tier (10 GB/month free). The practical recommendation: store the zip in R2 if an R2 bucket binding can be confirmed and configured in `wrangler.toml`. The presence of `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` in `wrangler.toml` confirms a client-side upload URL is used, but does NOT confirm a server-side Worker R2 bucket binding exists — that binding is separate and must be verified/added. If R2 binding is unavailable, the plan should fall back to KV storage for zips within the 25 MB ceiling.
  - Evidence: `submission/route.ts` lines 23-24: `FREE_TIER_SUBMISSION_MAX_BYTES = 25 * 1024 * 1024`; `wrangler.toml` `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL` confirms client upload path only, not server R2 binding.

- Q: Does the client-side draft form shape diverge from `catalogProductDraftSchema` type shape (F2)?
  - A: No type divergence in field names. `catalogDraft.ts` imports `CatalogProductDraftInput` directly from `@acme/lib/xa/catalogAdminSchema` and uses it as the state type. The F2 gap is that the submission route does not call `catalogProductDraftSchema.safeParse` on the products it selects from the catalog snapshot before building the zip — so malformed snapshots can pass through. The schema is shared; the validation call is missing.
  - Evidence: `catalogDraft.ts` line 1: `import { type CatalogProductDraftInput, slugify } from "@acme/lib/xa/catalogAdminSchema"`. `submission/route.ts`: no import of `catalogProductDraftSchema`, no `.safeParse` or `.parse` call.

- Q: Does `useCatalogConsole` have a client-side busy lock that would partially mitigate F3/F4?
  - A: Yes — `busyLockRef` in `useCatalogConsole.client.ts` prevents double-click of the same action from the same browser session. This does not prevent concurrent calls from two different browser tabs or two different operator sessions. F3 and F4 mitigations are still necessary.
  - Evidence: `useCatalogConsole.client.ts` line 110: `const busyLockRef = React.useRef(false)`.

### Open (Operator Input Required)

- Q: Should F3 use R2 for zip storage (presigned URL in job status response) or KV (binary blob, size-limited to 25 MB)?
  - Why operator input is required: this is an architectural choice with cost/complexity tradeoffs. R2 requires adding an R2 bucket binding to `wrangler.toml` (may already exist — env var suggests it does). KV requires no new binding but is size-capped exactly at the submission limit.
  - Decision impacted: F3 implementation path, `wrangler.toml` bindings, client polling logic for download URL vs direct download
  - Decision owner: operator
  - Default assumption: use R2 for zip storage if the bucket binding can be confirmed. If operator does not specify, plan should default to R2 with a note to verify the binding name.

## Confidence Inputs

- Implementation: 85%
  - Evidence: All five target files are read, their current behavior is confirmed, and the implementation pattern for each fix is clear from existing code in the same repo (bulk route uses `safeParse`; `apps/business-os` uses `getCloudflareContext` for KV). The only uncertainty is F3's zip storage mechanism (KV vs R2) and the KV access pattern in the `nodejs` runtime + OpenNext context.
  - To reach 90%: confirm R2 bucket binding name for F3 zip storage, and verify `getCloudflareContext` works correctly in this app's OpenNext build.

- Approach: 80%
  - Evidence: KV mutex pattern for F4, Zod validation for F2, `console.error` for F8, KV TTL for F6 on job store — all are standard patterns with no ambiguity. F3 (async job) is the most complex item and has the highest blast radius on the client.
  - To reach 90%: resolve the F3 zip storage question; confirm whether F3 requires synchronous fallback path for the local FS runtime (where KV is not available).

- Impact: 90%
  - Evidence: F2 prevents silent submission of malformed products. F4 prevents state corruption on concurrent sync. F8 immediately improves production debuggability. F6 prevents unbounded stale KV growth. F3 eliminates timeout risk for large batches. All are correctness/reliability improvements, not feature additions.
  - To reach higher: would require measuring actual timeout frequency in production — not needed to justify the work.

- Delivery-Readiness: 78%
  - Evidence: All entry points are identified, patterns are clear, test approach is defined. The `wrangler.toml` KV namespace setup is a prerequisite that requires operator action (running `wrangler kv namespace create`). F3's client-side changes are more substantial than initially apparent.
  - To reach 80%: operator confirms zip storage backend for F3. To reach 90%: full wrangler KV namespace ID is obtained and added to `wrangler.toml`.

- Testability: 80%
  - Evidence: F2/F4/F8 are straightforward to test with Jest mocks. F3 needs `getCloudflareContext` mocked. F6 (as applied to job store TTL) is testable by asserting `put` is called with `expirationTtl`. Existing test infrastructure in `submission/` and `sync/` provides good scaffolding.
  - To reach 90%: establish the `getCloudflareContext` mock pattern in Jest (check if `apps/business-os` has a precedent).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| F3 client-side polling complexity underestimated | Medium | High | Plan must include client-side state machine changes in `useCatalogConsole`; estimate separately from server-side job changes |
| KV namespace binding not available in OpenNext nodejs runtime | Low | High | Verify `getCloudflareContext` works in nodejs runtime; `apps/business-os` uses it successfully |
| R2 bucket binding not configured for zip storage | Medium | Medium | Fall back to KV storage for small zips; operator can confirm R2 bucket name |
| F3 breaks existing submission tests wholesale | High | Low | Expected and manageable — submission test assertions must be updated to new job-response shape |
| Sync mutex deadlock if route crashes mid-hold | Low | Medium | Set a short TTL on the mutex KV key (e.g. 5 minutes) so it self-expires if the route crashes before releasing |
| F6 scoped incorrectly to app-side KV (not contract endpoint) | Medium | Low | Resolved: F6 is implemented as TTL on the F3 job store entries; contract endpoint TTL is out of scope |
| F8 console.error does not surface in Cloudflare log stream | Low | Low | Cloudflare Workers capture console.error in real-time logs and wrangler tail — standard pattern |

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| F2: Submission route schema validation (entry point + Zod schema) | Yes | None | No |
| F3: Async job system — route handler response shape change | Yes | [Missing domain coverage] [Moderate]: Client-side `fetchSubmissionZip` and `CatalogSubmissionPanel` are downstream dependents that must change; both are identified but client changes are not yet scoped into task seeds | No (advisory) |
| F3: KV job store — wrangler.toml binding prerequisite | Yes | [Undefined config key] [Major]: KV namespace binding `XA_UPLOADER_KV` does not exist in `wrangler.toml`; plan must include wrangler setup step before code changes | No (advisory — plan must include as prerequisite task) |
| F4: Sync mutex — KV acquire/release pattern | Yes | None — same KV binding prerequisite as F3; tagged as advisory above | No |
| F6: Catalog KV TTL | Partial | [Scope gap] [Moderate]: Dispatch described TTL on "catalog KV key" but the app has no direct KV writes for catalog drafts; TTL will be applied to F3 job store entries only; contract endpoint TTL is out of scope | No (advisory — scoped in Resolved questions) |
| F8: Error telemetry — submission and sync catch blocks | Yes | None | No |
| Auth boundary — new status polling endpoint must require auth | Yes | [Integration boundary not handled] [Moderate]: New `GET /api/catalog/submission/status/[jobId]` endpoint must call `hasUploaderSession`; this is a known requirement but must be specified explicitly in plan task | No (advisory) |
| Test landscape — existing submission tests will break on F3 | Yes | [Ordering inversion] [Minor]: Test updates for F3 must be scoped into the same task as the route change to avoid a red CI state | No (advisory) |

## Evidence Gap Review

### Gaps Addressed

1. Citation integrity: All five F-item gaps are confirmed by reading the actual route files. No inferred claims without file evidence.
2. Boundary coverage: KV binding gap confirmed from `wrangler.toml` inspection. Auth boundary for new endpoint noted in simulation trace. External draft contract boundary clarified (HTTP, not direct KV).
3. Test landscape: Existing tests verified by reading test files. Coverage gaps identified per F-item. Extinct-test risk for F3 called out explicitly.
4. Business validation: This is a pure reliability/observability improvement with no hypothesis to test — no signal coverage section required.
5. Confidence calibration: Delivery-Readiness capped at 78% due to unresolved R2/KV storage choice for F3. Implementation at 85% due to OpenNext/KV runtime uncertainty.

### Confidence Adjustments

- Delivery-Readiness reduced from initial 85% estimate to 78% because F3 client-side changes (polling state machine, updated `handleExportSubmissionImpl`, updated `fetchSubmissionZip`) are substantially more than a backend-only change.
- F6 confidence adjusted: originally assumed direct KV TTL change in app; clarified to be job store TTL only — this actually simplifies F6 implementation (TTL is set on the job KV put call, not a separate change).

### Remaining Assumptions

- R2 bucket binding can be confirmed and is accessible via `getCloudflareContext` in the OpenNext nodejs runtime for F3 zip storage.
- `getCloudflareContext` from `@opennextjs/cloudflare` works correctly in the `nodejs` runtime used by these routes (both have `export const runtime = "nodejs"`).
- Cloudflare Workers free tier KV limits (100K reads/day, 1K writes/day) are sufficient for the expected sync/submission volume.

## Planning Constraints & Notes

- Must-follow patterns:
  - Every new route handler must call `hasUploaderSession(request)` before any logic.
  - All error responses must use `{ ok: false, error: string, reason: string }` shape.
  - `isLocalFsRuntimeEnabled()` must gate any KV access so local development (non-Worker) does not crash on missing Cloudflare context.
  - Zod validation pattern from `apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts` is the correct template for F2.
  - KV namespace binding must be declared via a `[[kv_namespaces]]` block in `wrangler.toml` (top-level for production, and under `[env.preview]` as `[[env.preview.kv_namespaces]]` for preview). Do NOT put KV namespaces in `[vars]` — that section is for plain env vars only.
  - Rate limit headers must be applied to all responses from existing routes (existing pattern with `withRateHeaders`).
- Rollout/rollback expectations:
  - F2, F4, F8 are additive changes with no response shape change — zero rollback risk.
  - F3 changes the submission POST response shape — requires client and server deployed together (not a concern given single-app deployment).
  - F6 (job store TTL) is a no-op safety measure — zero rollback risk.
- Observability expectations:
  - F8: `console.error` in catch blocks; visible in `wrangler tail` and Cloudflare dashboard logs.
  - F3: job status KV key presence/absence is observable via `wrangler kv key list`.

## Suggested Task Seeds (Non-binding)

1. TASK-01 (Prerequisite): Add `XA_UPLOADER_KV` KV namespace to `wrangler.toml` (both production and preview envs). Create namespace via `wrangler kv namespace create XA_UPLOADER_KV`.
2. TASK-02 (F2): Add `catalogProductDraftSchema.safeParse` validation to submission route before zip build. Return `{ ok: false, error: "invalid", reason: "draft_schema_invalid", diagnostics: [...] }` for failures. Update submission route tests.
3. TASK-03 (F8, submission): Add `console.error` call in submission route catch blocks with `{ route, error: error.message, durationMs }`.
4. TASK-04 (F8, sync): Add `console.error` call in sync route catch blocks for publish failures and unknown errors.
5. TASK-05 (F4): Add KV mutex to sync route: acquire `xa-sync-lock:{storefront}` before pipeline, release in finally block, set 5-minute `expirationTtl` on lock key. Return 409 if lock is held.
6. TASK-06 (F3): Refactor submission route to async job pattern: POST enqueues job in KV (`xa-submission-job:{jobId}`) and returns `{ ok: true, jobId }`. Add `GET /api/catalog/submission/status/[jobId]`. Store completed zip in R2 (or KV for small payloads), include download URL in status response.
7. TASK-07 (F3 client): Update `fetchSubmissionZip` → `enqueueSubmissionJob` + `pollSubmissionJobStatus` in `catalogSubmissionClient.ts`. Update `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` in `catalogConsoleActions`. Update `CatalogSubmissionPanel` loading state.
8. TASK-08 (F6): Set `expirationTtl: 3600` (1 hour) on all KV puts in the job store (F3) and mutex (F4).
9. TASK-09: Update all affected tests: submission route tests for new response shape (F3), new test cases for schema validation rejection (F2), mutex test (F4), telemetry logging test (F8).

## Execution Routing Packet

- Primary execution skill: `lp-do-build`
- Supporting skills: none
- Deliverable acceptance package:
  - Submission route validates products against `catalogProductDraftSchema` before zip build
  - Submission route POST returns `{ ok: true, jobId }` and new status polling endpoint exists
  - Sync route rejects concurrent runs with 409 for same storefront
  - KV namespace binding declared in `wrangler.toml`
  - `console.error` called in catch blocks of both routes
  - All existing tests pass (updated for new response shapes)
  - New test cases cover: schema validation rejection, mutex conflict, job status polling, error logging
- Post-delivery measurement plan:
  - Verify via `wrangler tail` that submission errors produce structured log entries
  - Verify mutex by triggering two concurrent sync POSTs and confirming second receives 409
  - Verify schema rejection by submitting a product with missing required field

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: none (open question on R2 vs KV for F3 zip storage is advisory — plan defaults to R2 with fallback note)
- Recommended next step: `/lp-do-plan xa-uploader-submission-pipeline-hardening --auto`

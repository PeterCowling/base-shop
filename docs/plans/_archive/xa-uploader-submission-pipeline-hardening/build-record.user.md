---
Status: Complete
Feature-Slug: xa-uploader-submission-pipeline-hardening
Completed-date: 2026-03-02
artifact: build-record
---

# Build Record — XA Uploader Submission Pipeline Hardening

## What Was Built

**Wave 1a — TASK-01/02/03 (independent, S effort each):**
`wrangler.toml` was updated to include a `[[kv_namespaces]]` block binding `XA_UPLOADER_KV` in both production and preview environments, with placeholder namespace IDs and setup instructions. The submission route (`submission/route.ts`) gained `catalogProductDraftSchema.safeParse` validation before the zip build — malformed products return HTTP 400 with `draft_schema_invalid` and per-product diagnostic output. Both the submission and sync routes gained `console.error` in their unexpected-failure catch blocks with route name, error message (no stack trace), and `durationMs`.

**Wave 1b — TASK-04 (depends on TASK-01, S effort):**
A new `syncMutex.ts` helper was created exposing `getUploaderKv()`, `acquireSyncMutex()`, and `releaseSyncMutex()`. The sync route POST handler was updated to acquire the mutex (KV key `xa-sync-lock:{storefrontId}`, TTL 300s) after auth and before the pipeline, returning HTTP 409 `sync_already_running` when the lock is already present. KV unavailability is handled gracefully: a `console.warn` is emitted and sync proceeds. This is a best-effort probabilistic guard — not a hard serialization guarantee.

**CHECKPOINT-05 (gate task):**
Post-wave-1 verification confirmed: KV access pattern proven, `ctx.waitUntil` available via `cloudflare-context.d.ts`, no R2 bucket binding (Option B confirmed), no type coercion needed between CatalogProductDraftInput and zip builder. Confidence for TASK-06 and TASK-07 elevated from 65% to 85%.

**Wave 3 — TASK-06 (L effort, server async job system):**
`submissionJobStore.ts` was created with `enqueueJob`, `updateJob`, `getJob` helpers and `SubmissionKvNamespace` interface (binary put overload for zip storage). The submission POST route was refactored: cloud path now enqueues a job (`xa-submission-job:{jobId}`, TTL 3600s) and returns HTTP 202 `{ ok: true, jobId }` immediately; the zip build runs asynchronously via `ctx.waitUntil(executeSubmissionJob(...))`. A `streamToBuffer` helper buffers the Node.js Readable zip stream to a Buffer before KV put. The local FS path is unchanged (still returns a synchronous zip stream). Two new endpoints were created: `GET /api/catalog/submission/status/[jobId]` (returns job state, `downloadUrl` when complete) and `GET /api/catalog/submission/download/[jobId]` (returns zip binary from KV). All KV entries use `expirationTtl: 3600` (F6). If KV is unavailable, the POST handler falls back to the synchronous zip response.

**Wave 4 — TASK-07 (M effort, client polling):**
`catalogSubmissionClient.ts` was extended with `enqueueSubmissionJob`, `pollSubmissionJobStatus`, and `pollJobUntilComplete` (2s interval, 120s timeout, throws on failure/timeout). `fetchSubmissionZip` was retained as a compatibility shim calling the new async flow. Both `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` in `catalogConsoleActions.ts` were updated to use the enqueue → `setSubmissionStep("polling")` → poll → `fetch(downloadUrl).blob()` → download/upload pattern. `SubmissionStep` in `catalogConsoleFeedback.ts` was extended with `"polling"`.

**Wave 5 — TASK-08 (M effort, tests):**
Existing test files were updated and new tests were added: the cloud-path assertion in `route.test.ts` was updated to expect HTTP 202 `{ ok: true, jobId }` (with `getCloudflareContext` and `getUploaderKv` mocks); TC-02b (schema validation rejection), TC-06a/b (job enqueue + TTL), and an F8 `console.error` spy test were added. `route.branches.test.ts` received mock additions for the new module imports (local FS path tests unchanged). The sync route test file received TC-04a/c/d/e mutex tests. A new `status/__tests__/route.test.ts` was created with TC-06c/d/e/f.

## Tests Run

Tests run in CI only per `docs/testing-policy.md`. The following test files are in scope for CI validation:

- `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts`
- `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.branches.test.ts`
- `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`
- `apps/xa-uploader/src/app/api/catalog/submission/status/__tests__/route.test.ts` (new)

Pre-commit validation: `pnpm --filter xa-uploader lint` passed; `typecheck-staged.sh` passed on commit `c1cda3fe7a`.

## Validation Evidence

| Contract | Status | Evidence |
|---|---|---|
| TC-01b: `binding = "XA_UPLOADER_KV"` present in wrangler.toml | Pass | Grep confirmed; TOML block present |
| TC-01c: `[[env.preview.kv_namespaces]]` block present | Pass | Grep confirmed |
| TC-02b/c: HTTP 400 with `draft_schema_invalid` for malformed products | Pass | Code confirmed in route.ts; test added in TC-08b |
| TC-03a: `console.error` called on unexpected error in submission/sync routes | Pass | Code confirmed; test added in TC-08e |
| TC-03b: `console.error` NOT called for known validation errors | Pass | Code logic confirmed; test added |
| TC-04a: HTTP 409 `sync_already_running` when lock held | Pass | Code confirmed; test added |
| TC-04c: `kv.put` called with `expirationTtl: 300` and correct key | Pass | Code confirmed; test added |
| TC-04d: `kv.delete` called in finally block on success | Pass | Code confirmed; test added |
| TC-04e: Mutex skipped when KV unavailable | Pass | Code confirmed; test added |
| TC-06a: POST returns HTTP 202 `{ ok: true, jobId }` | Pass | Code confirmed; test added |
| TC-06b: `kv.put` with `xa-submission-job:{jobId}` and TTL 3600 | Pass | Code confirmed; test added |
| TC-06c/d/e/f: Status route responses (pending, complete, 404, unauth) | Pass | New test file |
| TC-06g: Local FS path still returns synchronous zip | Pass | Code branch preserved; test in route.branches.test.ts |
| TypeScript: zero errors on all modified/created files | Pass | mcp__ide__getDiagnostics — zero diagnostics on all 9 files |
| Lint: no ESLint errors | Pass | `pnpm --filter xa-uploader lint` passed |

## Scope Deviations

None. All work stayed within the task scope as defined in the plan. One minor addition: `fetchSubmissionZip` was retained in `catalogSubmissionClient.ts` as a compatibility shim (calling the new async flow internally) rather than being removed, to avoid any risk of missed consumers in the broader codebase. This is a subset of the planned scope, not an expansion.

## Outcome Contract

- **Why:** Operator-identified process audit findings F2/F3/F4/F6/F8 represent reliability and observability gaps that increase risk for production catalog submissions as submission volume grows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this build: (1) malformed drafts are rejected at submission time with a structured error; (2) large submission zip builds do not time out the request handler; (3) concurrent sync runs for the same storefront are probabilistically deterred via a best-effort KV mutex; (4) orphaned async job and mutex KV entries expire automatically via TTL; (5) submission and sync errors are logged with enough context to diagnose production failures.
- **Source:** auto

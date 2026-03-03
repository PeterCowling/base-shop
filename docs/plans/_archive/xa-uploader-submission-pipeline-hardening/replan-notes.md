---
Replan-round: 2
Last-replan: 2026-03-02
---

# Replan Notes — xa-uploader-submission-pipeline-hardening

## Round 1 (2026-03-02): TASK-04 confidence elevation

### Target task: TASK-04 (F4+F6 KV mutex, was 75%)

### Key unknowns at plan time

1. Does `getCloudflareContext()` expose KV bindings correctly in the nodejs runtime used by the sync route (`export const runtime = "nodejs"`) via OpenNext?
2. What form (sync vs async) of `getCloudflareContext` is required for nodejs routes?
3. Is `ctx.waitUntil` accessible (relevant for TASK-06)?
4. How to mock KV in tests without Cloudflare context in Jest?

### Evidence gathered

**E2 — Source code: `apps/xa-uploader/node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.js`**

Key findings from reading the implementation:

1. In production (deployed Worker): the worker entrypoint sets `globalThis[Symbol.for("__cloudflare-context__")]` before any route handler runs. The sync form `getCloudflareContext()` reads from this global symbol. Works for ALL runtimes (nodejs and edge) in production.

2. In local dev (nodejs runtime): `process.env.NEXT_RUNTIME === "nodejs"` triggers the async path in `getCloudflareContextAsync()` which calls wrangler's `getPlatformProxy`. The sync form would throw during local dev for nodejs runtime.

3. Resolution for TASK-04: `isLocalFsRuntimeEnabled()` guard skips the mutex entirely in local dev — `getCloudflareContext` is never called locally. The sync form is safe in production.

4. Async form `getCloudflareContext({ async: true })` is more robust: works in both local dev and production for nodejs runtime routes. Implementation should prefer `await getCloudflareContext({ async: true })`.

5. `ctx.waitUntil`: `CloudflareContext.ctx` is typed as `ExecutionContext` (Cloudflare Workers type). `waitUntil` is available. Relevant for TASK-06.

**E2 — Source code: `apps/business-os/src/lib/d1.server.ts`**

D1 access pattern: `const { env } = getCloudflareContext(); env.BUSINESS_OS_DB`. KV follows the exact same pattern: `(await getCloudflareContext({ async: true })).env.XA_UPLOADER_KV`.

**E1 — Test infrastructure: `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`**

Test pattern: module-level `jest.mock` for all dependencies. For TASK-04, `syncMutex.ts` is mocked at the module boundary — no `@opennextjs/cloudflare` import needed in tests. KV is passed as a mock object to `acquireSyncMutex`/`releaseSyncMutex`.

**E1 — Package: `apps/xa-uploader/package.json`**

`@opennextjs/cloudflare: ^1.16.5` is a devDependency (build-only). Import at runtime in a route is valid — OpenNext makes the package available in the compiled Worker.

**E1 — xa-uploader next.config.mjs**

`initOpenNextCloudflareForDev()` is NOT called — local dev would not have getCloudflareContext context. Confirmed: `isLocalFsRuntimeEnabled()` guard fully covers local dev path (mutex skipped).

### Confidence delta

| Dimension | Before | After | Evidence class | Reason |
|---|---|---|---|---|
| Implementation | 75% | 85% | E2 | cloudflare-context.js source confirms production Worker always sets global context; isLocalFsRuntimeEnabled() guard covers dev |
| Approach | 75% | 85% | E2 | Async form `getCloudflareContext({ async: true })` confirmed as correct pattern for nodejs runtime; KV=same env namespace as D1 |
| Impact | 85% | 85% | unchanged | No new evidence changes impact dimension |
| Composite | 75% | **85%** | — | min(85, 85, 85) = 85% — above 80% threshold |

### Implementation note added to TASK-04

Use `await getCloudflareContext({ async: true })` (not the sync form) in the production path of syncMutex.ts. The sync form could fail if the global context symbol is momentarily unavailable during Worker init edge cases. Async form is robust for nodejs runtime routes.

### Promotion decision

TASK-04 promoted from 75% to 85% (above IMPLEMENT threshold of 80%). Ready for `/lp-do-build`.

No topology change (no tasks added/removed). `/lp-do-sequence` not required.

---

## Round 2 (2026-03-02): CHECKPOINT-05 — TASK-06 and TASK-07 confidence elevation

### Invocation mode: checkpoint (from CHECKPOINT-05 in active build pipeline)

### Target tasks: TASK-06 (F3+F6 async job system, was 65%), TASK-07 (F3 client polling, was 65%)

### Horizon assumptions validated

**H1 — KV access in nodejs runtime (TASK-06 primary blocker)**

Evidence: E2 (TASK-04 implementation, committed 17796bc657). `syncMutex.ts` proves `getCloudflareContext({ async: true }).env.XA_UPLOADER_KV` works in this app's nodejs runtime. `getUploaderKv()` helper extracted and reusable by TASK-06. Zero confidence uncertainty on KV access.

**H2 — `ctx.waitUntil` availability (determines async execution mechanism)**

Evidence: E2 — `apps/xa-uploader/node_modules/@opennextjs/cloudflare/dist/api/cloudflare-context.d.ts`.

- `CloudflareContext<CfProperties, Context = ExecutionContext>` — `ctx: Context` defaults to `ExecutionContext`.
- `getCloudflareContextFromWrangler` returns `{ env, cf, ctx }` from `getPlatformProxy` — `ctx` is an `ExecutionContext` object.
- `ExecutionContext.waitUntil(promise: Promise<void>): void` is the standard Cloudflare Workers deferred execution API.
- **Resolution:** `ctx.waitUntil` IS available. Primary async pattern confirmed. No fallback (synchronous-on-first-poll) needed. TASK-06 uses `const { ctx } = await getCloudflareContext({ async: true }); ctx.waitUntil(executeSubmissionJob(...))`.

**H3 — R2 vs KV storage choice for F3 zip binary (Option A vs B)**

Evidence: E2 — `apps/xa-uploader/wrangler.toml` read in full. No `[[r2_buckets]]` block present. Only `NEXT_PUBLIC_XA_UPLOADER_R2_DESTINATION = ""` and `NEXT_PUBLIC_XA_UPLOADER_R2_UPLOAD_URL = ""` env vars — these are for the client-side presigned upload flow, not a server-side bound R2 bucket.

- **Resolution: Option B (KV blob storage) confirmed.** Zip binary stored in KV as `xa-submission-zip:{jobId}` alongside the job state entry `xa-submission-job:{jobId}`. Both entries use `expirationTtl: 3600` (F6). Option A (R2 presigned URL) is deferred — no binding available and not needed at current submission volume (≤25 MB per submission).

KV 25 MB value limit: confirmed consistent with existing `NEXT_PUBLIC_XA_UPLOADER_SUBMISSION_MAX_MB = "25"` config. No new constraint.

**H4 — TASK-02 type coercion impact on TASK-06**

Evidence: E1 — `apps/xa-uploader/src/app/api/catalog/submission/route.ts` confirmed from TASK-02 build. `buildSubmissionZipFromCloudDrafts` accepts `CatalogProductDraftInput[]`. `validateSelectedProducts` validates but passes original `selected` values to the zip builder. TASK-06 uses the same pattern: validate first, pass `selected` to zip builder unchanged.

**H5 — Test infrastructure surprise affecting TASK-08 scope**

Evidence: E1 — TC-04a–e in `sync/__tests__/route.test.ts` committed successfully. `jest.mock("../../../../../lib/syncMutex", ...)` pattern works. `max-lines-per-function` constraint requires separate top-level describe blocks for large test suites. For TASK-06/TASK-08: `submissionJobStore.ts` will be mocked at the module boundary (same pattern as `syncMutex`). No scope change to TASK-08 from this finding — already anticipated.

### Confidence deltas — TASK-06

| Dimension | Before | After | Evidence class | Reason |
|---|---|---|---|---|
| Implementation | 70% | 85% | E2 (H1, H2) + E1 (H3, H4) | KV access proven; ctx.waitUntil confirmed; Option B approach fully specified; stream buffering pattern identified |
| Approach | 65% | 85% | E2 (H2, H3) | waitUntil pattern confirmed; Option B confirmed as sole approach; approach fork resolved |
| Impact | 90% | 90% | unchanged | No new evidence changes impact dimension |
| Composite | 65% | **85%** | — | min(85, 85, 90) = 85% — above 80% IMPLEMENT threshold |

### Confidence deltas — TASK-07

| Dimension | Before | After | Evidence class | Reason |
|---|---|---|---|---|
| Implementation | 70% | 85% | E1 (H4) + E1 (catalogConsoleActions.ts read in full) | Server API shape confirmed; both consumer call sites confirmed; SubmissionStep extension identified (minor) |
| Approach | 65% | 85% | E1 (server contract resolved) | Single approach confirmed: enqueue → poll → fetch blob → download/upload; no approach fork |
| Impact | 85% | 85% | unchanged | No new evidence changes impact dimension |
| Composite | 65% | **85%** | — | min(85, 85, 85) = 85% — above 80% IMPLEMENT threshold |

### Implementation notes added to TASK-06

1. **`waitUntil` pattern:** `const { ctx } = await getCloudflareContext({ async: true }); ctx.waitUntil(executeSubmissionJob(jobId, kv, selected, options))`. The POST handler returns 202 immediately; zip build runs in background.
2. **Zip storage:** KV entries — `xa-submission-job:{jobId}` (state) and `xa-submission-zip:{jobId}` (binary blob, ≤25 MB). Both with `expirationTtl: 3600`.
3. **Download URL:** `GET /api/catalog/submission/download/[jobId]` endpoint — reads `xa-submission-zip:{jobId}` from KV, returns as `application/zip` stream. The status endpoint returns `downloadUrl: "/api/catalog/submission/download/{jobId}"` when status is `complete`.
4. **Stream buffering:** `stream.read()` / `Buffer.concat` pattern to collect the Node.js Readable zip stream into a Buffer before `kv.put`.

### Implementation notes added to TASK-07

1. **`SubmissionStep` extension:** Add `"polling"` to the `SubmissionStep` type in `catalogConsoleFeedback.ts` (or wherever the type is defined). Set `setSubmissionStep("polling")` during the poll loop.
2. **Download URL fetch:** After poll completes with `status: "complete"`, `fetch(downloadUrl)` → `.blob()` → use blob for `downloadBlob()` or PUT upload. `downloadUrl` is a path to the new download endpoint; `submissionId` is extracted from the blob response header (or returned in the status response).
3. **`catalogSubmissionClient.ts` new exports:** `enqueueSubmissionJob(slugs, storefront)` → `{ jobId }`, `pollSubmissionJobStatus(jobId, options)` → `{ status, downloadUrl?, submissionId? }`, `pollJobUntilComplete(jobId, options)` → awaits completion.

### Promotion decisions

TASK-06 promoted from 65% to 85% (above 80% IMPLEMENT threshold). Ready for `/lp-do-build`.
TASK-07 promoted from 65% to 85% (above 80% IMPLEMENT threshold). Ready for `/lp-do-build` (after TASK-06 completes).

No topology change (no tasks added/removed). `/lp-do-sequence` not required.

---
Replan-round: 1
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

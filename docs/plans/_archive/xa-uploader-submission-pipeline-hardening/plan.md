---
Type: Plan
Status: Archived
Domain: API
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02T12:00Z
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-submission-pipeline-hardening
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Submission Pipeline Hardening Plan

## Summary

The xa-uploader backend has five confirmed reliability and observability gaps: (F2) the submission route does not validate products against the Zod draft schema before building the zip; (F3) the submission build runs synchronously inside the route handler with no async job queue (the sync pipeline is left synchronous per dispatch — F3 applies to submission only); (F4) the sync route has no mutex to prevent concurrent sync runs; (F6) KV entries written by F3/F4 lack TTL; (F8) neither route emits structured error logs on failure. This plan addresses all five items with targeted, incremental code changes. F2/F4/F8 are small additive changes with no response shape change; F3 has two parts — server-side async job system (TASK-06, L) and client-side polling flow update (TASK-07, M). A CHECKPOINT after the first wave (TASK-01/02/03/04) gates the higher-complexity F3 work on confirmed KV access patterns and storage choice. The plan preserves all existing behaviour contracts except the submission POST response shape, which changes from a streaming zip to a `{ ok: true, jobId }` envelope.

## Active tasks

- [x] TASK-01: Add KV namespace binding to wrangler.toml (prerequisite) — Complete (2026-03-02)
- [x] TASK-02: F2 — Add Zod schema validation to submission route — Complete (2026-03-02)
- [x] TASK-03: F8 — Add structured error logging to submission and sync routes — Complete (2026-03-02)
- [x] TASK-04: F4+F6(mutex) — Add KV mutex with TTL to sync route — Complete (2026-03-02)
- [x] CHECKPOINT-05: Re-assess F3 server and client tasks after KV pattern is confirmed — Complete (2026-03-02)
- [x] TASK-06: F3+F6(jobs) — Async submission job system (server) — Complete (2026-03-02)
- [x] TASK-07: F3 client — Update submission flow to async polling — Complete (2026-03-02)
- [x] TASK-08: Tests — Update and extend test coverage for all F-items — Complete (2026-03-02)

## Goals

- F2: Add `catalogProductDraftSchema.safeParse` to submission route before zip build; reject malformed products with structured error.
- F3: Refactor the **submission** route to async job pattern: POST returns `{ ok: true, jobId }` (HTTP 202); new `GET /api/catalog/submission/status/[jobId]` returns job state and download URL. The sync route remains synchronous — F3 applies to submission only per dispatch scope.
- F4: Add a best-effort KV mutex to the sync route. When the KV lock key is present for the given storefront, return 409 `sync_already_running`. Cloudflare KV does not provide atomic compare-and-set, so this is a probabilistic guard against request/storefront-level concurrency (not a hard serialization guarantee). The primary benefit is deterring accidental duplicate sync invocations for the same storefront within a short time window. When KV is unavailable, emit a warning and allow the sync to proceed (KV outage should not block sync).
- F6: Set `expirationTtl` on all async job KV entries (F3) and on the sync mutex key (F4).
- F8: Add `console.error` with route, error message, and `durationMs` in catch blocks of both submission and sync routes.

## Non-goals

- F7: Durable Objects rate limiting — explicitly excluded (free-tier only).
- Changing the client-side draft form shape or the `catalogProductDraftSchema` definition.
- Adding new product fields or taxonomy changes.
- Any changes to the `xa-b` storefront app or catalog contract endpoint.
- Migrating the in-memory rate limit store to KV.
- TTL enforcement on the external draft contract endpoint (`XA_CATALOG_CONTRACT_BASE_URL`).

## Constraints & Assumptions

- Constraints:
  - Free Cloudflare tier only: KV for F3/F4/F6. No Durable Objects.
  - KV namespace `XA_UPLOADER_KV` does not exist yet; must be created via `wrangler kv namespace create XA_UPLOADER_KV` and the resulting namespace ID added to `wrangler.toml` — this is an operator setup step.
  - KV namespace binding must use `[[kv_namespaces]]` block (not `[vars]`) in `wrangler.toml` for both production and preview envs.
  - All new route handlers must call `hasUploaderSession(request)` before any logic.
  - All error responses must use `{ ok: false, error: string, reason: string }` shape.
  - `isLocalFsRuntimeEnabled()` must gate any KV access so local dev does not crash on missing Cloudflare context.
  - `export const runtime = "nodejs"` on both routes — OpenNext/Cloudflare Workers compat, NOT edge runtime.
  - Tests run in CI only (`docs/testing-policy.md`). Do not run Jest locally.
- Assumptions:
  - `getCloudflareContext()` from `@opennextjs/cloudflare` exposes KV bindings in the nodejs runtime used by these routes (same pattern as `apps/business-os`).
  - Cloudflare Workers free tier KV limits (100K reads/day, 1K writes/day) are sufficient for expected volume.
  - For F3 zip storage: use R2 presigned download URL if an R2 bucket binding can be confirmed in `wrangler.toml`; otherwise fall back to KV storage for zips ≤25 MB. This choice is finalized at CHECKPOINT-05 after the first wave ships and KV access is confirmed.
  - `console.error` in a Cloudflare Worker is captured in Cloudflare's log stream (F8 satisfies telemetry without a third-party logger).

## Inherited Outcome Contract

- **Why:** Operator-identified process audit findings F2/F3/F4/F6/F8 represent reliability and observability gaps that increase risk for production catalog submissions as submission volume grows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** After this build: (1) malformed drafts are rejected at submission time with a structured error; (2) large submission zip builds do not time out the request handler; (3) concurrent sync runs for the same storefront are probabilistically deterred via a best-effort KV mutex (not a hard serialization guarantee — Cloudflare KV is non-atomic; the primary benefit is deterring accidental duplicate invocations); (4) orphaned async job and mutex KV entries expire automatically via TTL; (5) submission and sync errors are logged with enough context to diagnose production failures.
- **Source:** auto

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-submission-pipeline-hardening/fact-find.md`
- Key findings used:
  - F2 gap confirmed: `submission/route.ts` has no import of `catalogProductDraftSchema` and no `.safeParse` call; pattern to replicate from `products/bulk/route.ts`.
  - F3 gap confirmed: submission route returns streaming zip response inline; `buildSubmissionZipStream` / `buildSubmissionZipFromCloudDrafts` called synchronously.
  - F4 gap confirmed: sync route calls `runSyncPipeline` / `runCloudSyncPipeline` with no KV lock.
  - F6 clarification: app currently has zero direct KV writes; F6 is implemented as `expirationTtl` on F3 job store and F4 mutex KV puts.
  - F8 gap confirmed: no `console.error` in catch blocks of either route.
  - KV binding absent: `wrangler.toml` has no `[[kv_namespaces]]` block.
  - `getCloudflareContext` pattern: confirmed in `apps/business-os/src/lib/d1.server.ts`.
  - Client blast radius: `handleExportSubmissionImpl`, `handleUploadSubmissionToR2Impl`, `fetchSubmissionZip`, `CatalogSubmissionPanel` all require update for F3.

## Proposed Approach

- Option A: Async job system with KV for job state + R2 for zip storage (presigned download URL in status response). Cleanest for large zips; requires confirming R2 bucket binding.
- Option B: Async job system with KV for job state + KV for zip storage (binary value, ≤25 MB cap). No new binding required; constrained to current free-tier submission size limit.
- Chosen approach: **Option B as baseline, with Option A as upgrade path after CHECKPOINT-05**. Rationale: Option B is immediately implementable with only the KV namespace binding (which is required for F4 regardless). Option A requires an R2 bucket binding whose existence is unconfirmed. After TASK-01/02/03/04 ship and the KV access pattern is verified, CHECKPOINT-05 reassesses whether to proceed with Option B or upgrade to Option A before TASK-06/07 build starts. This decision is folded into the checkpoint; no separate DECISION task is needed.

## Plan Gates

- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Partially. TASK-01, TASK-02, TASK-03 are >= 80 and auto-build eligible. TASK-04 is at 75% (below the >=80 threshold for automatic execution); lp-do-build will pause after wave-1 tasks and invoke `/lp-do-replan` for TASK-04 before executing it. TASK-06/07 at 65% are explicitly gated behind CHECKPOINT-05 which invokes `/lp-do-replan`. Auto-build can proceed — it will progress wave-1 tasks, then stop at the first sub-threshold task. This is the correct checkpoint-gated behaviour per the auto-continue policy.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add KV namespace binding to wrangler.toml | 85% | S | Complete (2026-03-02) | - | TASK-04, TASK-06 |
| TASK-02 | IMPLEMENT | F2 — Zod schema validation in submission route | 85% | S | Complete (2026-03-02) | - | TASK-08 |
| TASK-03 | IMPLEMENT | F8 — Structured error logging in catch blocks | 80% | S | Complete (2026-03-02) | - | TASK-08 |
| TASK-04 | IMPLEMENT | F4+F6 — KV mutex with TTL on sync route | 85% | S | Complete (2026-03-02) | TASK-01 | CHECKPOINT-05, TASK-08 |
| CHECKPOINT-05 | CHECKPOINT | Re-assess F3 after KV pattern confirmed | 95% | S | Complete (2026-03-02) | TASK-01, TASK-02, TASK-03, TASK-04 | TASK-06 |
| TASK-06 | IMPLEMENT | F3+F6 — Async submission job system (server) | 85% | L | Complete (2026-03-02) | CHECKPOINT-05 | TASK-07, TASK-08 |
| TASK-07 | IMPLEMENT | F3 client — Async submission polling flow | 85% | M | Complete (2026-03-02) | TASK-06 | TASK-08 |
| TASK-08 | IMPLEMENT | Tests — Update and extend all affected test coverage | 80% | M | Complete (2026-03-02) | TASK-02, TASK-03, TASK-04, TASK-06, TASK-07 | - |

## Parallelism Guide

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1a | TASK-01, TASK-02, TASK-03 | None | All independent; can run in parallel |
| 1b | TASK-04 | TASK-01 | Depends on KV binding from TASK-01 |
| 2 | CHECKPOINT-05 | TASK-01, TASK-02, TASK-03, TASK-04 | Reassessment gate; triggers replan for TASK-06/07 |
| 3 | TASK-06 | CHECKPOINT-05 | Server async job implementation |
| 4 | TASK-07 | TASK-06 | Client polling implementation |
| 5 | TASK-08 | TASK-02, TASK-03, TASK-04, TASK-06, TASK-07 | Consolidates all test work after build complete |

## Tasks

---

### TASK-01: Add KV namespace binding to wrangler.toml

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/wrangler.toml`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/xa-uploader/wrangler.toml`
- **Depends on:** -
- **Blocks:** TASK-04, TASK-06
- **Confidence:** 85%
  - Implementation: 90% — adding a `[[kv_namespaces]]` block to TOML is mechanical; exact TOML block syntax is standard Cloudflare wrangler format
  - Approach: 90% — single approach; `[[kv_namespaces]]` block documented and well-understood; `[env.preview.kv_namespaces]` for preview env
  - Impact: 85% — prerequisite for F3/F4/F6; without this, KV access in production Worker is impossible. Minor uncertainty: namespace ID is not known until the operator runs `wrangler kv namespace create XA_UPLOADER_KV` and supplies the resulting ID.
  - Held-back test (Implementation=90): "No single unknown would push below 80 — the TOML block syntax is well-defined and the wrangler.toml file structure is confirmed."
- **Acceptance:**
  - `wrangler.toml` contains a `[[kv_namespaces]]` block with `binding = "XA_UPLOADER_KV"` and a production namespace ID
  - `[env.preview]` section contains a matching `[[env.preview.kv_namespaces]]` block with a preview namespace ID
  - No existing keys in `[vars]` or `[env.preview.vars]` have been moved to the KV block incorrectly
- **Validation contract (TC-01):**
  - TC-01a: `wrangler deploy --dry-run` succeeds (validates TOML syntax)
  - TC-01b: `[[kv_namespaces]]` block present with `binding = "XA_UPLOADER_KV"` — confirmed by grep
  - TC-01c: Preview env block present under `[env.preview]` — confirmed by grep
- **Execution plan:** Red -> Green -> Refactor
  - Red: n/a (config-only change; no test goes red)
  - Green: Add `[[kv_namespaces]]` block below `[assets]` in production section; add `[[env.preview.kv_namespaces]]` block under `[env.preview]`. Use placeholder namespace IDs (e.g. `"REPLACE_WITH_PROD_NS_ID"`) as sentinels until operator runs `wrangler kv namespace create XA_UPLOADER_KV`.
  - Refactor: Replace placeholder namespace IDs with real IDs once operator creates namespaces.
- **Planning validation:** Not required for S effort.
- **Scouts:** The wrangler.toml file has been read in full. Confirmed: no existing `[[kv_namespaces]]` block, `nodejs_compat` flag set, `[env.preview]` section present.
- **Edge Cases & Hardening:**
  - If operator does not have wrangler installed or KV namespace creation permissions, the plan notes this as a prerequisite operator step (not blocking the TOML change itself — sentinels can be committed first).
  - Do not put KV namespace IDs in `[vars]` — they must be in `[[kv_namespaces]]` blocks only.
- **What would make this >=90%:**
  - Real namespace IDs obtained and filled in at commit time (removing sentinel uncertainty).
- **Rollout / rollback:**
  - Rollout: Merge `wrangler.toml` change and deploy. KV namespace binding becomes available in the Worker.
  - Rollback: Remove the `[[kv_namespaces]]` block. KV binding is unavailable; F3/F4 code gates on `isLocalFsRuntimeEnabled()` so local dev is unaffected.
- **Documentation impact:**
  - Add `wrangler kv namespace create XA_UPLOADER_KV` to the deployment setup comment block in `wrangler.toml`.
- **Notes / references:**
  - Cloudflare docs: KV namespace binding syntax uses `[[kv_namespaces]]` (array-of-tables), not `[vars]`.
  - Preview namespace: operator must run `wrangler kv namespace create XA_UPLOADER_KV --env preview` to get preview namespace ID separately.
- **Build evidence (2026-03-02):**
  - `[[kv_namespaces]]` block (binding=XA_UPLOADER_KV, id=REPLACE_WITH_PROD_NS_ID) added to `apps/xa-uploader/wrangler.toml` production section.
  - `[[env.preview.kv_namespaces]]` block (id=REPLACE_WITH_PREVIEW_NS_ID) added to preview section.
  - Setup instructions comment block added in wrangler.toml.
  - TC-01b: `binding = "XA_UPLOADER_KV"` present in wrangler.toml (grep confirmed).
  - TC-01c: `[[env.preview.kv_namespaces]]` block present (grep confirmed).
  - TC-01a (dry-run): not run locally per deploy policy; TOML block syntax is standard wrangler format.
  - Committed in `8510e1aee2` (bundled with wave-1a changes).

---

### TASK-02: F2 — Add Zod schema validation to submission route

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/app/api/catalog/submission/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/submission/route.ts`, `[readonly] packages/lib/src/xa/catalogAdminSchema.ts`, `[readonly] apps/xa-uploader/src/app/api/catalog/products/bulk/route.ts`
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 85%
  - Implementation: 85% — `catalogProductDraftSchema.safeParse` pattern confirmed in `products/bulk/route.ts`; straightforward import and per-product loop
  - Approach: 85% — single approach; pattern already exists in the same repo
  - Impact: 85% — closes real gap where malformed catalog snapshots could produce invalid zips silently
  - Held-back test (none at exact 80 threshold): all dimensions above 80, no single unknown would drop below 80 for any dimension.
- **Acceptance:**
  - `catalogProductDraftSchema` is imported from `@acme/lib/xa/catalogAdminSchema` in `submission/route.ts`
  - Each product in `selected` is validated via `.safeParse` before being passed to `buildSubmissionZipStream` / `buildSubmissionZipFromCloudDrafts`
  - Products failing validation are excluded from `selected` with a structured error response `{ ok: false, error: "invalid", reason: "draft_schema_invalid", diagnostics: [{ slug, issues }] }` — returned as HTTP 400 if any product fails
  - Products passing validation are passed through as `CatalogProductDraft` (Zod output type) to the zip builder
  - Existing submission route behaviour for valid products is unchanged
- **Validation contract (TC-02):**
  - TC-02a: POST with slugs all mapping to valid products → response is HTTP 200, zip stream (existing behaviour preserved)
  - TC-02b: POST where one product in catalog snapshot has a missing required field (e.g., missing `title`) → response is HTTP 400 with `{ ok: false, error: "invalid", reason: "draft_schema_invalid" }`
  - TC-02c: POST where all products are invalid → same 400 response; zip builder is never called
  - TC-02d: POST with empty `selected` (slugs not found in catalog) → existing behaviour (empty submission, handled by zip builder's own product count validation)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add failing test case in `submission/__tests__/route.test.ts` for TC-02b (malformed product in catalog mock returns 400 with `draft_schema_invalid`).
  - Green: Import `catalogProductDraftSchema` in `submission/route.ts`. After `selected` is built, run `selected.map(p => ({ product: p, result: catalogProductDraftSchema.safeParse(p) }))`. Collect failures. If any failures, return 400 with diagnostics. Otherwise use `.data` values.
  - Refactor: Extract validation into a `validateSelectedProducts` helper function to keep POST handler clean.
- **Planning validation:** Not required for S effort.
- **Scouts:** `products/bulk/route.ts` uses `catalogProductDraftSchema.safeParse(entry)` per entry in a loop with per-entry error collection — this is the exact pattern. Confirmed import path: `@acme/lib/xa/catalogAdminSchema`.
- **Edge Cases & Hardening:**
  - If the catalog snapshot itself is well-typed (from `readCloudDraftSnapshot`), validation failures indicate contract drift or corrupted draft data upstream — diagnostic output in the error response helps trace this.
  - `diagnostics` array should include `slug` and `issues` (from Zod error `issues` array) but must not leak sensitive file paths or server internals.
- **What would make this >=90%:**
  - Confirming that `CatalogProductDraft` (Zod output type) is accepted by `buildSubmissionZipStream` and `buildSubmissionZipFromCloudDrafts` without additional type coercion. The fact-find confirmed zero field drift, but the type change from input (`string` prices) to output (`number` prices) may require verifying the zip builder's expected input type.
- **Rollout / rollback:**
  - Rollout: Additive validation gate; no existing valid submission is affected. Previously accepted submissions with malformed products now return 400.
  - Rollback: Remove the `catalogProductDraftSchema.safeParse` block. Reverts to prior behaviour (no validation).
- **Documentation impact:**
  - None: this is a backend hardening change; no public API docs or user-facing docs need updating.
- **Notes / references:**
  - `CatalogProductDraftInput` vs `CatalogProductDraft`: input type uses strings for numeric fields; output type uses numbers. Confirm whether the zip builder expects input or output type.
- **Build evidence (2026-03-02):**
  - `catalogProductDraftSchema` and `CatalogProductDraftInput` imported from `@acme/lib/xa` in `submission/route.ts`.
  - `SchemaDiagnostic` type and `validateSelectedProducts(products: CatalogProductDraftInput[])` helper added (lines 58–75 in final file).
  - Validation called after `selected` array is built; returns HTTP 400 with `{ ok: false, error: "invalid", reason: "draft_schema_invalid", diagnostics }` if any product fails.
  - Key finding: `buildSubmissionZipStream` and `buildSubmissionZipFromCloudDrafts` both expect `CatalogProductDraftInput[]` (string prices), NOT the Zod output type. Implementation correctly passes original `selected` values (not `.data`) to zip builder — no type coercion needed.
  - TypeScript diagnostics: zero errors on `submission/route.ts` (mcp__ide__getDiagnostics confirmed).
  - TC-02b/c: response shape `{ ok: false, error: "invalid", reason: "draft_schema_invalid" }` confirmed in code.
  - Committed in `8510e1aee2`.

---

### TASK-03: F8 — Structured error logging in submission and sync route catch blocks

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/app/api/catalog/submission/route.ts`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/submission/route.ts`, `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- **Depends on:** -
- **Blocks:** TASK-08
- **Confidence:** 80%
  - Implementation: 90% — adding `console.error` to existing catch blocks is trivially simple; catch blocks located and confirmed in both routes
  - Approach: 90% — no ambiguity; `console.error({ route, error: String(error), durationMs })` is the correct pattern for Cloudflare Workers
  - Impact: 80% — meaningful observability improvement; errors are currently silent in production logs. Held-back test (Impact=80): "What single unknown would push Impact below 80?" — technically `console.error` in Workers is guaranteed by Cloudflare's documented log stream behaviour; no single unknown would invalidate this. Held-back test passes: "Cloudflare Workers capture console.error in real-time logs and via wrangler tail — this is documented Cloudflare behaviour."
- **Acceptance:**
  - Submission route: `console.error` called in the main `catch` block with `{ route: "POST /api/catalog/submission", error: String(error), durationMs: Date.now() - startedAt }` (or equivalent)
  - Sync route: `console.error` called in the publish-failure catch block in both `runSyncPipeline` and `runCloudSyncPipeline`, with `{ route: "POST /api/catalog/sync", error: String(error), durationMs }`
  - `console.error` is NOT called for known validation errors (rate limit, auth, payload size, slug cap) — only for unexpected failures in the pipeline execution catch block
  - Error message does NOT leak internal file paths or credentials
- **Validation contract (TC-03):**
  - TC-03a: Spy on `console.error`; trigger submission route with a mock that throws an unexpected error → `console.error` called once with expected shape
  - TC-03b: Spy on `console.error`; trigger submission route with a known validation error (e.g., slug count exceeded) → `console.error` NOT called
  - TC-03c: Spy on `console.error`; trigger sync route with a publish failure mock → `console.error` called once
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add test spy assertions for TC-03a/b/c (before the implementation exists, these will fail if logging is absent).
  - Green: Add `console.error` calls in the specified catch blocks.
  - Refactor: Extract error log payload shape into a helper if both routes duplicate the same shape.
- **Planning validation:** Not required for S effort.
- **Scouts:** Submission route catch block confirmed at line 169–186; no `console.error` present. Sync route publish failure catch blocks confirmed at lines 524–538 (local pipeline) and 601–614 (cloud pipeline); no `console.error` present.
- **Edge Cases & Hardening:**
  - Log payload must not include raw `error.stack` (could leak repo paths). Use `String(error)` (message only) or `error instanceof Error ? error.message : String(error)`.
  - Add `durationMs` where `startedAt` is in scope. In sync route catch blocks nested inside pipeline functions, `startedAt` is passed as a param — use it.
- **What would make this >=90%:**
  - Confirming log redaction: ensure `String(error)` does not leak local file paths visible in production. Submission route already has `EACCES` path-leakage test (from `route.test.ts`) — the `console.error` should not echo to the response, only to the log stream.
- **Rollout / rollback:**
  - Rollout: Additive change; no response shape changes. Logs begin appearing in Cloudflare dashboard.
  - Rollback: Remove `console.error` lines. No functional impact.
- **Documentation impact:**
  - None.
- **Notes / references:**
  - Submission route: `startedAt` is not currently tracked; add `const startedAt = Date.now()` at the top of the POST handler's pipeline try block.
  - Sync route: `startedAt` is already passed to `runSyncPipeline` and `runCloudSyncPipeline` as a param.
- **Build evidence (2026-03-02):**
  - `const startedAt = Date.now()` added before pipeline try block in `submission/route.ts` (line 157).
  - `console.error({ route: "POST /api/catalog/submission", error: error instanceof Error ? error.message : String(error), durationMs: Date.now() - startedAt })` added in the final catch block of submission route (after known validation error guard).
  - `console.error({ route: "POST /api/catalog/sync", error: ..., durationMs })` added in both publish-failure catch blocks of sync route (`runSyncPipeline` and `runCloudSyncPipeline`).
  - Acceptance confirmed: `console.error` only in unexpected failure path, not for known validation errors.
  - Error payload uses `error instanceof Error ? error.message : String(error)` — does not include stack trace.
  - TypeScript diagnostics: zero errors on both routes (mcp__ide__getDiagnostics confirmed).
  - Committed in `8510e1aee2`.

---

### TASK-04: F4+F6(mutex) — Add KV mutex with TTL to sync route

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/app/api/catalog/sync/route.ts`, new `apps/xa-uploader/src/lib/syncMutex.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/sync/route.ts`, `apps/xa-uploader/wrangler.toml`
- **Depends on:** TASK-01
- **Blocks:** CHECKPOINT-05, TASK-08
- **Confidence:** 85% _(replanned 2026-03-02, was 75%)_
  - Implementation: 85% — KV mutex acquire/release pattern is confirmed. Production Worker always has `getCloudflareContext` context available (set by worker entrypoint before any route runs). Use `await getCloudflareContext({ async: true })` for robustness in nodejs runtime routes. `isLocalFsRuntimeEnabled()` guard covers local dev (mutex skipped entirely). E2 evidence: `@opennextjs/cloudflare` source confirms this.
  - Approach: 85% — async form `getCloudflareContext({ async: true })` confirmed as correct pattern for nodejs runtime routes. KV follows same `env` namespace as D1 in business-os. TTL of 300s prevents mutex deadlock on crash. E2 evidence: cloudflare-context.js source + d1.server.ts pattern.
  - Impact: 85% — deters concurrent sync invocations; the worst-case duplicate-run consequence (duplicate publish history entry) is bounded and recoverable
  - Composite: min(85, 85, 85) = **85%**
  - Replan evidence: `docs/plans/xa-uploader-submission-pipeline-hardening/replan-notes.md` Round 1
- **Acceptance:**
  - `syncMutex.ts` exposes `acquireSyncMutex(kv, storefront): Promise<boolean>` and `releaseSyncMutex(kv, storefront): Promise<void>`
  - KV key: `xa-sync-lock:{storefrontId}`
  - `acquireSyncMutex` implements a non-atomic check-then-set: `get` the key; if present, return `false` (lock held per current KV state); if absent, `put` the key with `expirationTtl: 300` (5 minutes) and return `true`. This is a **best-effort probabilistic guard** — not a hard serialization guarantee. Cloudflare KV does not provide atomic compare-and-set; a narrow race window exists between the `get` and `put` steps. This is explicitly acknowledged and acceptable: the primary benefit is deterring accidental duplicate sync invocations at the request/storefront level within a short time window, where the rate limit (3 req/min per IP) makes true races rare. Consequence of a missed lock is a duplicate publish history entry (see Risks).
  - `releaseSyncMutex` deletes the key
  - Sync route POST: attempts mutex acquire after auth + rate limit, before `runSyncPipeline` / `runCloudSyncPipeline`; releases in `finally` block; returns 409 `{ ok: false, error: "conflict", reason: "sync_already_running" }` if lock key is present
  - If KV is unavailable (`getCloudflareContext()` throws or returns no binding): emit `console.warn` with context, skip mutex, proceed with sync — KV unavailability must not block all sync operations
  - `isLocalFsRuntimeEnabled()` guard: if local FS is enabled, skip KV mutex (KV not available in local dev env)
- **Validation contract (TC-04):**
  - TC-04a: Mock KV where `kv.get("xa-sync-lock:xa-b")` returns a non-null value (lock already held); call POST once; assert HTTP 409 with `{ ok: false, error: "conflict", reason: "sync_already_running" }`. Note: this tests the sequential read-lock-is-present path rather than parallel calls — deterministic in unit tests regardless of KV non-atomicity.
  - TC-04b: Mock KV `put` to throw; assert sync route still returns a sensible error (mutex failure should not crash the route — fail open to allow sync if KV is unavailable)
  - TC-04c: Mock KV; call POST; assert `kv.put` called with `expirationTtl: 300` and key `xa-sync-lock:{storefront}`
  - TC-04d: Mock KV; call POST that succeeds; assert `kv.delete` called on the mutex key (released in finally)
  - TC-04e: `isLocalFsRuntimeEnabled()` returns true → `kv.put` not called (mutex skipped in local FS mode)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add failing tests for TC-04a/c/d in sync route test file (mock `syncMutex.ts` module entirely, assert 409 conflict and mutex acquire/release calls).
  - Green: Create `syncMutex.ts`. Import `getCloudflareContext` from `@opennextjs/cloudflare`. In `acquireSyncMutex`: use `await getCloudflareContext({ async: true })` (async form — required for nodejs runtime routes; also works in production Worker). Guard with `!isLocalFsRuntimeEnabled()` before any `getCloudflareContext` call. In sync route POST handler, acquire mutex after auth, release in `finally`. Return 409 if acquire returns false.
  - Refactor: Extract KV context access into a helper `getUploaderKv(): Promise<KVNamespace | null>` (returns null if local FS enabled or binding unavailable) to be reused by TASK-06.
- **Planning validation:**
  - Checks run: Read `apps/business-os/src/lib/d1.server.ts` to confirm `getCloudflareContext()` access pattern. Confirmed: `const { env } = await getCloudflareContext(); env.DB` for D1. KV follows same pattern: `env.XA_UPLOADER_KV`.
  - Validation artifacts: `apps/business-os/src/lib/d1.server.ts` — confirms `getCloudflareContext` usage in nodejs runtime.
  - Unexpected findings: business-os uses `export const dynamic = "force-dynamic"` on pages using D1. This is about preventing static prerendering, not about runtime access. The sync route already has `export const runtime = "nodejs"` which is equivalent for API routes.
- **Scouts:** Sync route imports and control flow read in full (lines 633–681). No KV imports. `isLocalFsRuntimeEnabled()` already imported. Auth + rate limit pattern confirmed: rate limit first, then mode check, then auth, then payload parse, then pipeline execution.
- **Edge Cases & Hardening:**
  - KV unavailability policy: if `getCloudflareContext()` throws or returns no KV binding (e.g., KV outage or binding misconfiguration), log a `console.warn` and proceed with the sync without a mutex guard. This is an intentional trade-off: a KV outage should not block all sync operations. The sync pipeline produces deterministic output (same catalog artifact given same input), so a missed mutex means two sync runs may produce two identical publishes — a duplicate publish history entry (capped at 100) is the worst-case consequence. The warning is emitted; the absence of mutex protection is visible in the operator log stream.
  - TTL of 5 minutes (300 seconds) is intentionally short — a sync run that takes longer than 5 minutes (default timeout is 300s) will self-expire the lock at the same time as the route timeout. This is acceptable: the route itself times out at 300s, so the mutex TTL matches the max expected hold time.
- **What would make this >=90%:**
  - Confirming that `getCloudflareContext().env.XA_UPLOADER_KV` is non-null in the nodejs runtime for this app (verified by the TASK-04 implementation itself — this becomes evidence for TASK-06 confidence recalibration at CHECKPOINT-05).
  - Verifying that the duplicate-publish-history-entry consequence of a missed mutex (see Risks) is acceptable to the operator. The history file is capped at 100 entries, so accumulation is bounded.
- **Rollout / rollback:**
  - Rollout: Deploy with TASK-01's KV namespace binding in place. Mutex becomes active on deployment.
  - Rollback: Remove mutex acquire/release calls. Reverts to prior behaviour (no mutex). `syncMutex.ts` can remain or be removed.
- **Documentation impact:**
  - Add note to sync route file header: "Best-effort concurrency guard: concurrent sync invocations for the same storefront return 409 when KV lock key is present."
- **Notes / references:**
  - KV `put` with `expirationTtl` does not guarantee atomicity across concurrent Worker instances. For this use case this is acceptable — see Edge Cases.
  - The `getUploaderKv()` helper extracted here should be usable by TASK-06's job store.
- **Build evidence (2026-03-02):**
  - `apps/xa-uploader/src/lib/syncMutex.ts` created with `UploaderKvNamespace` interface, `getUploaderKv()`, `acquireSyncMutex()`, `releaseSyncMutex()`.
  - Uses `await getCloudflareContext({ async: true })` — confirmed safe for nodejs runtime routes (production Worker sets global context before any handler; async form used for robustness).
  - `isLocalFsRuntimeEnabled()` guard in `getUploaderKv()` — mutex skipped in local dev.
  - KV key format: `xa-sync-lock:{storefrontId}` with `expirationTtl: 300` (F6).
  - Sync route POST handler updated: mutex acquire after auth, pipeline in try, release in finally, 409 returned if acquire returns false.
  - `UploaderKvNamespace` local interface avoids direct dependency on `@cloudflare/workers-types`.
  - `CloudflareEnv` global interface extended with `XA_UPLOADER_KV?: UploaderKvNamespace`.
  - TC-04a–e added in separate top-level describe block (max-lines-per-function constraint).
  - Typecheck: zero errors. Lint: clean. Pre-commit hooks passed.
  - Committed in `17796bc657`.

---

### CHECKPOINT-05: Re-assess F3 async job system after KV pattern confirmed

- **Type:** CHECKPOINT
- **Deliverable:** Updated plan evidence via `/lp-do-replan`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-03-02)
- **Affects:** `docs/plans/xa-uploader-submission-pipeline-hardening/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04
- **Blocks:** TASK-06
- **Confidence:** 95%
  - Implementation: 95% — checkpoint execution is defined
  - Approach: 95% — gates the highest-complexity work on confirmed KV access evidence
  - Impact: 95% — prevents deep F3 execution on unconfirmed KV pattern
- **Acceptance:**
  - `/lp-do-build` checkpoint executor invoked
  - `/lp-do-replan` run on TASK-06 and TASK-07
  - Confidence for TASK-06/07 recalibrated from: (1) confirmed KV access pattern from TASK-04 implementation, (2) confirmed zip storage choice (R2 vs KV) based on whether an R2 bucket binding was confirmed or added, (3) any test failures or surprises from TASK-01/02/03/04
  - Plan updated and re-sequenced after replan
- **Horizon assumptions to validate:**
  - Does `getCloudflareContext().env.XA_UPLOADER_KV` work correctly in this app's nodejs runtime? (Confirmed or denied by TASK-04 implementation)
  - Is `ctx.waitUntil` accessible from a Next.js App Router POST handler compiled by OpenNext for this app? (Determines whether TASK-06 uses `waitUntil`-based deferred execution or synchronous-on-first-poll fallback)
  - Is an R2 bucket binding available (or added) in `wrangler.toml` for F3 zip storage? (Determines approach Option A vs B)
  - Did TASK-02 require type coercion between `CatalogProductDraftInput` and `CatalogProductDraft` for the zip builder? (May affect TASK-06's validation approach)
  - Did any test infrastructure surprise arise that affects TASK-08 scope?
- **Validation contract:** `/lp-do-replan` run produces updated task specs for TASK-06/07/08 with confidence >=80 before TASK-06 build starts.
- **Planning validation:** None required — procedural gate task.
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Plan updated with replan evidence.
- **Build evidence (2026-03-02):**
  - H1 (KV access): Confirmed by TASK-04 implementation. `getUploaderKv()` helper reusable by TASK-06.
  - H2 (`ctx.waitUntil`): Confirmed (E2) — `cloudflare-context.d.ts` types `ctx: ExecutionContext`; `waitUntil` is standard on `ExecutionContext`. Primary async pattern confirmed; no fallback needed.
  - H3 (R2 vs KV): Confirmed Option B (E2) — `wrangler.toml` has no `[[r2_buckets]]` block; only env vars for client-side presigned URL feature.
  - H4 (TASK-02 type impact): Confirmed no coercion needed — `buildSubmissionZipFromCloudDrafts` accepts `CatalogProductDraftInput[]`; TASK-06 uses same validated-but-original-values pattern.
  - H5 (test infrastructure): No surprises. `max-lines-per-function` mitigation pattern confirmed from TC-04 build.
  - `/lp-do-replan` (Round 2) elevated TASK-06: 65% → 85%; TASK-07: 65% → 85%. Both above 80% IMPLEMENT threshold.
  - CHECKPOINT-05 acceptance criterion met: TASK-06 and TASK-07 at >=80% confidence.

---

### TASK-06: F3+F6(jobs) — Async submission job system (server)

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/app/api/catalog/submission/route.ts` (POST handler refactored), new `apps/xa-uploader/src/app/api/catalog/submission/status/[jobId]/route.ts`, new `apps/xa-uploader/src/app/api/catalog/submission/download/[jobId]/route.ts`, new `apps/xa-uploader/src/lib/submissionJobStore.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** L
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/submission/route.ts`, new `apps/xa-uploader/src/app/api/catalog/submission/status/[jobId]/route.ts`, new `apps/xa-uploader/src/app/api/catalog/submission/download/[jobId]/route.ts`, new `apps/xa-uploader/src/lib/submissionJobStore.ts`, `apps/xa-uploader/wrangler.toml`
- **Depends on:** CHECKPOINT-05
- **Blocks:** TASK-07, TASK-08
- **Confidence:** 85% _(replanned 2026-03-02 Round 2, was 65%)_
  - Implementation: 85% — KV access proven by TASK-04 implementation (`getUploaderKv()` helper reusable); `ctx.waitUntil` confirmed via `cloudflare-context.d.ts` (`ctx: ExecutionContext`); Option B (KV blob storage) fully specified; stream buffering requirement identified. E2+E1 evidence.
  - Approach: 85% — `ctx.waitUntil` pattern confirmed (primary approach, no fallback needed); Option B (KV blob, ≤25 MB) confirmed as sole approach (no `[[r2_buckets]]` binding in wrangler.toml); download via new `/api/catalog/submission/download/[jobId]` endpoint. E2+E2 evidence.
  - Impact: 90% — eliminates timeout risk for large submission zip builds; most impactful item in this plan
  - Composite: min(85, 85, 90) = **85%** — above 80% IMPLEMENT threshold
  - Replan evidence: `docs/plans/xa-uploader-submission-pipeline-hardening/replan-notes.md` Round 2
- **Acceptance:**
  - POST handler: returns `{ ok: true, jobId: string }` with HTTP 202; job enqueued in KV as `xa-submission-job:{jobId}` with `expirationTtl: 3600` (F6)
  - Job state machine: `{ status: "pending" | "running" | "complete" | "failed", createdAt, updatedAt, downloadUrl?: string, error?: string }`
  - Background execution: zip build runs asynchronously via `ctx.waitUntil` — `const { ctx } = await getCloudflareContext({ async: true }); ctx.waitUntil(executeSubmissionJob(jobId, kv, selected, options))`. `ctx.waitUntil` confirmed available via `cloudflare-context.d.ts` (`ctx: ExecutionContext`). POST returns 202 immediately; zip build runs after response is sent.
  - Zip binary storage: `xa-submission-zip:{jobId}` in KV with `expirationTtl: 3600`. Stream buffering: collect Node.js Readable to Buffer before `kv.put`. Size constraint: ≤25 MB (matches existing `XA_UPLOADER_SUBMISSION_MAX_MB` config).
  - Status endpoint `GET /api/catalog/submission/status/[jobId]`: returns job state; calls `hasUploaderSession` before any logic; returns 404 for unknown job IDs; returns `downloadUrl: "/api/catalog/submission/download/{jobId}"` when status is `complete`
  - Download endpoint `GET /api/catalog/submission/download/[jobId]`: reads `xa-submission-zip:{jobId}` from KV; calls `hasUploaderSession` before any logic; returns zip binary as `application/zip`; returns 404 if job/zip not found
  - KV job entries include `expirationTtl: 3600` (1 hour) on all puts (F6)
  - `isLocalFsRuntimeEnabled()` guard: local FS path still returns synchronous zip response (preserves local dev behaviour); async job path activates only in cloud runtime
- **Validation contract (TC-06):**
  - TC-06a: POST with valid slugs → HTTP 202 `{ ok: true, jobId: "..." }`
  - TC-06b: Mock KV; assert `kv.put` called with key `xa-submission-job:{jobId}` and `expirationTtl: 3600`
  - TC-06c: GET `/status/{jobId}` for pending job → `{ ok: true, status: "pending" }` (or `running`)
  - TC-06d: GET `/status/{jobId}` for completed job → `{ ok: true, status: "complete", downloadUrl: "..." }`
  - TC-06e: GET `/status/{unknownJobId}` → HTTP 404
  - TC-06f: GET `/status/{jobId}` without auth → HTTP 404
  - TC-06g: `isLocalFsRuntimeEnabled()` returns true → POST returns synchronous zip stream (existing local behaviour preserved)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add failing tests TC-06a/b/c/d/e/f/g; update existing tests that expect streaming zip response from POST to expect `{ ok: true, jobId }`.
  - Green: Create `submissionJobStore.ts` (KV job state helpers: `enqueueJob`, `updateJob`, `getJob`). Refactor POST handler to enqueue job and return `{ ok: true, jobId }` HTTP 202 (or synchronous zip in local FS mode via existing path). Add status route and download route. Implement `executeSubmissionJob`: call `buildSubmissionZipFromCloudDrafts`, buffer Readable stream to Buffer, `kv.put("xa-submission-zip:{jobId}", buffer, { expirationTtl: 3600 })`, update job state to `complete`. Register with `ctx.waitUntil`.
  - Refactor: Extract zip execution into `executeSubmissionJob(jobId, kv, selected, options): Promise<void>` — called from `ctx.waitUntil` in POST handler.
- **Planning validation (L effort required):**
  - Checks run:
    1. Confirmed `Readable.toWeb` zip streaming in submission route (current pattern lines 157–168).
    2. `waitUntil` availability: **assumed** (not confirmed by repo-local evidence in xa-uploader). `getCloudflareContext()` in the OpenNext pattern returns `{ env, ctx, cf }` per Cloudflare docs, and `ctx.waitUntil` is the standard deferred execution mechanism. However, whether `ctx.waitUntil` is accessible from a Next.js App Router POST handler compiled by OpenNext for this specific app has NOT been verified by reading xa-uploader source or OpenNext output. This is a risk item: if `ctx.waitUntil` is not available, the async job execution mechanism must fall back to a synchronous-on-first-poll pattern. CHECKPOINT-05 must include this as a horizon assumption to verify.
    3. Confirmed `isLocalFsRuntimeEnabled()` is already imported in `submission/route.ts` (line 11).
    4. Confirmed KV key naming pattern from TASK-04: `xa-sync-lock:{storefront}` → job keys follow same pattern `xa-submission-job:{jobId}`.
  - Validation artifacts: `submission/route.ts` lines 1–18 confirm imports; `sync/route.ts` confirms `isLocalFsRuntimeEnabled()` pattern.
  - Unexpected findings: `buildSubmissionZipStream` (local FS path) uses Node.js `Readable` streams. In the async path, the stream must be buffered to binary before storing in R2 or KV. This is a new requirement not in the fact-find seeds — the zip builder does not buffer; it streams. The execution plan must buffer the stream.
- **Scouts:**
  - `ctx.waitUntil` availability: **Confirmed (E2).** `cloudflare-context.d.ts` types `ctx: ExecutionContext`. `ExecutionContext.waitUntil` is the standard Cloudflare Workers deferred execution API. No fallback needed.
  - Zip builder return type: Confirmed (E1). `buildSubmissionZipStream` and `buildSubmissionZipFromCloudDrafts` return `{ stream: Readable, filename, manifest }` — stream must be collected to Buffer before KV put.
  - R2 bucket binding: **Absent (E2).** `wrangler.toml` confirms no `[[r2_buckets]]` block. Option B (KV blob storage) is the confirmed approach.
  - KV size limit: 25 MB value limit matches `NEXT_PUBLIC_XA_UPLOADER_SUBMISSION_MAX_MB = "25"` — constraint already enforced by zip builder options.
- **Edge Cases & Hardening:**
  - Job ID must be a cryptographically random ID (e.g., `crypto.randomUUID()`) — not sequential.
  - Status endpoint must validate job ID format to prevent KV scan abuse (e.g., max 64 chars, UUID-format validation).
  - If zip build fails in the deferred path, update job state to `failed` with an error code; status endpoint returns this to the client.
  - TTL on job KV entries means jobs expire after 1 hour; status endpoint returns 404 for expired jobs (client shows "submission expired — please retry").
  - `expirationTtl: 3600` (F6): both the job state entry and the zip binary entry (if stored in KV) must use this TTL.
- **What would make this >=90%:**
  - Verifying the Buffer collection pattern for large zip streams in the Worker runtime (stream → Buffer → `kv.put` with binary value).
  - Confirming the `executeSubmissionJob` error handling path updates job state to `failed` correctly when `buildSubmissionZipFromCloudDrafts` throws.

#### Re-plan Update (2026-03-02)
- Confidence: 65% -> 85% (Evidence: E2 for ctx.waitUntil + R2 binding check; E1 for KV access via TASK-04 + zip builder type + consumer traces)
- Key change: ctx.waitUntil confirmed available; Option B (KV blob) confirmed as sole approach; download endpoint added to deliverable scope
- Dependencies: unchanged (CHECKPOINT-05)
- Validation contract: unchanged (TC-06a–g)
- Notes: `docs/plans/xa-uploader-submission-pipeline-hardening/replan-notes.md` Round 2
- **Build evidence (2026-03-02):**
  - `apps/xa-uploader/src/lib/submissionJobStore.ts` created: `SubmissionJobState` type, `SubmissionKvNamespace` interface (extends UploaderKvNamespace with binary put overload), `enqueueJob`/`updateJob`/`getJob`/`zipKey` helpers with `expirationTtl: 3600` (F6).
  - `submission/route.ts` refactored: cloud path returns HTTP 202 `{ ok: true, jobId }` via `ctx.waitUntil`; local FS path unchanged (synchronous zip); KV unavailable fallback to synchronous zip added.
  - `executeSubmissionJob`: `pending → running → complete/failed`; zip Readable buffered to Buffer via async iteration; stored at `xa-submission-zip:{jobId}` with TTL 3600.
  - `apps/xa-uploader/src/app/api/catalog/submission/status/[jobId]/route.ts` created: `hasUploaderSession` guard, UUID format validation, `getJob` from KV, 404 for unknown jobs, `downloadUrl` returned when `complete`.
  - `apps/xa-uploader/src/app/api/catalog/submission/download/[jobId]/route.ts` created: `hasUploaderSession` guard, UUID format validation, KV binary get with `{ type: "arrayBuffer" }`, returns `application/zip`.
  - TypeScript diagnostics: zero errors on all 4 files (mcp__ide__getDiagnostics confirmed).
  - Lint: clean (`pnpm --filter xa-uploader lint` passed).
  - Offload route used: Codex exit code 0; all Affects files present on disk.
  - Committed in `c1cda3fe7a` (bundled with TASK-07/TASK-08).
- **Rollout / rollback:**
  - Rollout: Deploy server and client (TASK-07) together — response shape changes from zip stream to job ID. Must deploy both simultaneously; stale clients calling the new endpoint will receive `{ ok: true, jobId }` and need to poll.
  - Rollback: Revert to streaming POST response; remove status endpoint; remove job store KV entries (they expire via TTL anyway).
- **Documentation impact:**
  - Update `wrangler.toml` comments to note the async submission job TTL (`XA_UPLOADER_KV` KV entries for submission jobs expire after 1 hour).
- **Notes / references:**
  - Consumer tracing: Every new output of this task is addressed in TASK-07 (client flow) and TASK-08 (tests). No silent dead-end fields.
  - `waitUntil` reference: `const { ctx } = getCloudflareContext(); ctx.waitUntil(executeSubmissionJob(...))`.

---

### TASK-07: F3 client — Update submission flow to async polling

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`, `apps/xa-uploader/src/components/catalog/catalogSubmissionClient.ts`, `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx` (if panel shows loading state)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/xa-uploader/src/components/catalog/catalogSubmissionClient.ts`, `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`, `[readonly] apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- **Depends on:** TASK-06
- **Blocks:** TASK-08
- **Confidence:** 85% _(replanned 2026-03-02 Round 2, was 65%)_
  - Implementation: 85% — server API shape confirmed by TASK-06 replan (POST returns `{ ok: true, jobId }`, status returns `{ status, downloadUrl? }`); `catalogSubmissionClient.ts` and `catalogConsoleActions.ts` read in full; both consumer call sites (`handleExportSubmissionImpl`, `handleUploadSubmissionToR2Impl`) confirmed and understood; `SubmissionStep` extension to add `"polling"` identified (minor). E1 evidence.
  - Approach: 85% — single confirmed approach: enqueue → poll → fetch blob via `downloadUrl` → download/upload. No approach fork. Download URL is a path to the new download endpoint. E1 evidence (server contract resolved by TASK-06 replan).
  - Impact: 85% — client must be updated for F3 to work end-to-end; no functional value without this task
  - Composite: min(85, 85, 85) = **85%** — above 80% IMPLEMENT threshold
  - Replan evidence: `docs/plans/xa-uploader-submission-pipeline-hardening/replan-notes.md` Round 2
- **Acceptance:**
  - `catalogSubmissionClient.ts`: `fetchSubmissionZip` is replaced by `enqueueSubmissionJob(slugs, storefront)` → returns `{ jobId }`, `pollSubmissionJobStatus(jobId)` → returns `{ status, downloadUrl? }`, and `pollJobUntilComplete(jobId, options)` → awaits completion and returns `downloadUrl`
  - `handleExportSubmissionImpl` in `catalogConsoleActions.ts`: updated to use enqueue → `setSubmissionStep("polling")` → poll → `fetch(downloadUrl).blob()` → `downloadBlob(blob, filename)` pattern
  - `handleUploadSubmissionToR2Impl` in `catalogConsoleActions.ts`: updated to enqueue → `setSubmissionStep("polling")` → poll → `fetch(downloadUrl).blob()` → PUT blob to R2 upload endpoint pattern
  - `SubmissionStep` type in `catalogConsoleFeedback.ts` (or wherever defined): `"polling"` added as a valid step value
  - `busyLockRef` held during the full enqueue+poll+download sequence (unchanged from current pattern — `tryBeginBusyAction` / `endBusyAction` in the outer try/finally)
  - Polling: max poll interval 2 seconds, max wait 120 seconds before timeout error
  - No changes to `useCatalogConsole.client.ts` state shape or exported API — only `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` call sites change internally
- **Validation contract (TC-07):**
  - TC-07a: `enqueueSubmissionJob` called → server mocked to return `{ ok: true, jobId: "test-job-1" }` → poll loop starts
  - TC-07b: Poll returns `{ status: "complete", downloadUrl: "..." }` on second poll → blob downloaded, `downloadBlob` called
  - TC-07c: Poll returns `{ status: "failed" }` → action feedback updated with error message
  - TC-07d: Poll times out after 120 seconds → action feedback updated with timeout error
  - TC-07e: `busyLockRef` is held from enqueue through download completion (no double-click during async flow)
- **Execution plan:** Red -> Green -> Refactor
  - Red: Add failing unit tests for TC-07a/b/c/d mocking the new server API shape (`enqueueSubmissionJob` → `{ ok: true, jobId }`, `pollSubmissionJobStatus` → `{ status, downloadUrl }`).
  - Green: Add `enqueueSubmissionJob`, `pollSubmissionJobStatus`, `pollJobUntilComplete` to `catalogSubmissionClient.ts`. Update `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` in `catalogConsoleActions.ts` to use enqueue → poll → `fetch(downloadUrl).blob()` pattern. Add `"polling"` to `SubmissionStep` type. Set `setSubmissionStep("polling")` during poll loop.
  - Refactor: `pollJobUntilComplete(jobId, options)` is the shared utility (already planned as the Green step above). No further extraction needed.
- **Planning validation (M effort required):**
  - Checks run:
    1. Read `catalogConsoleActions.ts` in full — confirmed `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` both call `fetchSubmissionZip(slugs, fallbackError, storefront)` and then handle the blob result.
    2. Read `useCatalogConsole.client.ts` — confirmed `submissionAction` state (`setSubmissionAction`) tracks the current submission state for UI rendering. This state must reflect the polling intermediate state.
    3. `busyLockRef` is a React ref holding a boolean — held from action start to completion. Confirmed at line 110 in `useCatalogConsole.client.ts`.
  - Validation artifacts: `catalogConsoleActions.ts` — `fetchSubmissionZip` import and usage confirmed; `useCatalogConsole.client.ts` — `submissionAction`/`busyLockRef` confirmed.
  - Unexpected findings: `handleUploadSubmissionToR2Impl` uploads the zip blob directly via PUT to `submissionUploadUrl`. In the async flow, the blob must be fetched from the `downloadUrl` returned by the status endpoint, then PUT to R2. The download step is an additional `fetch` call not in the current flow — this must be accounted for in TASK-07.
- **Scouts:** Confirmed: `catalogConsoleActions.ts` uses `downloadBlob(blob, filename)` for the export path and PUT upload for the R2 path. The polling loop must provide the blob for both paths.
- **Edge Cases & Hardening:**
  - Poll timeout of 120 seconds is generous for the free-tier submission size (≤25 MB zip build). If the job does not complete within 120 seconds, show an error suggesting retry.
  - If the server returns an expired job (status 404 on the status endpoint), surface "Submission expired — please retry" to the user.
  - The download URL from the status endpoint may be a presigned R2 URL (time-limited) or a direct KV download endpoint — the client should not make assumptions about URL format; just `fetch(downloadUrl)`.
- **What would make this >=90%:**
  - Confirming that `CatalogSubmissionPanel.client.tsx` renders `submissionStep === "polling"` gracefully (existing step rendering pattern likely handles unknown steps safely — confirm before committing).
  - Confirming `SubmissionStep` type location (likely `catalogConsoleFeedback.ts`) for the `"polling"` addition.
- **Rollout / rollback:**
  - Rollout: Deploy together with TASK-06 (server + client). Stale browser sessions will fail on the new POST response shape — acceptable; page refresh picks up the new client.
  - Rollback: Revert `catalogSubmissionClient.ts` to `fetchSubmissionZip`. Revert `catalogConsoleActions.ts` action handlers. Remove `"polling"` from `SubmissionStep` type.
- **Documentation impact:**
  - None: internal behaviour change; no public-facing docs.
- **Notes / references:**
  - Consumer tracing: All consumers of `fetchSubmissionZip` are `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` — both updated in this task. No silent dead-end consumers.
  - `useCatalogConsole.client.ts` is read-only for this task (its state shape is not changing; only the implementation of the two handler functions changes in `catalogConsoleActions.ts`).

#### Re-plan Update (2026-03-02)
- Confidence: 65% -> 85% (Evidence: E1 — catalogSubmissionClient.ts + catalogConsoleActions.ts read in full; server API shape confirmed by TASK-06 replan)
- Key change: server contract confirmed (enqueue/poll/download URL pattern); SubmissionStep `"polling"` identified as required addition; both consumer call sites fully traced
- Dependencies: unchanged (TASK-06)
- Validation contract: unchanged (TC-07a–e)
- Notes: `docs/plans/xa-uploader-submission-pipeline-hardening/replan-notes.md` Round 2
- **Build evidence (2026-03-02):**
  - `catalogSubmissionClient.ts`: added `enqueueSubmissionJob`, `pollSubmissionJobStatus`, `pollJobUntilComplete` (2s interval, 120s timeout); `fetchSubmissionZip` retained as compatibility shim calling new async flow.
  - `catalogConsoleActions.ts`: `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` updated to use enqueue → `setSubmissionStep("polling")` → `pollJobUntilComplete` → `fetch(downloadUrl).blob()` → download/upload; `busyLockRef` held throughout.
  - `catalogConsoleFeedback.ts`: `SubmissionStep` extended with `"polling"`.
  - `useCatalogConsole.client.ts`: unchanged (read-only as planned).
  - TypeScript diagnostics: zero errors on all 3 modified files (mcp__ide__getDiagnostics confirmed).
  - Offload route used: Codex exit code 0; all Affects files modified on disk.
  - Committed in `c1cda3fe7a`.

---

### TASK-08: Tests — Update and extend all affected test coverage

- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.branches.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`, new `apps/xa-uploader/src/app/api/catalog/submission/status/__tests__/route.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:** `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts`, `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.branches.test.ts`, `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.test.ts`, new `apps/xa-uploader/src/app/api/catalog/submission/status/__tests__/route.test.ts`
- **Depends on:** TASK-02, TASK-03, TASK-04, TASK-06, TASK-07
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — existing test infrastructure confirmed; Jest mocking pattern for routes well-established in this repo; `getCloudflareContext` mock pattern must be established. Held-back test (Implementation=80): "What single unknown would push below 80?" — mocking `getCloudflareContext` in Jest (not a Cloudflare Worker runtime). If `getCloudflareContext` cannot be mocked cleanly in the Node Jest environment, KV-dependent tests (F3/F4 tests) cannot be written. However, `getCloudflareContext` is an ordinary module import that can be mocked with `jest.mock("@opennextjs/cloudflare")` — this is a standard Jest pattern. Held-back test passes: "No single unknown would drop below 80 — `getCloudflareContext` is mockable via jest.mock; the mock returns `{ env: { XA_UPLOADER_KV: mockKvNamespace } }`."
  - Approach: 80% — Jest mock pattern confirmed in `route.test.ts` files; all new mocks follow the same jest.mock() factory pattern. Held-back test (Approach=80): same mock reasoning as above. Passes.
  - Impact: 80% — tests enforce correctness contracts for all five F-items; without these, CI cannot verify the hardening changes. Held-back test (Impact=80): "No single unknown would drop below 80 — the acceptance criteria are precisely specified, and the test patterns are confirmed from reading existing test files."
- **Acceptance:**
  - Submission `route.test.ts` updated: existing zip-streaming assertions removed or updated to expect HTTP 202 `{ ok: true, jobId }` for the cloud path; local FS path test still expects zip response
  - Submission `route.branches.test.ts` updated: same shape change as above for relevant branches
  - New test: `submission/__tests__/route.test.ts` — TC-02b: mock catalog with malformed product → HTTP 400 `{ ok: false, error: "invalid", reason: "draft_schema_invalid" }`
  - New test: `sync/__tests__/route.test.ts` — TC-04a/c/d/e: mock KV, assert mutex acquire/release and 409 conflict response
  - New test: `submission/status/__tests__/route.test.ts` — TC-06c/d/e/f: mock KV, assert status responses
  - Console.error spy tests: TC-03a/b/c for both routes
  - All tests pass via `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs`
- **Validation contract (TC-08):**
  - TC-08a: All existing passing tests still pass after updates
  - TC-08b: New F2 test cases execute without `catalogProductDraftSchema` import errors
  - TC-08c: New F4 KV mock tests execute without `getCloudflareContext` import errors
  - TC-08d: New F3 status route tests execute and reach assertions
  - TC-08e: Console.error spy tests confirm F8 logging behaviour
- **Execution plan:** Red -> Green -> Refactor
  - Red: n/a — tests are written as part of their respective feature tasks (TASK-02/03/04/06/07 include Red steps); TASK-08 consolidates and completes the test suite.
  - Green: Update broken assertions in existing test files. Add remaining test cases not added in feature tasks. Add `getCloudflareContext` mock to `jest.mock` blocks for KV-dependent tests.
  - Refactor: Extract common KV mock factory into a shared test helper if multiple test files use the same mock pattern.
- **Planning validation (M effort required):**
  - Checks run:
    1. Read `submission/__tests__/route.test.ts` and `route.branches.test.ts` in full — confirmed: both assert `Content-Type: application/zip` on POST; these become broken after TASK-06. Both files are well-structured and straightforward to update.
    2. Read `sync/__tests__/route.test.ts` in summary from fact-find — no concurrent call test exists; mutex test is genuinely new.
    3. `jest.mock("@opennextjs/cloudflare")` is the standard pattern to mock the context provider.
  - Validation artifacts: test files read in prior session; confirmed `jest.mock` factory pattern used throughout.
  - Unexpected findings: `route.branches.test.ts` for submission tests the `isLocalFsRuntimeEnabled` mock returning `false` (cloud path) — this is exactly the path being changed by TASK-06. The cloud-path test in `route.branches.test.ts` will need updating to expect `{ ok: true, jobId }` instead of `Content-Type: application/zip`.
- **Scouts:** None additional needed — existing test files were read in full.
- **Edge Cases & Hardening:**
  - `getCloudflareContext` mock must return a mock KV namespace object with `put`, `get`, `delete` methods (jest.fn() for each).
  - Tests must not make real KV API calls — all KV operations must be mocked.
- **What would make this >=90%:**
  - Establishing the `getCloudflareContext` mock pattern once and verifying it works cleanly in Node Jest environment.
- **Rollout / rollback:**
  - Rollout: Tests run in CI after push. If any test fails, the CI run is red — fix before merge.
  - Rollback: Not applicable (tests are not deployed).
- **Documentation impact:**
  - None.
- **Notes / references:**
  - `getCloudflareContext` mock: `jest.mock("@opennextjs/cloudflare", () => ({ getCloudflareContext: jest.fn() }))` — then `getCloudflareContextMock.mockResolvedValue({ env: { XA_UPLOADER_KV: { put: kvPutMock, get: kvGetMock, delete: kvDeleteMock } }, ctx: { waitUntil: jest.fn() } })`.
- **Build evidence (2026-03-02):**
  - `submission/__tests__/route.test.ts`: cloud path test updated to expect HTTP 202 `{ ok: true, jobId }` with `getCloudflareContext` and `getUploaderKv` mocks; TC-02b added (malformed product → 400 draft_schema_invalid); TC-06a/b added (job enqueue + KV put with TTL 3600); F8 console.error spy test added.
  - `submission/__tests__/route.branches.test.ts`: added `jest.mock` blocks for `@opennextjs/cloudflare`, `submissionJobStore`, `syncMutex` to prevent import side-effects; existing local FS path tests preserved unchanged.
  - `sync/__tests__/route.test.ts`: TC-04a (409 when lock held), TC-04c (kv.put called with TTL 300 + correct key), TC-04d (kv.delete called on success), TC-04e (mutex skipped when KV unavailable) added.
  - `submission/status/__tests__/route.test.ts` created: TC-06c (pending job), TC-06d (complete job + downloadUrl), TC-06e (unknown jobId → 404), TC-06f (unauthenticated → 404).
  - TypeScript diagnostics: zero errors on all 4 test files (mcp__ide__getDiagnostics confirmed).
  - Pre-commit hook typecheck: passed (typecheck-staged.sh output confirmed in commit log).
  - Offload route used: Codex exit code 0; all Affects files present on disk.
  - Committed in `c1cda3fe7a`.

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| F3 client-side polling complexity underestimated | Medium | Medium | CHECKPOINT-05 gates TASK-07 confidence recalibration; polling utility extracted to reduce duplication |
| `getCloudflareContext` KV access not working in nodejs runtime via OpenNext | Low | High | TASK-04 is the earliest implementation that uses KV — if it fails, CHECKPOINT-05 catches this before TASK-06/07 build starts |
| R2 bucket binding not configured for zip storage | Medium | Medium | Option B (KV storage for ≤25 MB zips) is the fallback; CHECKPOINT-05 selects between options |
| F3 breaks existing submission tests | High | Low | Expected and managed — TASK-08 explicitly updates these; both test files confirmed and understood |
| KV mutex non-atomicity (check-then-set race) allows rare double-acquire | Low | Medium | Rate limit (3 req/min per IP) makes true races rare. Consequence of a missed lock: duplicate sync run for the same storefront — produces the same catalog artifact (output is deterministic) but appends a duplicate entry to the publish history JSON. Acceptable given low likelihood and the history file's capped size (`SYNC_PUBLISH_HISTORY_MAX = 100`). |
| Sync mutex deadlock if route crashes mid-hold | Low | Medium | 5-minute TTL on mutex key; key self-expires on crash. If KV is unavailable, sync proceeds with warning (intentional — see TASK-04 edge cases) |
| `ctx.waitUntil` not available in OpenNext nodejs runtime for xa-uploader | Medium | Medium | Fallback pattern: synchronous-on-first-poll (status endpoint triggers zip build on first GET). CHECKPOINT-05 validates which pattern is correct before TASK-06 build starts. |
| `console.error` leaks internal data to logs | Low | Low | Use `String(error)` (message only), not `error.stack`; no response body leakage |

## Observability

- Logging: `console.error` in submission and sync route catch blocks (F8) — visible in Cloudflare dashboard realtime logs and `wrangler tail`.
- Metrics: KV job store presence/absence observable via `wrangler kv key list --namespace-id $NS_ID`. Mutex key presence observable the same way.
- Alerts/Dashboards: None added — logging improvement is sufficient for the current scale.

## Acceptance Criteria (overall)

- [ ] Submission route validates products against `catalogProductDraftSchema` before zip build; malformed products return HTTP 400 with `draft_schema_invalid`
- [ ] Submission route POST returns `{ ok: true, jobId }` (HTTP 202) for cloud runtime; local FS runtime still returns synchronous zip
- [ ] New `GET /api/catalog/submission/status/[jobId]` endpoint exists, requires auth, returns job state and download URL on completion
- [ ] Sync route returns HTTP 409 `sync_already_running` when KV lock key is present (best-effort guard; Cloudflare KV is non-atomic — probabilistic not guaranteed serialization); when KV is unavailable, sync proceeds with a warning log
- [ ] All KV job store entries and mutex key use `expirationTtl` (1 hour for jobs, 5 minutes for mutex)
- [ ] `console.error` called in catch blocks of both routes with route name, error message, and `durationMs`
- [ ] `wrangler.toml` contains `[[kv_namespaces]]` block with `binding = "XA_UPLOADER_KV"` for production and preview
- [ ] All existing tests pass (updated for new response shapes)
- [ ] New test cases cover: F2 schema validation rejection, F4 mutex conflict (409), F3 job enqueueing and status polling, F8 console.error spy

## Decision Log

- 2026-03-02: Chosen approach for F3 zip storage: Option B (KV, ≤25 MB) as baseline with Option A (R2 presigned URL) as upgrade path. Decision gate: CHECKPOINT-05 after KV access confirmed from TASK-04 build. Rationale: avoids blocking F3 on unconfirmed R2 binding; Option B is immediately achievable; upgrade to Option A is non-breaking.
- 2026-03-02: F6 scope: TTL applied to F3 job store entries and F4 mutex KV key only. External catalog draft contract TTL is an out-of-scope concern for this plan.
- 2026-03-02: F8 error log format: `console.error({ route, error: String(error), durationMs })` — no stack trace, no raw error object, no file paths.

## Overall-confidence Calculation

Effort weights: S=1, M=2, L=3

| Task | Confidence | Effort | Weight |
|---|---|---|---|
| TASK-01 | 85% | S | 1 |
| TASK-02 | 85% | S | 1 |
| TASK-03 | 80% | S | 1 |
| TASK-04 | 85% | S | 1 |
| CHECKPOINT-05 | 95% | S | 1 |
| TASK-06 | 85% | L | 3 |
| TASK-07 | 85% | M | 2 |
| TASK-08 | 80% | M | 2 |

Overall = (85×1 + 85×1 + 80×1 + 85×1 + 95×1 + 85×3 + 85×2 + 80×2) / (1+1+1+1+1+3+2+2)
= (85 + 85 + 80 + 85 + 95 + 255 + 170 + 160) / 12
= 1015 / 12
= **84.6% → rounded to 85%**

(Post-checkpoint recalibration: TASK-04 replanned to 85%, TASK-06 replanned from 65% to 85%, TASK-07 replanned from 65% to 85%. All tasks now above 80% threshold.)

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: KV namespace binding to wrangler.toml | Yes | None | No |
| TASK-02: F2 Zod schema validation in submission route | Yes | [Type contract gap] [Moderate]: `CatalogProductDraftInput` (schema input type, string prices) vs `CatalogProductDraft` (schema output type, number prices) — confirm which type the zip builder accepts. Accepted as advisory; TASK-02 notes this. | No |
| TASK-03: F8 error logging in catch blocks | Yes | None | No |
| TASK-04: F4+F6 KV mutex on sync route | Partial | [Undefined config key] [Major]: `XA_UPLOADER_KV` binding referenced in code but not in `wrangler.toml` until TASK-01 completes. Dependency on TASK-01 declared explicitly. | No |
| CHECKPOINT-05: Re-assess F3 | Yes | None | No |
| TASK-06: F3+F6 async job system | Partial | [Missing precondition] [Major]: TASK-06 depends on CHECKPOINT-05 which depends on TASK-04. If KV access is not confirmed by TASK-04, TASK-06 confidence is uncalibrated. CHECKPOINT-05 is the gate — dependency declared explicitly. | No |
| TASK-06 (zip storage) | Partial | [Missing data dependency] [Moderate]: zip binary must be buffered from Node.js Readable stream before storing in KV/R2 — stream buffering step noted in TASK-06 planning validation | No |
| TASK-06 (status route auth) | Yes | None — auth boundary handled: status route calls `hasUploaderSession` per acceptance criteria | No |
| TASK-07: F3 client polling | Partial | [Ordering inversion] [Minor]: TASK-07 cannot be written until TASK-06 server API shape is confirmed. Dependency on TASK-06 declared; CHECKPOINT-05 gates this. | No |
| TASK-08: Tests | Yes | [Ordering inversion] [Minor]: test file updates for F3 (expecting new response shape) can only be written after TASK-06. All test tasks depend on their implementation tasks explicitly. | No |

No Critical findings. No waivers required. Plan may proceed to `Status: Active`.

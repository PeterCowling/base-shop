---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-publish-flow
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall effort-weighted
Auto-Build-Intent: plan+auto
---

# XA Uploader Publish Flow Plan

## Summary

Replace the xa-uploader sync panel with a per-product "Make Live" / "Save as Draft" flow. A new `POST /api/catalog/publish` route runs the full cloud publish pipeline (read all drafts → build catalog → validate cloud media → publish to contract → trigger xa-b deploy with 15-minute cooldown). The "Make Live" button appears only when `isPublishReady` (data valid + at least one image). The sync screen toggle and `CatalogSyncPanel` are deleted. The currency rates screen is retained but decoupled from sync mode logic so it renders in cloud mode.

## Active tasks
- [x] TASK-01: Extract cloud media helpers + create `POST /api/catalog/publish` route
- [x] TASK-02: Client publish handler in catalogConsoleActions + useCatalogConsole
- [x] TASK-03: Make Live button in CatalogProductForm; simplify StatusSelect
- [x] TASK-04: Remove CatalogSyncPanel and sync screen toggle from CatalogConsole
- [x] TASK-05: i18n — add Make Live keys, remove orphaned sync keys

## Goals
- Single-click Make Live: saves product with `publishState = "live"`, publishes full catalog, triggers xa-b rebuild in one action.
- "Save as Draft" always available; "Make Live" gated on `isPublishReady`.
- Subsequent Make Live presses during cooldown update R2 catalog; deploy fires after cooldown.
- Sync panel entirely removed from UI; currency rates panel remains.

## Non-goals
- Changing xa-b build/deploy infrastructure.
- Inventory/stock management beyond retaining draft/out_of_stock in StatusSelect.
- Local filesystem / CSV sync path changes.
- Shortening or lengthening the 15-minute cooldown.
- A "Take Offline" toggle — Make Live is one-directional; StatusSelect handles draft/out_of_stock.

## Constraints & Assumptions
- Constraints:
  - Cloudflare free tier: 100k Workers req/day, 1M R2 writes/month, 500 Pages builds/month. 15-min cooldown caps builds at ~96/day max; normal usage is far lower.
  - Cloud sync mode only. Local CSV path out of scope.
  - `acquireCloudSyncLock` / `releaseCloudSyncLock` must wrap the publish pipeline.
  - `applyCloudMediaExistenceValidation` must be included in the publish pipeline to avoid dangling image references.
- Assumptions:
  - All active operators use cloud draft mode (`XA_CATALOG_CONTRACT_BASE_URL` configured).
  - Currency rates are managed separately via the Currency Rates screen and read internally by `buildCatalogArtifactsFromDrafts`.

## Inherited Outcome Contract

- **Why:** Operators need a direct publish action on the product form; the sync panel adds friction and confusion for a simple use case.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-product Make Live button replaces sync panel; catalog is published to xa-b within 15 minutes of the first Make Live click after a cooldown window.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-uploader-publish-flow/fact-find.md`
- Key findings used:
  - `runCloudSyncPipeline` at `sync/route.ts:1074` is the reference implementation for the pipeline sequence.
  - `applyCloudMediaExistenceValidation` (sync/route.ts:462) is module-private and must be extracted to `src/lib/catalogCloudPublish.ts`.
  - `getCloudMediaHeadMaxKeys` (sync/route.ts:149) and `isAbsoluteHttpUrl` (sync/route.ts:416) are also module-private and must be co-extracted.
  - `getMediaBucket` is already in `src/lib/r2Media.ts` — importable directly.
  - `getCatalogDraftWorkflowReadiness` already returns `isPublishReady` — no new logic needed for button gating.
  - Save + publish must be a single combined route call to avoid partial-failure state (product appears "live" in uploader but not published).

## Proposed Approach

- **Chosen approach:** Combined route — `POST /api/catalog/publish` accepts `{storefront, draft}`, saves the product draft with `publishState: "live"` (inline, not via a separate products route call), then runs the full publish pipeline. The "Make Live" button calls only this one route, eliminating any partial-failure window.
  - TASK-01 extracts the private helpers to `src/lib/catalogCloudPublish.ts` before creating the new route, so both the sync route and publish route can use them.
  - TASK-05 (i18n) runs in Wave 1 parallel with TASK-01 since no code dependency exists.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract cloud media helpers + create publish route | 85% | M | Pending | - | TASK-02 |
| TASK-02 | IMPLEMENT | Client publish handler + useCatalogConsole wiring | 85% | S | Pending | TASK-01 | TASK-03, TASK-04 |
| TASK-03 | IMPLEMENT | Make Live button in CatalogProductForm; simplify StatusSelect | 85% | S | Pending | TASK-02, TASK-05 | - |
| TASK-04 | IMPLEMENT | Remove CatalogSyncPanel + fix CurrencyScreen for cloud mode | 85% | S | Pending | TASK-02 | - |
| TASK-05 | IMPLEMENT | i18n Make Live keys (EN + ZH); remove sync keys | 90% | S | Pending | - | TASK-03 |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-05 | - | No shared files; run in parallel |
| 2 | TASK-02 | TASK-01 complete | Needs publish route to exist |
| 3 | TASK-03, TASK-04 | TASK-02 complete; TASK-03 also needs TASK-05 | Different components; safe to parallelise |

## Tasks

---

### TASK-01: Extract cloud media helpers + create `POST /api/catalog/publish` route
- **Type:** IMPLEMENT
- **Deliverable:** `apps/xa-uploader/src/lib/catalogCloudPublish.ts` (new shared lib) + `apps/xa-uploader/src/app/api/catalog/publish/route.ts` (new route) + updated sync/route.ts imports + test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-07)
- **Build evidence:** Committed `ab820aa094`. `catalogCloudPublish.ts` created with 3 exported functions + 2 types. `publish/route.ts` POST handler created with full pipeline: in-memory publish state promotion → lock → snapshot merge → build catalog → media validation (warn) → publish contract → write-back → deploy hook. TC-01–TC-06 tests added. sync/route.ts updated to import from new lib (unused `_getCloudMediaHeadMaxKeys`/`_isAbsoluteHttpUrl` aliases removed). TypeScript + lint clean.
- **Affects:**
  - `apps/xa-uploader/src/lib/catalogCloudPublish.ts` (new)
  - `apps/xa-uploader/src/app/api/catalog/publish/route.ts` (new)
  - `apps/xa-uploader/src/app/api/catalog/publish/__tests__/route.publish.test.ts` (new)
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts` (modify: replace inline helpers with imports from catalogCloudPublish)
  - `[readonly] apps/xa-uploader/src/lib/r2Media.ts`
  - `[readonly] apps/xa-uploader/src/lib/deployHook.ts`
  - `[readonly] apps/xa-uploader/src/lib/catalogDraftToContract.ts`
  - `[readonly] apps/xa-uploader/src/lib/catalogContractClient.ts`
  - `[readonly] apps/xa-uploader/src/lib/catalogDraftContractClient.ts`
- **Depends on:** -
- **Blocks:** TASK-02
- **Confidence:** 85%
  - Implementation: 85% — Full pipeline traced from sync/route.ts lines 1074–1207. `applyCloudMediaExistenceValidation` (line 462), `getCloudMediaHeadMaxKeys` (line 149), `isAbsoluteHttpUrl` (line 416) all confirmed module-private. Extraction scope is clear: 3 functions + 1 type alias into new lib. `getMediaBucket` already in r2Media.ts. `CloudBuiltArtifacts` is `Awaited<ReturnType<typeof buildCatalogArtifactsFromDrafts>>` — trivially re-defined.
  - Approach: 85% — Extraction + new combined route is the correct pattern. No ambiguity in approach.
  - Impact: 85% — Route is thin composition of verified helpers; deploy hook + lock both confirmed.
- **Acceptance:**
  - `src/lib/catalogCloudPublish.ts` exports `applyCloudMediaExistenceValidation`, `getCloudMediaHeadMaxKeys`, `isAbsoluteHttpUrl`.
  - `sync/route.ts` imports these from `catalogCloudPublish` (no behavior change to sync route).
  - `POST /api/catalog/publish` accepts `{storefront: XaCatalogStorefront, draft: CatalogProductDraftInput}`.
  - Route authenticates via `hasUploaderSession`.
  - Route acquires `acquireCloudSyncLock` before pipeline; releases in finally block.
  - Route promotes the incoming draft's `publishState` to `"live"` **in memory** (no R2 write yet). Then reads all drafts via `readCloudDraftSnapshot`, merges the updated product into the snapshot, builds catalog via `buildCatalogArtifactsFromDrafts` with `mediaValidationPolicy: "warn"`, runs `applyCloudMediaExistenceValidation`. `finalizeCloudPublishStateAndDeploy` writes the promoted state back to R2 only after contract publish succeeds — matching the ordering in `runCloudSyncPipeline`.
  - Route publishes via `tryPublishCloudCatalogPayload`; on publish failure returns structured error.
  - Route calls `finalizeCloudPublishStateAndDeploy`; response includes `deployStatus`.
  - On cooldown: catalog still updated; response returns `{ok: true, deployStatus: "skipped_cooldown"}`.
  - **Expected user-observable behavior:**
    - Pressing "Make Live" starts a spinner; after ~1–3s returns success or error feedback.
    - If deploy hook fires: feedback shows "Published. Site rebuild triggered."
    - If in cooldown: feedback shows "Published. Site rebuild pending (cooldown)."
    - If publish fails: feedback shows error message with recovery hint.
- **Validation contract (TC-01–TC-06):**
  - TC-01: Valid draft + configured contract → `{ok: true, deployStatus: "triggered"}` (200)
  - TC-02: Valid draft + in cooldown → `{ok: true, deployStatus: "skipped_cooldown"}` (200); catalog written to R2
  - TC-03: Catalog publish fails (502 from contract) → `{ok: false, error: "catalog_publish_failed"}` (502)
  - TC-04: Lock already held → route returns `{ok: false, error: "sync_locked"}` (409) or waits and proceeds (match existing lock behavior)
  - TC-05: Not authenticated → 404 (same as sync route)
  - TC-06: Missing cloud images (warn policy) → `{ok: true, warnings: [...]}` still publishes; no error response
- **Execution plan:**
  - Red: write failing tests (TC-01–TC-06) for new route; confirm they fail (route doesn't exist yet).
  - Green: create `catalogCloudPublish.ts` with extracted helpers; update sync/route.ts to import; create publish/route.ts implementing the pipeline; make TC-01–TC-06 pass.
  - Refactor: ensure sync/route.ts tests still pass (no behavior change); confirm `catalogCloudPublish.ts` is typed correctly with no `any`.
- **Planning validation (required for M):**
  - Checks run: Read sync/route.ts lines 149, 414–562, 1074–1207; confirmed private helper functions and their dependencies; confirmed `getMediaBucket` is in r2Media.ts; confirmed lock is acquired in POST handler not in runCloudSyncPipeline; confirmed `finalizeCloudPublishStateAndDeploy` signature at line 995.
  - Validation artifacts: fact-find.md evidence audit + this plan's key findings.
  - Unexpected findings: `getCloudMediaHeadMaxKeys` is a simple env-var-backed function (line 149); trivially extracted. `isAbsoluteHttpUrl` is a one-liner; trivially extracted.
- **Consumer tracing:**
  - New export `applyCloudMediaExistenceValidation` consumed by: sync/route.ts (updated to import), new publish/route.ts. No other consumers.
  - New route `POST /api/catalog/publish` consumed by: `handlePublishImpl` in TASK-02. No other consumers at this stage.
  - Modified: sync/route.ts — behavior unchanged; existing sync route tests must still pass after extraction.
- **Scouts:**
  - Verify `CloudBuiltArtifacts` type alias is only used locally; no external consumers that would break when moved.
- **Edge Cases & Hardening:**
  - In-memory `publishState: "live"` promotion happens by merging the incoming draft into the snapshot before `buildCatalogArtifactsFromDrafts`. No pre-publish R2 write. If the downstream contract publish fails, `finalizeCloudPublishStateAndDeploy` is not called and R2 is not modified — failure is clean.
  - If `applyCloudMediaExistenceValidation` returns `{ok: false}` with policy `"warn"`, treat it as a pass with warnings (policy is always "warn" in the publish route).
  - Deploy hook unconfigured → route still returns `{ok: true, deployStatus: "skipped_unconfigured"}`; no error.
- **What would make this >=90%:** Confirm `catalogDraftContractClient.ts:314` and `:372` are the only lock entry points needed and no wrapping utility exists.
- **Rollout / rollback:**
  - Rollout: New route is additive; no existing route is removed. Sync route behavior unchanged.
  - Rollback: Revert TASK-01 commits; publish route removed; sync route returns to original state.
- **Documentation impact:** None: operator tool, internal only.
- **Notes / references:**
  - `sync/route.ts:149` — `getCloudMediaHeadMaxKeys`
  - `sync/route.ts:414` — `CloudBuiltArtifacts` type alias
  - `sync/route.ts:416` — `isAbsoluteHttpUrl`
  - `sync/route.ts:462` — `applyCloudMediaExistenceValidation`
  - `sync/route.ts:995` — `finalizeCloudPublishStateAndDeploy`
  - `sync/route.ts:1074` — `runCloudSyncPipeline` (reference implementation; do not extract)
  - `src/lib/r2Media.ts` — `getMediaBucket` already exported here
  - `catalogDraftContractClient.ts:314` — `acquireCloudSyncLock`
  - `catalogDraftContractClient.ts:372` — `releaseCloudSyncLock`

---

### TASK-02: Client publish handler + useCatalogConsole wiring
- **Type:** IMPLEMENT
- **Deliverable:** Updated `catalogConsoleActions.ts` (new `handlePublishImpl`) + updated `useCatalogConsole.client.ts` (new `handlePublish`, remove sync handlers/state from public API)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Build evidence:** Committed `65bbeca9f2`. `PublishResult` type and `handlePublishImpl` added to `catalogConsoleActions.ts`. `useCatalogPublishHandlers` wired into `useCatalogConsole` public API. TC-01/TC-02/TC-03 tests added. Sync API cleanup deferred to TASK-04 (removing props while CatalogConsole.client.tsx still consumes them would break TypeScript; folded into TASK-04 scope).
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` (update/add publish tests)
  - `[readonly] apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-03, TASK-04
- **Confidence:** 85%
  - Implementation: 90% — `handleSaveImpl` pattern (line 310) directly reusable for `handlePublishImpl`. Fetch to new route; parse response; update feedback with `deployStatus`.
  - Approach: 90% — Well-established pattern in this codebase.
  - Impact: 85% — `handlePublish` exposed on useCatalogConsole return object; consumed by CatalogProductForm in TASK-03.
- **Acceptance:**
  - `handlePublishImpl` exported from `catalogConsoleActions.ts`. Accepts `{draft, storefront, t, busyLockRef, setBusy, setActionFeedback}`. Returns `PublishResult` type.
  - On success with deploy triggered: calls `updateActionFeedback` with success message including deploy status.
  - On success with cooldown: success message reflects cooldown ("Rebuild pending").
  - On error: error feedback surfaced; busy lock released.
  - `useCatalogConsole` public API exposes `handlePublish`; removes `handleSync`, `handleRefreshSyncReadiness`, `syncOptions`, `setSyncOptions`, `syncOutput`, `lastSyncData` from return object.
  - `syncReadiness` may be retained in internal state only (used internally to decide storefront config); it is removed from the public API.
- **Validation contract (TC-01–TC-03):**
  - TC-01: Successful publish with deploy triggered → success feedback with deploy message; `loadCatalog` called to refresh
  - TC-02: Publish returns cooldown → success feedback with cooldown message
  - TC-03: Publish returns error → error feedback; busy lock released; no crash
- **Execution plan:**
  - Red: Add failing test for `handlePublishImpl` success + error cases.
  - Green: Implement `handlePublishImpl` in catalogConsoleActions; add `PublishResult` type; wire `handlePublish` into `useCatalogConsole`; remove sync state from public return object.
  - Refactor: Remove `handleSyncImpl` and `SyncActionResult` export if no longer needed. Update imports.
- **Planning validation:** None required (S effort).
- **Consumer tracing:**
  - `handlePublish` on useCatalogConsole → consumed by `CatalogProductForm` in TASK-03 via `state.handlePublish`.
  - Removing `handleSync` from public API → currently consumed by `CurrencyScreen` (`onSync={state.handleSync}`) and `CatalogSyncPanel` — both removed in TASK-04. Safe to remove after TASK-04.
  - **Ordering note:** TASK-02 removes sync state from public API. TASK-04 removes the consumers. Do not mark TASK-02 as depending on TASK-04 — TASK-02 changes the API, TASK-04 removes the UI consumers. TypeScript will compile because TASK-04 deletes the consuming component. Order: TASK-02 → TASK-04 (TASK-04 depends on TASK-02 completing removal of sync state).
- **Scouts:** Verify `CurrencyRatesPanel` receives `onSync` — if so, update signature in TASK-04. Check `syncReadiness` usage in state internals (may be needed for storefront mode detection even after removal from public API).
- **Edge Cases & Hardening:** `handlePublishImpl` must call `endBusyAction` in a `finally` block to avoid stuck busy state on error.
- **What would make this >=90%:** Confirm `CurrencyRatesPanel` does not call `onSync` (then `handleSync` removal is fully clean with no hidden consumers).
- **Rollout / rollback:** Rollback: revert TASK-02 commits; useCatalogConsole returns to previous API.
- **Documentation impact:** None.
- **Notes / references:**
  - `catalogConsoleActions.ts:310` — `handleSaveImpl` pattern to follow
  - `useCatalogConsole.client.ts:833` — `useCatalogConsole` return object to update
  - `useCatalogConsole.client.ts:810` — `handleSync` to remove

---

### TASK-03: Make Live button in CatalogProductForm; simplify StatusSelect
- **Type:** IMPLEMENT
- **Deliverable:** Updated `CatalogProductForm.client.tsx` (new button) + updated `CatalogProductBaseFields.client.tsx` (simplified StatusSelect)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Build evidence:** Committed `8cde80254f`. `onPublish?: () => Promise<void>` prop added to `CatalogProductForm`. Conditional "Make Live" button renders when `readiness.isPublishReady === true`. "live" option removed from `StatusSelect`. TC-01–TC-04 tests added. TypeScript + lint clean.
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx`
  - `[readonly] packages/lib/src/xa/catalogWorkflow.ts`
  - `[readonly] apps/xa-uploader/src/lib/uploaderI18n.ts` (keys added in TASK-05)
- **Depends on:** TASK-02, TASK-05
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — Button area at `CatalogProductForm.client.tsx:374` is clean. `isPublishReady` already computed in form state via `getCatalogDraftWorkflowReadiness`. `StatusSelect` at `CatalogProductBaseFields.client.tsx:690` needs "live" option removed.
  - Approach: 90% — Conditional button render alongside existing Save button; prop `onPublish` pattern.
  - Impact: 85% — Operator-visible; straightforward conditional UI.
- **Acceptance:**
  - "Make Live" button appears in the action bar when `readiness.isPublishReady === true`.
  - "Make Live" button is absent (not just disabled) when `isPublishReady === false`.
  - "Save as Draft" button always present.
  - Pressing "Make Live" calls `onPublish?.()` (optional chain; prop is wired by TASK-04 — marking it optional avoids a TypeScript error during Wave 3 parallel build); button shows loading/busy state while request is in flight.
  - Publish success feedback appears in the form (success message with deploy status).
  - Publish error feedback appears inline (error message).
  - `StatusSelect` retains `draft` and `out_of_stock` options only; "live" option removed.
  - **Expected user-observable behavior:**
    - Product with complete data + image: two buttons visible — "Save as Draft" and "Make Live".
    - Product incomplete: only "Save as Draft" visible.
    - Clicking "Make Live": both buttons disabled during in-flight request; feedback message appears below buttons after completion.
    - After Make Live success: form returns to normal; operator can continue editing.
- **Validation contract (TC-01–TC-04):**
  - TC-01: `isPublishReady = true` → "Make Live" button renders with correct i18n label
  - TC-02: `isPublishReady = false` → "Make Live" button absent from DOM
  - TC-03: `onPublish` prop called when "Make Live" clicked
  - TC-04: StatusSelect renders `draft` and `out_of_stock` options only; no `live` option
- **Execution plan:**
  - Red: Add tests asserting "Make Live" button visibility based on `isPublishReady`; assert StatusSelect has no "live" option.
  - Green: Add "Make Live" button to `CatalogProductForm`; accept `onPublish` prop; update `CatalogProductBaseFields` to remove "live" option.
  - Refactor: Ensure button classes use design system tokens (gate-accent, min-h-11, etc.); verify `eslint-disable ds/no-hardcoded-copy` annotations for test-ids per XAUP-0001 pattern.
- **Planning validation:** None required (S effort).
- **Post-build QA loop:**
  - Run `lp-design-qa` on `CatalogProductForm.client.tsx` and `CatalogProductBaseFields.client.tsx`.
  - Run `tools-ui-contrast-sweep` on the form at the `/xa-uploader` route.
  - Run `tools-ui-breakpoint-sweep` on the form at mobile and desktop breakpoints.
  - Auto-fix all Critical/Major findings and re-run until clean. Minor findings may be deferred with explicit rationale.
- **Consumer tracing:**
  - New `onPublish` prop on `CatalogProductForm` → caller is `ProductEditor` in `CatalogConsole.client.tsx` (TASK-04 connects it). Note: TASK-03 adds the prop; TASK-04 wires it. TypeScript will require TASK-04 to pass the prop once added to TASK-03 — these two tasks must coordinate. Resolution: mark `onPublish` as optional `onPublish?: () => void` in TASK-03 to avoid a TypeScript error before TASK-04 wires it; TASK-04 makes it required by passing the handler.
- **Scouts:** Confirm `CatalogProductForm` receives readiness state as a prop or computes it internally — must pass `isPublishReady` correctly.
- **Edge Cases & Hardening:** If `busy === true` (any in-flight action), "Make Live" button must also be disabled to prevent double-publish.
- **What would make this >=90%:** Confirm no other consumers read `publishState === "live"` from StatusSelect in a way that would break when the option is removed from the UI.
- **Rollout / rollback:** Rollback: revert TASK-03 commits; form returns to single button.
- **Documentation impact:** None.
- **Notes / references:**
  - `CatalogProductForm.client.tsx:374` — button area
  - `CatalogProductBaseFields.client.tsx:690` — StatusSelect
  - `packages/lib/src/xa/catalogWorkflow.ts:88` — `isPublishReady` definition

---

### TASK-04: Remove CatalogSyncPanel + fix CurrencyScreen for cloud mode
- **Type:** IMPLEMENT
- **Deliverable:** Updated `CatalogConsole.client.tsx` + deleted `CatalogSyncPanel.client.tsx` + updated `CurrencyScreen` to show `CurrencyRatesPanel` unconditionally
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Build evidence:** Committed `077c08d02f`. `CatalogSyncPanel.client.tsx` deleted. `CatalogConsole.client.tsx`: CurrencyScreen renders `CurrencyRatesPanel` unconditionally (mode guard removed); header label always `screenCurrencyRates`; `onPublish` wired from `state.handlePublish` into `ProductEditor`. `CatalogProductForm`: `onPublish` broadened to `() => Promise<unknown>` for type compat. `useCatalogConsole` public return: `syncOptions`, `setSyncOptions`, `syncOutput`, `lastSyncData`, `refreshSyncReadiness` removed; `syncReadiness` and `handleSync` kept (required by CurrencyRatesPanel). Extinct `sync-feedback` tests removed. `uploaderI18n.ts`: 10 orphaned sync-panel keys removed from EN + ZH. TypeScript + lint clean.
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx` (delete)
  - `[readonly] apps/xa-uploader/src/components/catalog/CurrencyRatesPanel.client.tsx`
- **Depends on:** TASK-02
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — CatalogConsole.client.tsx:100–134 shows CurrencyScreen renders CurrencyRatesPanel only when `syncReadiness.mode === "local"`. Cloud mode operators would see an empty currency screen after sync panel deletion — must fix by removing the mode guard. Deletion of CatalogSyncPanel.client.tsx is straightforward.
  - Approach: 90% — Remove file; remove wiring; fix guard condition.
  - Impact: 85% — Currency screen becomes useful for cloud operators; sync panel gone.
- **Acceptance:**
  - `CatalogSyncPanel.client.tsx` deleted; no import of it remains.
  - `CurrencyScreen` renders `CurrencyRatesPanel` regardless of `syncReadiness.mode` (remove the `showCurrencyRates` condition).
  - `ConsoleBody` no longer renders sync panel; layout shows only product editor in the main area.
  - Header currency toggle remains present and opens the currency screen when `uploaderMode === "internal"`.
  - `ProductEditor` in `ConsoleBody` receives `onPublish` wired from `state.handlePublish` (connecting TASK-03's prop to TASK-02's handler).
  - `CatalogConsole` no longer spreads `syncOptions`, `setSyncOptions`, `syncOutput`, `lastSyncData` into state/props.
  - Extinct tests that assert `CatalogSyncPanel` renders or `handleSync` is called — removed or updated.
  - **Expected user-observable behavior:**
    - Opening currency screen shows `CurrencyRatesPanel` for both local and cloud mode operators.
    - No sync panel, no sync options, no "Run Sync" button visible anywhere.
    - Currency toggle button in header still works.
- **Validation contract (TC-01–TC-03):**
  - TC-01: `CatalogConsole` renders without `CatalogSyncPanel` in the DOM
  - TC-02: Currency screen renders `CurrencyRatesPanel` regardless of `syncReadiness.mode`
  - TC-03: No TypeScript errors from removed sync props (if any were prop-typed)
- **Execution plan:**
  - Red: Add test asserting `CatalogSyncPanel` is absent from rendered `CatalogConsole`.
  - Green: Remove `CatalogSyncPanel` import and usage; remove `showCurrencyRates` condition in `CurrencyScreen`; wire `onPublish={state.handlePublish}` into `ProductEditor`; delete `CatalogSyncPanel.client.tsx`.
  - Refactor: Remove any dead imports; clean up unused state fields from `useCatalogConsole` public return (already started in TASK-02 — verify completeness).
- **Planning validation:** None required (S effort).
- **Post-build QA loop:**
  - Run `lp-design-qa` on `CatalogConsole.client.tsx` at the `/xa-uploader` route.
  - Run `tools-ui-breakpoint-sweep` on the currency screen at mobile and desktop breakpoints.
  - Auto-fix Critical/Major findings and re-run until clean.
- **Scouts:** Confirm `CurrencyRatesPanel` signature — does it accept `onSync`? If so, remove that prop since handleSync is gone.
- **Edge Cases & Hardening:** After deletion of `CatalogSyncPanel.client.tsx`, run TypeScript typecheck scoped to xa-uploader to confirm no remaining import errors.
- **What would make this >=90%:** Confirm `CurrencyRatesPanel` does not call `onSync` internally.
- **Rollout / rollback:** Rollback: revert TASK-04; CatalogSyncPanel restored.
- **Documentation impact:** None.
- **Notes / references:**
  - `CatalogConsole.client.tsx:100–134` — `CurrencyScreen` component to update
  - `CatalogConsole.client.tsx:105` — `showCurrencyRates` guard to remove
  - `CatalogConsole.client.tsx:118–131` — `CatalogSyncPanel` usage to remove

---

### TASK-05: i18n — add Make Live keys (EN + ZH); remove orphaned sync keys
- **Type:** IMPLEMENT
- **Deliverable:** Updated `apps/xa-uploader/src/lib/uploaderI18n.ts` with new keys and removed sync-panel-specific keys
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-07)
- **Build evidence:** 7 new keys added to EN and ZH objects in `uploaderI18n.ts`. Orphaned sync key removal deferred to TASK-04 (CatalogSyncPanel still exists; removing keys now would break TypeScript). All new keys present and ZH translations confirmed.
- **Affects:**
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 95% — Pattern fully established; just add key-value pairs to EN and ZH objects.
  - Approach: 95% — No ambiguity.
  - Impact: 90% — Required for TASK-03 button labels to render; removal of sync keys cleans up i18n file.
- **Acceptance:**
  - New keys in both EN and ZH: `makeLive`, `makeLiveSuccess`, `makeLiveSuccessCooldown`, `makeLiveSuccessUnconfigured`, `makeLiveFailed`, `publishStatusTriggered`, `publishStatusSkipped`.
  - Orphaned sync-panel keys removed: all `syncStatus*`, `syncWarnings*`, `screenSync`, and sync-only feedback messages (`syncFailed`, `syncSucceeded*`, `syncBlockedAutosavePending`) that are only referenced by `CatalogSyncPanel` (which is deleted in TASK-04).
  - Keys referenced by `CurrencyRatesPanel` or other retained components must NOT be removed.
  - `UploaderMessageKey` type (if derived from the messages object) updates automatically via TypeScript inference.
  - **Expected user-observable behavior:** "Make Live" button label shows correct text in EN and ZH.
- **Validation contract (TC-01–TC-02):**
  - TC-01: `getUploaderMessage("en", "makeLive")` returns non-empty string
  - TC-02: `getUploaderMessage("zh", "makeLive")` returns non-empty string
- **Execution plan:**
  - Red: Add test asserting new keys exist in both locales.
  - Green: Add new key-value pairs; remove identified orphaned keys; verify `UploaderMessageKey` type still compiles.
  - Refactor: Grep for any remaining references to removed keys; confirm zero references in non-deleted files.
- **Planning validation:** None required (S effort).
- **Consumer tracing:**
  - New keys consumed by: `CatalogProductForm` in TASK-03 (`t("makeLive")`, `t("makeLiveSuccess")`, etc.).
  - Removed keys were only consumed by `CatalogSyncPanel.client.tsx` (deleted in TASK-04). Verify via grep before removing each key.
- **Scouts:** Before removing any key, `grep -r '"<key>"' apps/xa-uploader/src/` to confirm no remaining consumers.
- **Edge Cases & Hardening:** If any retained component uses a key targeted for removal, keep the key and note it in commit message.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:** Rollback: revert TASK-05 commits; i18n returns to previous state.
- **Documentation impact:** None.
- **Notes / references:**
  - `apps/xa-uploader/src/lib/uploaderI18n.ts:25–83` — existing sync keys to audit

---

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract helpers + publish route | Yes | None — `getMediaBucket` confirmed in r2Media.ts; lock functions confirmed in `catalogDraftContractClient.ts:314,372`; all 3 private functions located. | No |
| TASK-02: Client publish handler | Yes — TASK-01 route exists | None — `handleSaveImpl` pattern at line 310 is directly reusable. `handleSync` removal safe after TASK-04 removes consumers. | No |
| TASK-03: Make Live button | Yes — TASK-02 handler exists; TASK-05 i18n keys exist | [Type contract gap, Minor]: `onPublish` prop added to CatalogProductForm; caller (CatalogConsole via ProductEditor) does not yet pass it until TASK-04. Resolution: mark prop optional in TASK-03 (mitigates TypeScript error); TASK-04 wires it as required. | No (documented in task) |
| TASK-04: Console cleanup | Yes — TASK-02 handler exists; sync consumers identified | [Missing data dependency, Moderate]: `CurrencyRatesPanel` may accept `onSync` prop from `CurrencyScreen`. Must verify and remove in TASK-04; if not, no action needed. Scout added to TASK-04. | No (scout added) |
| TASK-05: i18n keys | Yes — no dependencies | None — standalone file edit; grep guard prevents orphaned-key removal from active consumers. | No |

## Risks & Mitigations
- **`applyCloudMediaExistenceValidation` extraction breaks sync route behavior:** Mitigate — sync route tests (route.cloud-publish.test.ts, route.test.ts) must pass unchanged after TASK-01. Refactor step in TASK-01 explicitly verifies this.
- **`CurrencyRatesPanel` uses `onSync` prop:** Mitigate — TASK-04 scout; if present, remove from CurrencyRatesPanel call site when `handleSync` is gone.
- **Save-before-publish partial failure:** Eliminated by design — combined route saves + publishes in one atomic server-side operation.
- **Sync tests become extinct:** TASK-04 removes them explicitly; TASK-01 refactor step verifies sync route tests still pass.
- **`onPublish` prop timing (TASK-03 before TASK-04):** Mitigated by marking prop optional in TASK-03 implementation.

## Observability
- Make Live response surfaces `deployStatus` (`triggered` / `skipped_cooldown` / `skipped_unconfigured` / `failed`) so operator sees exactly what happened.
- Existing KV-based deploy pending state continues to work for reconciliation.
- No new logging or metrics infrastructure needed.

## Acceptance Criteria (overall)
- [ ] "Make Live" button appears when product has valid data + at least one image; absent otherwise.
- [ ] Pressing "Make Live" calls `POST /api/catalog/publish`; feedback shows deploy status.
- [ ] Subsequent Make Live presses during 15-minute cooldown update the catalog in R2; only the deploy trigger is debounced.
- [ ] Sync panel and "Sync" screen toggle are absent from the UI.
- [ ] Currency Rates screen accessible via header button and renders `CurrencyRatesPanel` in both local and cloud mode.
- [ ] All new strings present in EN and ZH; orphaned sync-only i18n keys removed.
- [ ] New publish route tests pass in CI (TC-01–TC-06).
- [ ] Sync route tests continue to pass after TASK-01 extraction.
- [ ] TypeScript typecheck clean for xa-uploader package.

## Decision Log
- 2026-03-07: Combined route approach chosen (save + publish in one call) to avoid partial-failure window. Alternative (two-step client-side: save then publish) rejected.
- 2026-03-07: `applyCloudMediaExistenceValidation` must be included in publish route per critique finding (1-01). Extraction to `catalogCloudPublish.ts` chosen over duplication.
- 2026-03-07: `onPublish` prop marked optional in TASK-03 to allow Wave 3 parallel execution with TASK-04.
- 2026-03-07: `CurrencyRatesPanel` guard (`syncReadiness.mode === "local"`) removed in TASK-04 so cloud-mode operators can access currency rates.

## Overall-confidence Calculation
- TASK-01: 85% × 2 (M) = 170
- TASK-02: 85% × 1 (S) = 85
- TASK-03: 85% × 1 (S) = 85
- TASK-04: 85% × 1 (S) = 85
- TASK-05: 90% × 1 (S) = 90
- Total weight: 6
- Overall-confidence = (170+85+85+85+90) / 6 = 515/6 = **85.8% → 85%**

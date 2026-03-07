---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-03-07
Last-updated: 2026-03-07
Feature-Slug: xa-uploader-publish-flow
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-publish-flow/plan.md
Trigger-Why: Operators cannot publish a single product to the live storefront without running a full sync operation. The sync panel is a confusing secondary screen with expert-level options. The desired flow is: edit product → Save as Draft / Make Live — two buttons, one intent.
Trigger-Intended-Outcome: type: operational | statement: Replace the sync panel with per-product Save as Draft / Make Live buttons; new lightweight publish route publishes the full catalog to the contract endpoint and triggers a xa-b rebuild (respecting the existing 15-minute deploy cooldown) | source: operator
---

# XA-Uploader Publish Flow Fact-Find

## Scope

### Summary

Replace the "Sync" panel and its hidden screen in xa-uploader with a simpler per-product publish flow. When a product has a main image and all required data fields, the form shows both "Save as Draft" and "Make Live" buttons. Pressing "Make Live" saves the product with `publishState = "live"`, builds the catalog payload from all cloud drafts, publishes it to the catalog contract, and fires the deploy hook — reusing the existing 15-minute cooldown debounce.

### Goals
- Single-click publish: "Make Live" saves + publishes + triggers xa-b rebuild in one action.
- "Save as Draft" remains always available (gated by nothing).
- "Make Live" appears only when `readiness.isPublishReady` (data valid + at least one image).
- Subsequent "Make Live" presses during the 15-minute cooldown still update the catalog on R2 (the next rebuild picks up all changes); only the deploy trigger is debounced.
- Remove the Sync panel and sync screen toggle entirely.
- Keep the Currency Rates screen (separate concern, unrelated to this flow).

### Non-goals
- Changing the xa-b build/deploy infrastructure.
- Inventory/stock management (out_of_stock state management is retained as a field option but not a button).
- Local filesystem / CSV sync path (already dead-ended for cloud operators; can be removed in a follow-up).
- Replacing the 15-minute cooldown with a shorter or longer window.

### Constraints & Assumptions
- Constraints:
  - Must work within Cloudflare free tier (Workers: 100k req/day; R2: 1M writes/month; Pages: 500 builds/month). The 15-min cooldown caps builds at ~96/day max; normal operator usage is far lower.
  - Cloud sync mode only (`XA_CATALOG_CONTRACT_BASE_URL` configured). The local filesystem / CSV sync path is out of scope.
  - Existing `acquireCloudSyncLock` / `releaseCloudSyncLock` must be used to prevent concurrent publish corruption.
- Assumptions:
  - All active operators use cloud draft mode (not local CSV sync). Verified: `runCloudSyncPipeline` is the path used when the contract is configured.
  - Currency rates are read internally by `buildCatalogArtifactsFromDrafts` via `parseCloudCurrencyRates()` — no changes needed to rate management.
  - The `StatusSelect` dropdown (draft/live/out_of_stock) in `CatalogProductBaseFields` can be removed for the "live" value; "Make Live" button replaces it. "Out of stock" still needs a mechanism — recommend keeping a simplified status field for out_of_stock only, or keeping the select with "draft" and "out_of_stock" options only.

## Outcome Contract

- **Why:** Operators need a direct publish action on the product form; the sync panel adds friction and confusion for a simple use case.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Per-product Make Live button replaces sync panel; catalog is published to xa-b within 15 minutes of the first Make Live click after a cooldown window.
- **Source:** operator

## Access Declarations

None — all required data is in the repository. The catalog contract endpoint (`XA_CATALOG_CONTRACT_BASE_URL`) and deploy hook (`XA_B_DEPLOY_HOOK_URL`) are external, but they are already wired in the existing sync route and require no new access.

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx:374` — bottom action bar, currently one "Save as Draft" button; entry point for new "Make Live" button.
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:147` — `CurrencyScreen` renders `CatalogSyncPanel` here; this screen toggle is the entry point to remove.
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — POST handler; `runCloudSyncPipeline` (line 1074) is the cloud-only publish pipeline to extract/reuse in the new publish route.
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts:548` — `handleSyncImpl`; client-side sync orchestrator to remove.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts:810` — `handleSync` wired into state; to be replaced with `handlePublish`.

### Key Modules / Files

- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — form UI; add "Make Live" button, `onPublish` prop, publish feedback state. **Modify.**
- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — remove sync screen toggle and `CurrencyScreen` → `CatalogSyncPanel` wiring. Retain `CurrencyRatesPanel`. **Modify.**
- `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx` — remove entirely. **Delete.**
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — remove `handleSyncImpl`; add `handlePublishImpl`. **Modify.**
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — remove sync state/options; add publish handler. **Modify.**
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — do not extract `runCloudSyncPipeline` (extracting it requires constructing a full `SyncPayload` with option fields — unnecessary coupling). Instead, TASK-01 calls the underlying helpers directly in order: `readCloudDraftSnapshot` → `buildCatalogArtifactsFromDrafts` → `applyCloudMediaExistenceValidation` → `tryPublishCloudCatalogPayload` → `finalizeCloudPublishStateAndDeploy`. **Read-only reference; do not modify.**
- `apps/xa-uploader/src/lib/deployHook.ts` — unchanged; `maybeTriggerXaBDeploy` already handles cooldown. **Read-only.**
- `apps/xa-uploader/src/lib/catalogDraftToContract.ts` — unchanged; `buildCatalogArtifactsFromDrafts` builds the payload. **Read-only.**
- `apps/xa-uploader/src/lib/catalogContractClient.ts` — unchanged; `publishCatalogPayloadToContract` does the PUT. **Read-only.**
- `apps/xa-uploader/src/lib/uploaderI18n.ts` — add `makeLive`, `makeLiveSuccess*`, `makeLiveFailed` keys for both EN and ZH. **Modify.**

### Patterns & Conventions Observed

- All client actions are orchestrated through `handleXxxImpl` functions in `catalogConsoleActions.ts`, called by `useCatalogConsole.client.ts`. Follow this pattern for `handlePublishImpl`.
- Server routes use `acquireCloudSyncLock` / `releaseCloudSyncLock` for mutual exclusion on R2 draft writes. New publish route must do the same.
- `SaveResult` type (`catalogConsoleActions.ts:37`) defines the return contract for save operations — extend with a `publishResult` field or add a separate `PublishResult` type.
- All API routes under `/api/catalog/` use `hasUploaderSession` for auth.
- Feedback is surfaced via `updateActionFeedback` with `kind: "success" | "error"` and a message string.
- I18n: all user-facing strings go through `useUploaderI18n` / `uploaderI18n.ts`; both EN and ZH entries are required.

### Data & Contracts

- Types/schemas/events:
  - `CatalogProductDraftInput` (`@acme/lib/xa/catalogAdminSchema`) — draft shape; `publishState: "draft" | "live" | "out_of_stock"`.
  - `CatalogDraftWorkflowReadiness` (`packages/lib/src/xa/catalogWorkflow.ts:9`) — `isDataReady`, `isPublishReady`, `hasImages`. Drives button gating.
  - `DeployTriggerResult` (`apps/xa-uploader/src/lib/deployHook.ts:17`) — `status: "triggered" | "skipped_cooldown" | "skipped_unconfigured" | "failed"`.
  - `DeployPendingState` (`deployHook.ts:26`) — persisted in KV; read after publish to return cooldown info to client.
- Persistence:
  - Cloud drafts: R2 via xa-drop-worker, read/written by `readCloudDraftSnapshot` / `writeCloudDraftSnapshot`.
  - Cooldown state: Cloudflare KV (production) or local filesystem (dev), managed by `maybeTriggerXaBDeploy`.
  - Catalog contract: R2 bucket written by `publishCatalogPayloadToContract` via `XA_CATALOG_CONTRACT_BASE_URL`.
- API/contracts:
  - New route: `POST /api/catalog/publish` — body `{storefront: XaCatalogStorefront}`. The route saves the current product draft with `publishState = "live"` AND publishes the catalog in a single call (combined approach), to avoid a partial-failure window where the product appears live in the uploader but has not been published to the storefront.
  - Existing route: `POST /api/catalog/sync` — retained for the local CSV path, but not called from the new UI flow.
  - Catalog contract write endpoint: `XA_CATALOG_CONTRACT_BASE_URL` + `XA_CATALOG_CONTRACT_WRITE_TOKEN`.
  - Deploy hook: `XA_B_DEPLOY_HOOK_URL` + `XA_B_DEPLOY_HOOK_TOKEN`.

### Dependency & Impact Map

- Upstream dependencies:
  - `readCloudDraftSnapshot(storefrontId)` — reads all products from R2.
  - `buildCatalogArtifactsFromDrafts({storefront, products, strict: false, mediaValidationPolicy})` — builds catalog + media index; reads currency rates internally via `parseCloudCurrencyRates()`. Hard-code `mediaValidationPolicy: "warn"` in the new route.
  - `applyCloudMediaExistenceValidation({artifacts, policy})` — validates that cloud-hosted images actually exist before publishing; can modify the artifacts object; runs at `sync/route.ts:1129`. **Must be included in TASK-01** — omitting it would publish a catalog with dangling image references.
  - `tryPublishCloudCatalogPayload({storefrontId, startedAt, payload})` — error-handling wrapper around `publishCatalogPayloadToContract`; handles unconfigured vs failed cases.
  - `finalizeCloudPublishStateAndDeploy({storefrontId, snapshot, publishableProducts, kv, warnings})` — promotes publish states via `writeCloudDraftSnapshot`, fires `maybeTriggerXaBDeploy`, reconciles deploy pending state via `reconcileDeployPendingState`.
- Implementation approach: call underlying helpers directly (above sequence) rather than extracting `runCloudSyncPipeline`. Extracting that function requires constructing a full `SyncPayload` with option fields — unnecessary coupling for a single-purpose publish route.
- Downstream dependents:
  - xa-b static build (triggered by deploy hook → GitHub Actions `xa-b-redeploy.yml` → fetches catalog from contract URL → rebuilds).
  - `CatalogConsole.client.tsx` — consumes `handlePublish` from `useCatalogConsole`.
  - `CatalogProductForm.client.tsx` — renders "Make Live" button when `isPublishReady`.
- Likely blast radius:
  - **Removed**: `CatalogSyncPanel.client.tsx`, `handleSyncImpl`, sync-related state in `useCatalogConsole`, ~30 sync-specific i18n keys.
  - **Modified**: `CatalogProductForm` (new button + prop), `CatalogConsole` (screen toggle removal), `useCatalogConsole` (new handler), `catalogConsoleActions` (new impl), `uploaderI18n.ts` (new + removed keys).
  - **Added**: `POST /api/catalog/publish` route + test file.
  - `StatusSelect` in `CatalogProductBaseFields`: retain with `draft` and `out_of_stock` options only; remove `live` option (Make Live button is the canonical path to set live state).

### Test Landscape

#### Test Infrastructure
- Frameworks: Jest (governed runner), React Testing Library (for client components), MSW/mocks for fetch.
- Commands: `pnpm --filter scripts startup-loop:test` (governed). Tests run in CI only per `docs/testing-policy.md`.
- CI integration: `test.yml` and `reusable-app.yml`.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Sync route (cloud publish) | Unit | `sync/__tests__/route.cloud-publish.test.ts` | 4 tests: cloud publish 502, live+OOS build, finalize fail continues deploy |
| Sync route (full) | Unit | `sync/__tests__/route.test.ts`, `route.branches.test.ts` | Extensive; covers sync pipeline, CSV guards, deploy hook |
| Save/draft action | Unit | `catalogConsoleActions` tests (inferred from action-feedback.test.tsx) | Covers save impl, feedback states |
| CatalogProductImagesFields | Unit | `__tests__/CatalogProductImagesFields.test.ts` | Image upload flow |
| Catalog contract client | Unit | `lib/__tests__/catalogContractClient.test.ts` | publish and readiness |

#### Coverage Gaps
- Untested paths:
  - New `POST /api/catalog/publish` route — no tests exist yet (route doesn't exist).
  - `handlePublishImpl` client action — no tests yet.
  - "Make Live" button rendering / gating in `CatalogProductForm` — no component tests for the new button.
- Extinct tests (when sync panel is deleted):
  - All tests that assert `CatalogSyncPanel` renders or `handleSyncImpl` is called must be updated/removed.
  - Sync-related i18n key tests (if any) — verify before deletion.

#### Testability Assessment
- Easy to test:
  - New route: follows the same mock pattern as `route.cloud-publish.test.ts` — mock `readCloudDraftSnapshot`, `buildCatalogArtifactsFromDrafts`, `applyCloudMediaExistenceValidation`, `tryPublishCloudCatalogPayload`/`publishCatalogPayloadToContract`, `finalizeCloudPublishStateAndDeploy`/`maybeTriggerXaBDeploy`.
  - `handlePublishImpl`: same pattern as `handleSyncImpl` tests.
- Hard to test:
  - End-to-end (Save + Publish atomicity) — requires integration environment; no E2E test infrastructure for xa-uploader currently.
- Test seams needed:
  - New route must accept injected mocks for `readCloudDraftSnapshot` and `publishCatalogPayloadToContract` (same pattern as existing route tests using jest.mock).

#### Recommended Test Approach
- Unit tests for: new `POST /api/catalog/publish` route (success path, cooldown path, cloud publish failure, lock contention).
- Unit tests for: `handlePublishImpl` in `catalogConsoleActions` (success, failure, busy-lock).
- Remove: sync-specific tests that covered `CatalogSyncPanel` interactions.

### Recent Git History (Targeted)
- `apps/xa-uploader/src/app/api/catalog/sync/route.ts` — recent activity includes cloud publish state promotion, deploy drain integration, draftSyncLock. The `runCloudSyncPipeline` function is stable and well-tested.
- `apps/xa-uploader/src/lib/deployHook.ts` — recently added KV support for cooldown state; now dual-mode (KV + filesystem). Stable.
- `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx` — recently rebuilt for single-page layout (TASK-01, commit `ed6dee0e34`). Button area is clean and ready for the additional button.

## Questions

### Resolved

- Q: Does the 15-minute cooldown already handle the debounce requirement?
  - A: Yes. `maybeTriggerXaBDeploy` reads a `nextEligibleAt` timestamp from KV/filesystem. If called during cooldown, it returns `{status: "skipped_cooldown"}` — the catalog payload is still written to R2, and the next successful trigger after cooldown fires the rebuild.
  - Evidence: `apps/xa-uploader/src/lib/deployHook.ts:603-666`

- Q: Does `buildCatalogArtifactsFromDrafts` require external inputs (currency rates, config)?
  - A: Currency rates are read internally via `parseCloudCurrencyRates()` on line 365 of `catalogDraftToContract.ts`. No additional params needed.
  - Evidence: `apps/xa-uploader/src/lib/catalogDraftToContract.ts:355-365`

- Q: Is the `runCloudSyncPipeline` function reusable directly?
  - A: Yes. It is already isolated within the sync route (line 1074). The new publish route can either import the underlying helpers directly (`readCloudDraftSnapshot`, `buildCatalogArtifactsFromDrafts`, `publishCatalogPayloadToContract`, `maybeTriggerXaBDeploy`) or extract `runCloudSyncPipeline` to a shared lib. The latter is cleaner. Either is feasible.
  - Evidence: `apps/xa-uploader/src/app/api/catalog/sync/route.ts:1074-1200`

- Q: Should the existing `POST /api/catalog/sync` route be deleted?
  - A: Not yet. It handles the local CSV sync path which some dev/operator workflows may still use. Keep it, but stop calling it from the UI.
  - Evidence: Sync route routes based on `syncReadiness.mode === "local"` vs `"cloud"`.

- Q: What happens to the `StatusSelect` (draft/live/out_of_stock) dropdown?
  - A: "Make Live" button replaces the need for a "live" option. Recommend: retain the select with only `draft` and `out_of_stock` options, or rename it to "Mark out of stock" toggle. Removes the confusing `live` option that required a separate sync to take effect. Decision is agent-resolvable: keep a simplified status field; the "Make Live" button is the canonical way to set `live`.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogProductBaseFields.client.tsx:690-711`

- Q: What happens to the Currency Rates screen?
  - A: Retain it. `CurrencyRatesPanel` is a separate concern (exchange rates for pricing). The header toggle becomes "Currency" only (already the label for cloud mode). The `CatalogSyncPanel` is removed from within the currency screen, not the currency rates panel itself.
  - Evidence: `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx:104-133`

- Q: Should "Make Live" also work as a "Take Offline" toggle (i.e., if `publishState === "live"`, does clicking again set it back to `"draft"` and republish)?
  - A: Make Live is one-directional. The `StatusSelect` field (retained with `draft` and `out_of_stock` options) is the mechanism for taking a product offline. No operator input required — agent-resolved based on the existing status field covering the removal use case and the low risk of one-directional behavior.
  - Evidence: Button semantics, `StatusSelect` retained for draft/out_of_stock, risk documented as low.

### Open (Operator Input Required)

None — all questions resolved.

## Rehearsal Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Button gating (`isPublishReady`) | Yes | None — logic already exists in `catalogWorkflow.ts`, read correctly in `CatalogProductForm` | No |
| New API route auth | Yes | `hasUploaderSession` pattern confirmed in all existing routes | No |
| Cloud sync lock in new route | Yes | `acquireCloudSyncLock` / `releaseCloudSyncLock` pattern is established; must be used | No |
| `buildCatalogArtifactsFromDrafts` currency rates dependency | Yes | Reads internally; no external param needed | No |
| Deploy cooldown flow when Make Live is pressed twice in 15min | Yes | Catalog is written to R2; deploy trigger skipped. On next trigger after cooldown, both products included. | No |
| `StatusSelect` dropdown ambiguity | Partial | "live" option still in the form during transition — [Minor] could confuse operators until removed | No |
| Existing sync tests becoming extinct | Yes | `route.cloud-publish.test.ts` tests `runCloudSyncPipeline` indirectly; those tests should be migrated/retained | No |
| i18n completeness | Yes | Both EN + ZH required; pattern is established in `uploaderI18n.ts` | No |

## Scope Signal

- **Signal:** right-sized
- **Rationale:** The change is bounded to the xa-uploader app (one route added, one component removed, form updated, i18n updated). All required infrastructure (cloud sync lock, catalog build, contract publish, deploy hook cooldown) already exists and is tested. No schema migrations, no external system changes, no new Cloudflare resources.

## Confidence Inputs

- **Implementation: 90%**
  - Evidence: `runCloudSyncPipeline` fully read and understood. All helper functions traced. New route is effectively a thin wrapper that calls the same sequence. Button gating via `isPublishReady` already computed.
  - What raises to >=90: Already there. Full implementation path visible.

- **Approach: 88%**
  - Evidence: Extracting `runCloudSyncPipeline` logic into a shared helper (or calling helpers directly) is the clean path. One open question (Take Offline toggle) doesn't block implementation.
  - What raises to >=90: Operator confirms the one-directional Make Live preference, allowing complete button spec.

- **Impact: 85%**
  - Evidence: xa-b is rebuilt from the catalog contract; the catalog contract is written by the new publish route. The existing xa-b-redeploy workflow is unchanged.
  - What raises to >=90: Confirm `XA_CATALOG_CONTRACT_BASE_URL` and `XA_B_DEPLOY_HOOK_URL` are correctly configured in the preview environment.

- **Delivery-Readiness: 88%**
  - All code dependencies identified and traced. One open question is non-blocking (default assumption documented). Test seams identified.
  - What raises to >=90: Operator resolves the Take Offline toggle question.

- **Testability: 85%**
  - Evidence: Existing test patterns for the sync route are directly reusable for the new route. Mock seams are established.
  - What raises to >=90: Confirm that the governed Jest runner can run new route tests without gating issues.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Race condition: two Make Live presses arrive simultaneously | Low | Medium — two concurrent R2 writes, one could clobber the other | Must use `acquireCloudSyncLock` in the new route; existing pattern |
| Currency rates not set → catalog built with missing prices | Medium | Medium — products publish without multi-currency prices | Retain existing warning behavior in `buildCatalogArtifactsFromDrafts`; no new risk |
| Deploy hook unconfigured in preview → Make Live succeeds but xa-b never rebuilds | Medium | Low — operator visible via feedback message | Surface `deployStatus` in Make Live response; show "Publish queued — no auto-rebuild configured" message |
| `out_of_stock` status loses its only UI control if StatusSelect is removed | Low | Low — recommend retaining simplified select (draft + out_of_stock only) | Addressed in Resolved questions |
| Sync-related tests not cleaned up → defunct tests pass against removed code | Low | Low — CI would still pass, but misleading | Flag extinct test cleanup as a task in the plan |
| Large catalog (many products) causes slow publish | Low | Low — `buildCatalogArtifactsFromDrafts` is synchronous in-memory; catalog is small (operator tool) | No mitigation needed at current scale |
| Save-before-publish partial failure: if Make Live saves the product (`publishState = "live"` via products route) then the publish route fails, the product is stuck showing as "live" in the uploader but not yet in the storefront | Low | Medium — misleading operator state | TASK-01 should combine save + publish in a single route call (not a two-step client-side sequence) to avoid this partial-failure window |

## Planning Constraints & Notes

- Must-follow patterns:
  - New route must use `hasUploaderSession` for auth.
  - New route must use `acquireCloudSyncLock` / `releaseCloudSyncLock`.
  - All strings via `uploaderI18n.ts` (EN + ZH both required).
  - New route tests must mock `readCloudDraftSnapshot`, `buildCatalogArtifactsFromDrafts`, `publishCatalogPayloadToContract`, and `maybeTriggerXaBDeploy` — same pattern as `route.cloud-publish.test.ts`.
  - `eslint-disable` comments need `-- XAUP-0001` ticket suffix per `ds/require-disable-justification` rule.
- Rollout/rollback expectations:
  - No feature flag needed; this is an internal operator tool with a single active operator.
  - Rollback: revert commits; sync panel returns. No database/R2 schema changes.
- Observability expectations:
  - Make Live response surfaces `deployStatus` (`triggered` / `skipped_cooldown` / `failed`) so operator sees exactly what happened.
  - Existing deploy pending state (KV) continues to work for reconciliation.

## Suggested Task Seeds (Non-binding)

1. **TASK-01** (IMPLEMENT): Add `POST /api/catalog/publish` route — cloud publish pipeline with auth, lock, build, contract push, deploy trigger. Tests: success, cooldown, publish failure, lock contention.
2. **TASK-02** (IMPLEMENT): Add `handlePublishImpl` to `catalogConsoleActions.ts`; wire `handlePublish` into `useCatalogConsole`. Remove `handleSyncImpl` and sync state.
3. **TASK-03** (IMPLEMENT): Update `CatalogProductForm` — add "Make Live" button (gated on `isPublishReady`), `onPublish` prop, publish feedback display. Simplify `StatusSelect` to draft + out_of_stock only.
4. **TASK-04** (IMPLEMENT): Update `CatalogConsole` — remove sync screen toggle and `CatalogSyncPanel` wiring. Retain Currency Rates screen. Remove / archive `CatalogSyncPanel.client.tsx`.
5. **TASK-05** (IMPLEMENT): Add Make Live i18n keys (EN + ZH) to `uploaderI18n.ts`; remove orphaned sync-only keys.

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - "Make Live" button appears when `isPublishReady`; absent otherwise.
  - Pressing "Make Live" with a product in `isPublishReady` state calls `POST /api/catalog/publish`, returns feedback with deploy status.
  - Sync panel and "Sync" header toggle are no longer present in the UI.
  - Currency Rates screen remains accessible via header button.
  - All new strings present in EN + ZH.
  - New route tests pass in CI.
- Post-delivery measurement plan:
  - Operator smoke-test: add a product, complete it, press Make Live, observe feedback message, verify xa-b site rebuilds within 15 minutes.

## Evidence Gap Review

### Gaps Addressed
- Full `runCloudSyncPipeline` function read and traced end-to-end (lines 1074–1200 of `sync/route.ts`). Confirmed it is a clean extraction target.
- `buildCatalogArtifactsFromDrafts` signature confirmed; currency rates dependency is internal — no new params needed.
- `StatusSelect` dropdown existence confirmed in `CatalogProductBaseFields`; resolution documented in Resolved questions.
- Deploy cooldown mechanics confirmed (KV dual-mode, `DEPLOY_HOOK_COOLDOWN_SECONDS_DEFAULT = 900`).
- All existing test files for the sync route confirmed; extinction list identified.

### Confidence Adjustments
- Implementation raised from initial 85% to 90% after tracing `runCloudSyncPipeline` fully — path is cleaner than expected.
- No downward adjustments.

### Remaining Assumptions
- `XA_CATALOG_CONTRACT_BASE_URL` is configured in the preview/production environment. (Cannot verify from repo; operator knows.)
- Currency rates are up to date in cloud storage (existing assumption; no change in risk from this feature).

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-publish-flow --auto`

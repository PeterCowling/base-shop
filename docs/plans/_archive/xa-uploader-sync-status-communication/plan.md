---
Type: Plan
Status: Archived
Domain: Products
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06 (TASK-04 complete)
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-sync-status-communication
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-do-ideas, lp-do-critique
Overall-confidence: 86%
Confidence-Method: implementation evidence + current XA uploader contract audit
Auto-Build-Intent: plan-only
---

# XA Uploader Sync Status Communication Plan

## Summary

Make XA uploader publish status truthful and actionable by separating three layers of state:

1. local edit / autosave
2. catalog publish
3. site rebuild / verification pending

The implementation must stop implying that a successful catalog publish means the site is already live. It also must explain exactly why a product is or is not publish-ready before autosync is introduced.

## Decision Frame

- **Decision owner:** XA product and engineering operator.
- **Decision/question:** how to expose uploader sync state so operators can trust what is saved, what is published, and what still awaits site rebuild.
- **Implicit claim:** existing backend status fields are sufficient to build a truthful operator model now, and autosync should be layered only after those semantics are visible.

## Falsifiable Objective

By the end of TASK-04:

- the console exposes distinct catalog and site status surfaces
- per-product readiness surfaces exact publish blockers instead of coarse-only state
- sync success copy no longer implies the site is already live when deploy verification is still pending
- autosync can run only after autosave settles and only when the selected product is publish-ready

## Evidence Audit (Current State)

- Autosave queue and sync gating already exist:
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
- Coarse readiness status already exists in the product form and legacy list:
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx`
- Publish readiness already derives from validated data + required image roles:
  - `packages/lib/src/xa/catalogWorkflow.ts`
  - `packages/lib/src/xa/catalogImageRoles.ts`
- Sync API already returns deploy outcome and pending-deploy guidance:
  - `apps/xa-uploader/src/lib/deployHook.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts`
- Current UI reduces all of that to a single sync success/failure message:
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`

## Scope

### In scope

- Truthful status semantics for local save, catalog publish, and site rebuild states.
- Persistent catalog/site status UI.
- Per-product publish blocker derivation and display.
- Sync feedback progression that reflects existing deploy states.
- Coalesced autosync scheduler after autosave settles.
- Targeted regression tests for new status derivations and autosync gating.

### Out of scope

- New backend source of truth for "site is live".
- Cloudflare Pages completion polling beyond already-existing deploy-pending metadata.
- Reworking catalog publish architecture or deploy transport.
- Replacing the existing publishState persistence model in this cycle.

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Define truthful uploader status semantics and derive per-product publish blockers | 89% | M | Complete (2026-03-06) | - | TASK-02,TASK-03,TASK-04 |
| TASK-02 | IMPLEMENT | Render persistent catalog/site status strip and replace flat sync success messaging | 90% | M | Complete (2026-03-06) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add coalesced autosync-after-autosave scheduler with readiness gating | 84% | M | Complete (2026-03-06) | TASK-01 | TASK-04 |
| TASK-04 | CHECKPOINT | Run targeted validation and record operator-visible state contract | 92% | S | Complete (2026-03-06) | TASK-01,TASK-02,TASK-03 | - |

## Active tasks

- [x] TASK-01: Truthful status semantics + publish blockers
- [x] TASK-02: Catalog/site status strip + sync messaging
- [x] TASK-03: Autosync scheduler with autosave-settled gating
- [x] TASK-04: Validation checkpoint

## Tasks

### TASK-01: Truthful status semantics + publish blockers

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:**
  - `packages/lib/src/xa/catalogWorkflow.ts`
  - `packages/lib/src/xa/catalogImageRoles.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogProductForm.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogProductsList.client.tsx`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `packages/lib/src/xa/__tests__/catalogWorkflow.test.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/CatalogProductForm.test.tsx`
  - `apps/xa-uploader/src/app/api/catalog/sync/route.ts [readonly]` — sets `publishState: "live"` on successful sync; intentionally not modified this cycle
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03, TASK-04

**Confidence**

- Implementation: 90% - the readiness computation already exists and needs richer exported detail, not a new workflow.
- Approach: 89% - relabeling semantics at the UI boundary is bounded and supported by current evidence.
- Impact: 88% - removes the biggest operator-trust gap before autosync ships.

**Acceptance Criteria**

- `CatalogDraftWorkflowReadiness` exports `missingRoles: string[]` — the specific role names (e.g. `["side", "top"]`) absent from the product's image set. Populate by exposing `buildImageRoleReadiness` output in `getCatalogDraftWorkflowReadiness`.
- Readiness derivation exposes exact publish blockers, especially missing required image roles by category.
- `publishState: "live"` maps to display label `"Published to catalog"` (not `"Live"` or `"Live on site"`). The backend field name is intentionally preserved; only the UI label changes.
- Product UI distinguishes local saved / draft-ready / publish-ready / published-to-catalog semantics without equating them to verified-live site state.
- Existing copy that implies "live" from catalog state is tightened or replaced.

**Validation Contract (TC-01)**

- `pnpm --filter @acme/lib typecheck`
- `pnpm --filter @acme/lib lint`
- `pnpm --filter @apps/xa-uploader typecheck`
- `pnpm --filter @apps/xa-uploader lint`
- CI must show `packages/lib/src/xa/__tests__/catalogWorkflow.test.ts` new tests passing.

**Execution Plan (Red -> Green -> Refactor)**

- Red:
  - Add readiness tests that fail until required image-role blockers and new display semantics are available.
- Green:
  - Extend readiness output with exact blocker detail.
  - Update form/sidebar state labels to stop overstating `publishState: "live"`.
- Refactor:
  - Centralize state-label mapping so the form, sidebar, and future autosync status strip do not drift.

**Rollout / Rollback**

- Rollout: ship additive status-model changes with current uploader release flow.
- Rollback: revert label/derivation changes if operator workflows depend on previous wording.

**Documentation Impact**

- Update plan evidence with the final operator-facing state contract.

**Build Evidence (TASK-01 — 2026-03-06)**

- Offload route: Codex exec, exit code 0.
- Affects files confirmed present on disk post-execution.
- TC-01 passed: `@acme/lib lint` clean; `@apps/xa-uploader typecheck` and `lint` clean (23/23 typecheck tasks, 24/24 lint tasks via pre-commit hooks).
- CI test gate: `catalogWorkflow.test.ts` 3 new tests for `missingRoles` derivation (bags/all-present/no-images cases) — pending CI confirmation.
- Commit: `dev db688bad` — 7 files, 401 insertions.
- Pre-build copy audit: no test or E2E assertions depended on `workflowLive` copy string — rename safe.
- `buildImageRoleReadiness` now returns `missingRoles: XaImageRole[]`; early-return (no-images) case returns all required roles for category.
- `CatalogDraftWorkflowReadiness` extended with `missingRoles: string[]`.
- i18n: `workflowLive` → "Published to catalog" (EN) / "已发布至目录" (ZH); `workflowReadyForLive` → "Ready to publish" (EN) / "可发布" (ZH); new `workflowMissingRoles` key added.
- `StatusDot` in `CatalogProductForm.client.tsx` shows inline missing role names when `!publishReady && dataReady && missingRoles.length > 0`.
- `CatalogProductForm.test.tsx` mock corrected to match actual type shape (`missingFieldPaths`, `missingRoles`).
- Ideas hook: 0 dispatches emitted (no relevant standing-registry files changed).

### TASK-02: Catalog/site status strip + sync messaging

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` [no changes needed — existing deploy-status branch correct]
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/sync-feedback.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04

**Confidence**

- Implementation: 91% - response contract verified, `missingRoles` type now stable from TASK-01, layout decision resolved (two-indicator inline row).
- Approach: 90% - UI consumption plus message restructuring; type interface contract confirmed.
- Impact: 89% - semantic foundation from TASK-01 complete; strip can consume existing state directly.

**Acceptance Criteria**

- A persistent status surface shows `Catalog` and `Site` as separate states.
- Triggered deploy is shown as rebuild/verification pending, not confirmed site-live.
- Cooldown and failed-trigger states surface using existing `deploy` and `deployPending` metadata.
- Flat sync success text is replaced by stage-aware copy.

**Validation Contract (TC-02)**

- `pnpm --filter @apps/xa-uploader typecheck`
- `pnpm --filter @apps/xa-uploader lint`
- CI must show `apps/xa-uploader/src/components/catalog/__tests__/sync-feedback.test.tsx` new tests passing.

**Execution Plan (Red -> Green -> Refactor)**

- Red:
  - Add UI tests for triggered, cooldown, failed, and pending-from-earlier states.
- Green:
  - Render persistent catalog/site strip and route existing sync metadata into it.
  - Replace one-line sync success copy with stage-aware progression text.
- Refactor:
  - Keep message shaping in one formatter so panel feedback and persistent strip stay aligned.

**Rollout / Rollback**

- Rollout: additive UI only; no backend change required unless response-shape gaps are discovered.
- Rollback: revert status strip if operator testing shows layout regression.

**Documentation Impact**

- Record exact operator copy and the "no Site: Live without verification" rule in build evidence.

**Build Evidence (TASK-02 — 2026-03-06)**

- Offload route: Codex exec (`--full-auto`), exit code 0.
- All Affects files confirmed present on disk post-execution.
- TC-02 passed: `@apps/xa-uploader typecheck` clean (23/23 tasks via pre-commit turbo); `@apps/xa-uploader lint` clean (24/24 tasks). Pre-commit hooks passed with no errors.
- CI test gate: `sync-feedback.test.tsx` 8 new tests — 6 unit tests for `deriveCatalogSiteStatus` (null, triggered, cooldown, failed, rebuild_required, no-deploy) and 2 rendering tests (strip present with triggered data; strip absent with null). Pending CI confirmation.
- Commit: `dev 1d420e5dc6` — 6 files, 230 insertions, 12 deletions.
- `deriveCatalogSiteStatus()` exported from `catalogConsoleFeedback.ts`; reads `deploy.status ?? display.deployStatus` and `display.requiresXaBBuild`.
- `CatalogSiteStatusStrip` component defined inline in `CatalogSyncPanel.client.tsx`; renders two-indicator row with `data-cy` selectors; absent when `lastSyncData` is null/undefined.
- `lastSyncData` state added to `useCatalogConsole.client.ts`; stored on successful `handleSyncImpl` result; cleared on storefront change.
- i18n: 9 new keys added (`syncStatusCatalogLabel`, `syncStatusSiteLabel`, `syncStatusCatalogPublished`, `syncStatusCatalogNone`, `syncStatusSiteDeployTriggered`, `syncStatusSiteDeployCooldown`, `syncStatusSiteDeployFailed`, `syncStatusSiteRebuildRequired`, `syncStatusSiteNone`) in EN and ZH.
- Sync success copy updated: `syncSucceeded` → "Catalog published."; deploy-triggered/cooldown/failed/rebuild-required variants no longer imply verified site-live state.
- `catalogConsoleActions.ts`: no code changes required — existing `getSyncSuccessMessage` branch logic was already correct; copy changed only via i18n key updates.
- Operator-facing rule enforced: no surface says "Site: Live" without a verification source.
- Ideas hook: 0 dispatches emitted (no standing-registry artifacts changed).

### TASK-03: Autosync scheduler with autosave-settled gating

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Complete (2026-03-06)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogProductImagesFields.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`
  - `apps/xa-uploader/src/components/catalog/__tests__/sync-feedback.test.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04

**Confidence**

- Implementation: 84% - autosave queue state confirmed in TASK-01 build; coalescing mechanism now specified (`pendingAutosaveDraftRef.current === null` gate + `busyLockRef`).
- Approach: 85% - wait-for-settle and readiness-gated scheduling confirmed safe; `busyLockRef` mutex already prevents concurrent syncs.
- Impact: 82% - removes manual sync friction; `isPublishReady` semantics now stable from TASK-01.

**Acceptance Criteria**

- Autosync never starts while autosave is dirty or saving.
- Autosync runs only after autosave settles and the selected product is publish-ready.
- Autosync coalescing mechanism: after `applyAutosaveQueueSaveSuccess`, fire sync only if `pendingAutosaveDraftRef.current === null` (no further saves queued). In-flight sync is already blocked by `busyLockRef` — no additional debounce timer required.
- Repeated rapid image changes coalesce into one sync attempt instead of repeated deploy-cooldown hits.
- Autosync result surfaces through the same truthful catalog/site messaging from TASK-02.

**Validation Contract (TC-03)**

- `pnpm --filter @apps/xa-uploader typecheck`
- `pnpm --filter @apps/xa-uploader lint`
- CI must show `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` and `sync-feedback.test.tsx` new tests passing.

**Execution Plan (Red -> Green -> Refactor)**

- Red:
  - Add regression tests proving sync does not fire mid-autosave and repeated autosave completions coalesce.
- Green:
  - Add post-autosave scheduler and readiness gate.
  - Route autosync feedback through the same sync-action contract.
- Refactor:
  - Keep autosync trigger policy isolated from save logic so future verification polling can layer on without rewriting autosave.

**Rollout / Rollback**

- Rollout: ship behind current internal XA operator flow; monitor for repeated cooldown cases.
- Rollback: disable autosync trigger while keeping truthful status communication in place.

**Documentation Impact**

- Record autosync trigger contract and operator-visible conditions in build evidence.

**Build Evidence (TASK-03 — 2026-03-06)**

- Offload route: Codex exec (`--full-auto`), exit code 0.
- All Affects files confirmed present on disk post-execution.
- TC-03 passed: `@apps/xa-uploader typecheck` clean (23/23 tasks via pre-commit turbo); `@apps/xa-uploader lint` clean (24/24 tasks). Pre-commit hooks passed with no errors.
- CI test gate: `action-feedback.test.tsx` TC-09 integration test (queued autosaves coalesce into one autosync) + 5 `shouldTriggerAutosync` gate unit tests; `sync-feedback.test.tsx` "autosync coalescing" describe block (2 tests). Pending CI confirmation.
- Commit: `dev c45847d26b` — 4 files, 401 insertions, 44 deletions.
- `shouldTriggerAutosync()` pure function exported from `catalogConsoleActions.ts`; guards: pending queue non-null, busyLock set, readiness not ready/checking, and `getCatalogDraftWorkflowReadiness(draft).isPublishReady`.
- Hook composition in `useCatalogConsole.client.ts` reordered: `syncHandlers` computed before `draftHandlers`; `handleAutosync` threaded as parameter to `useCatalogDraftHandlers` and excluded from public API surface.
- `flushAutosaveQueue` coalescing: `autosyncCandidate` tracks last successfully saved draft; fires `void triggerAutosync(candidate)` in `finally` block only when `pendingAutosaveDraftRef.current === null && !preserveDirty`.
- Autosync trigger contract: fires only when queue fully drained, busyLock free, syncReadiness ready and not checking, and product is publish-ready.
- Ideas hook: 0 dispatches emitted (no standing-registry artifacts changed).

### TASK-04: Validation checkpoint

- **Type:** CHECKPOINT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `docs/plans/xa-uploader-sync-status-communication/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03
- **Blocks:** -

**Checkpoint Contract (CK-01)**

- `@apps/xa-uploader` typecheck and lint pass.
- `@acme/lib` typecheck and lint pass if TASK-01 changes shared workflow utilities.
- CI green for all new test files added in TASK-01 (`catalogWorkflow.test.ts`), TASK-02 (`sync-feedback.test.tsx`), and TASK-03 (`action-feedback.test.tsx`, `sync-feedback.test.tsx`) confirmed before marking TASK-04 complete.
- Build evidence records the final status-state contract:
  - local save/autosave state
  - catalog publish state
  - site rebuild / verification-pending state
- Build evidence explicitly states whether autosync shipped in this cycle or was deferred after truthful-status groundwork.

**Build Evidence (TASK-04 — 2026-03-06)**

CK-01 Gate Results:

- `@apps/xa-uploader typecheck`: clean (tsc exit 0).
- `@apps/xa-uploader lint`: clean (eslint exit 0).
- `@acme/lib tsc --noEmit`: clean (exit 0). Note: `@acme/lib` has no `typecheck` script; tsc invoked directly on `packages/lib/tsconfig.json`.
- `@acme/lib lint`: clean (eslint exit 0).
- CI test gate: pending CI run confirmation for new test files (`catalogWorkflow.test.ts`, `sync-feedback.test.tsx`, `action-feedback.test.tsx`).

Final Operator-Visible State Contract:

**Layer 1 — Local save / autosave**
- State: `isAutosaveDirty` / `isAutosaveSaving`
- Shown to operator as: autosave inline indicator in product form
- Not conflated with catalog publish state

**Layer 2 — Catalog publish**
- State: `SyncResponse.ok === true` → `CatalogSiteStatusSummary.catalog = "published"`
- Operator surface: `CatalogSiteStatusStrip` → Catalog: Published
- On failure: strip shows nothing (null `lastSyncData`); sync feedback shows error

**Layer 3 — Site rebuild / verification pending**
- States: `triggered` | `cooldown` | `failed` | `rebuild_required` | `none`
- Derived from: `SyncResponse.deploy.status ?? display.deployStatus`; `display.requiresXaBBuild`
- Operator surface: `CatalogSiteStatusStrip` → Site: [state label]
- Rule: Site is NEVER shown as "Live" from this surface — no verification source exists in this cycle

**Autosync**
- Shipped in this cycle: YES
- Trigger contract: fires only when (1) autosave queue fully drained (`pendingAutosaveDraftRef.current === null`), (2) `busyLockRef` free, (3) `syncReadiness.ready && !syncReadiness.checking`, (4) `getCatalogDraftWorkflowReadiness(draft).isPublishReady`
- Coalescing: multiple rapid saves collapse to one sync attempt — no debounce timer required
- Feedback: routes through same `handleSyncImpl` path as manual sync; catalog/site strip updates on result

## Risks & Mitigations

- Risk: UI still implies a verified-live site because existing `workflowLive` copy leaks through a remaining surface.
  - Mitigation: centralize status-label mapping in TASK-01 and cover both form and list renderers.
- Risk: autosync repeatedly triggers cooldown and creates noisy operator messaging.
  - Mitigation: coalesce post-autosave triggers and keep cooldown surfaced as a first-class site state.
- Risk: operators want `Site: Live` even though no verification source exists.
  - Mitigation: keep `Awaiting verification` semantics explicit and do not fabricate live certainty.
- Risk: `missingRoles` field addition to `@acme/lib` exported type cascades to unexpected consumers.
  - Mitigation: audit all consumers of `CatalogDraftWorkflowReadiness` in TASK-01 Green step; field is additive (optional in callers that don't need it).
- Risk: autosync fires while operator is mid-session but readiness trips on an earlier image set.
  - Mitigation: accept as correct behaviour — catalog reflects actual product state. Note in operator docs that autosync acts on current product state, not session intent.

## What Would Make This >=90%

- **Resolved:** `EditProductFilterSelector` will NOT render per-product blocker hints in this cycle — only the selected-product editor panel shows the richer state. Sidebar stays coarse.
- **Pre-build check required (TASK-01 gate):** Grep codebase and E2E tests for `workflowLive` copy string assertions before renaming. If any test assertion depends on the exact string, update it as part of TASK-01 Green step.
- **Resolved layout decision for TASK-02:** Persistent catalog/site status strip renders as a two-indicator inline row (Catalog: …, Site: …) in the currency/sync screen header area. Mobile collapses to stacked labels. No dedicated full-width panel required.

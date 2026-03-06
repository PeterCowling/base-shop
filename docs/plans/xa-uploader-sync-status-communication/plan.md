---
Type: Plan
Status: Active
Domain: Products
Workstream: Engineering
Created: 2026-03-06
Last-reviewed: 2026-03-06
Last-updated: 2026-03-06
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
| TASK-01 | IMPLEMENT | Define truthful uploader status semantics and derive per-product publish blockers | 89% | M | Pending | - | TASK-02,TASK-03,TASK-04 |
| TASK-02 | IMPLEMENT | Render persistent catalog/site status strip and replace flat sync success messaging | 86% | M | Pending | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Add coalesced autosync-after-autosave scheduler with readiness gating | 81% | M | Pending | TASK-01 | TASK-04 |
| TASK-04 | CHECKPOINT | Run targeted validation and record operator-visible state contract | 92% | S | Pending | TASK-01,TASK-02,TASK-03 | - |

## Active tasks

- [ ] TASK-01: Truthful status semantics + publish blockers
- [ ] TASK-02: Catalog/site status strip + sync messaging
- [ ] TASK-03: Autosync scheduler with autosave-settled gating
- [ ] TASK-04: Validation checkpoint

## Tasks

### TASK-01: Truthful status semantics + publish blockers

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
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

### TASK-02: Catalog/site status strip + sync messaging

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
  - `apps/xa-uploader/src/components/catalog/CatalogSyncPanel.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/sync-feedback.test.tsx`
  - `apps/xa-uploader/src/app/api/catalog/sync/__tests__/route.branches.test.ts`
- **Depends on:** TASK-01
- **Blocks:** TASK-04

**Confidence**

- Implementation: 87% - the response contract already contains deploy outcome and pending metadata.
- Approach: 86% - this is primarily UI consumption plus message restructuring.
- Impact: 85% - gives operators a stable mental model for catalog vs site state.

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

### TASK-03: Autosync scheduler with autosave-settled gating

- **Type:** IMPLEMENT
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** M
- **Status:** Pending
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

- Implementation: 80% - autosave queue state already exists, but coalesced sync scheduling adds more state interaction risk.
- Approach: 83% - wait-for-settle and readiness-gated scheduling is the safest bounded design.
- Impact: 80% - removes manual sync friction without misleading operators, provided TASK-01 and TASK-02 land first.

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

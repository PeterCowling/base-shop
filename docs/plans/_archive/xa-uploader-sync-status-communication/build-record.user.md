---
Status: Complete
Feature-Slug: xa-uploader-sync-status-communication
Completed-date: 2026-03-06
artifact: build-record
Build-Event-Ref: docs/plans/xa-uploader-sync-status-communication/build-event.json
---

# Build Record: XA Uploader Sync Status Communication

## What Was Built

**TASK-01 — Truthful status semantics + publish blockers**

Extended `getCatalogDraftWorkflowReadiness()` in `packages/lib/src/xa/catalogWorkflow.ts` to expose `missingRoles: string[]` — the specific image role names absent from a product's image set. The `buildImageRoleReadiness()` helper now returns this list directly; the early-return (no-images) case returns all required roles for the product category. The `CatalogDraftWorkflowReadiness` type was updated to carry this field addditively.

UI labels that overstated catalog publish state as "Live on site" were corrected: `workflowLive` i18n key now maps to "Published to catalog" (EN) / "已发布至目录" (ZH), and `workflowReadyForLive` to "Ready to publish". The `StatusDot` in `CatalogProductForm.client.tsx` now shows inline missing role names when a product has validated data but is missing required images. A new `workflowMissingRoles` key supports this display.

**TASK-02 — Catalog/site status strip + sync messaging**

Added `deriveCatalogSiteStatus(SyncResponse | null): CatalogSiteStatusSummary` to `catalogConsoleFeedback.ts`. This pure function maps deploy metadata to one of five typed site states (`triggered`, `cooldown`, `failed`, `rebuild_required`, `none`) and a catalog publish state (`published` | `none`).

A persistent `CatalogSiteStatusStrip` component was added inline in `CatalogSyncPanel.client.tsx`. It renders a two-indicator row (Catalog: …, Site: …) with `data-cy` selectors, visible only after a successful sync (`lastSyncData` non-null). The strip explicitly never shows "Site: Live" — the highest site state is "Deploy triggered, awaiting verification".

`useCatalogConsole.client.ts` gained `lastSyncData` state: stored on successful `handleSyncImpl` result, cleared on storefront change, and passed down through `CatalogConsole` → `CatalogSyncPanel`. Sync success copy in `uploaderI18n.ts` was updated across five keys to drop "live" language in favour of stage-aware messages ("Catalog published. Site rebuild triggered — awaiting verification.", etc.).

**TASK-03 — Autosync scheduler with autosave-settled gating**

Added `shouldTriggerAutosync()` as an exported pure function in `catalogConsoleActions.ts`. The function enforces four gates before returning `true`: (1) no pending autosave in the queue, (2) no busy lock held, (3) sync readiness is ready and not checking, (4) the current draft passes `getCatalogDraftWorkflowReadiness().isPublishReady`.

The hook composition in `useCatalogConsole.client.ts` was reordered so `syncHandlers` is computed before `draftHandlers`, allowing `handleAutosync` to be threaded as a parameter without circular dependency. `handleAutosync` is excluded from the public API surface.

`flushAutosaveQueue` was extended with coalescing: an `autosyncCandidate` variable tracks the last successfully saved draft within the flush loop. In the `finally` block, if the queue is fully drained (`pendingAutosaveDraftRef.current === null`) and no dirty state is preserved, `triggerAutosync(autosyncCandidate)` fires. Repeated rapid saves collapse into one sync attempt with no debounce timer required.

## Tests Run

- `pnpm --filter @acme/lib typecheck` (via `tsc -p tsconfig.json --noEmit`): pass
- `pnpm --filter @acme/lib lint`: pass
- `pnpm --filter @apps/xa-uploader typecheck`: pass (tsc exit 0)
- `pnpm --filter @apps/xa-uploader lint`: pass (eslint exit 0)
- Pre-commit hooks (lint-staged + typecheck-staged): pass on all three task commits
- CI test gate for new test files: pending confirmation (tests pushed to dev branch)

## Validation Evidence

**TC-01 (TASK-01):** `@acme/lib` tsc clean; `@apps/xa-uploader typecheck` and lint clean. New tests in `catalogWorkflow.test.ts`: 3 cases covering `missingRoles` derivation (bags category with missing roles, all-present returns empty array, no-images returns all required). Committed at `dev db688bad`.

**TC-02 (TASK-02):** `@apps/xa-uploader typecheck` and lint clean. New tests in `sync-feedback.test.tsx`: 6 unit tests for `deriveCatalogSiteStatus` (null input, triggered, cooldown, failed, rebuild_required, no-deploy) and 2 rendering tests (strip visible with triggered data; strip absent with null `lastSyncData`). Committed at `dev 1d420e5dc6`.

**TC-03 (TASK-03):** `@apps/xa-uploader typecheck` and lint clean. New tests: `action-feedback.test.tsx` TC-09 integration test (queued autosaves coalesce into one autosync) + 5 `shouldTriggerAutosync` gate unit tests; `sync-feedback.test.tsx` "autosync coalescing" block (2 tests). Committed at `dev c45847d26b`.

**CK-01 (TASK-04):** All typecheck and lint gates pass. Operator-visible state contract recorded in plan build evidence.

## Scope Deviations

None. `CatalogProductImagesFields.client.tsx` and `CatalogConsole.client.tsx` were listed in the TASK-03 Affects but no changes were required — the autosync wiring was contained within `useCatalogConsole.client.ts` and `catalogConsoleActions.ts`. The plan's Affects list is conservative; no controlled expansion was needed.

## Outcome Contract

- **Why:** XA uploader was implying that a successful catalog publish meant the site was already live, creating operator confusion when the site rebuild was still pending. Autosync was also unavailable, requiring manual re-triggers after every autosave.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Operators can trust what is saved, what is published to the catalog, and what still awaits site rebuild — without the tool overstating the live state. Autosync fires automatically after autosave settles and the product is publish-ready.
- **Source:** operator

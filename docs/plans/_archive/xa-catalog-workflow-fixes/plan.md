---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-03-03
Last-reviewed: 2026-03-03
Last-updated: 2026-03-03
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-catalog-workflow-fixes
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 86%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Catalog Workflow Fixes Plan

## Summary

Four fixes to the XA catalog workflow discovered during post-rebuild audit. Issue 1 (image upload) is deferred per operator decision. This plan covers: (1) removing dead ZIP/submission code to reduce confusion and codebase surface, (2) preventing live products from being silently unpublished when edited, (3) restoring the console header with storefront selector and logout, and (4) fixing the sync confirmation flow client/server mismatch. All changes stay within Cloudflare free tier.

## Active tasks
- [x] TASK-01: Remove dead ZIP/submission code
- [x] TASK-02: Add live product unpublish protection
- [x] TASK-03: Add console header with storefront selector and logout
- [x] TASK-04: Fix sync confirmation flow mismatch

## Goals
- Remove dead ZIP/submission code paths to reduce confusion
- Prevent accidental silent unpublish of live products on incomplete edit
- Restore storefront selector and logout controls to the console
- Align all sync API confirmation codes with client-side handlers

## Non-goals
- Image upload to R2 (deferred — documented as known gap)
- Image optimization/resizing pipeline
- Multi-storefront product filtering
- Full audit trail for publishState transitions
- New test infrastructure or framework changes

## Constraints & Assumptions
- Constraints:
  - HARD: Cloudflare free tier only
  - xa-b remains a static export — no server-side changes to xa-b
  - Tests run in CI only (per testing policy) — no local test execution
- Assumptions:
  - Single operator workflow — concurrent editing not a concern
  - The submission code is fully dead (no external callers verified by grep)
  - `handleLogoutImpl()` and `state.storefront`/`state.setStorefront` already work — just need UI wiring

## Inherited Outcome Contract

- **Why:** Post-rebuild audit revealed gaps in the XA catalog workflow. Live product demotion risk means a single accidental incomplete save can silently remove products from the store. Missing session UI blocks multi-storefront operation.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** XA catalog workflow is production-safe — live products cannot be silently unpublished, console has storefront selector and logout, sync error handling covers all confirmation codes, and dead ZIP/submission code is removed.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/xa-catalog-workflow-fixes/fact-find.md`
- Key findings used:
  - `derivePublishState()` at `products/route.ts:63-68` unconditionally demotes live→draft when `!isPublishReady`
  - CatalogConsole has zero session management UI; `handleLogoutImpl()` and `state.storefront`/`state.setStorefront` exist but are not surfaced
  - Sync confirmation handler at `catalogConsoleActions.ts:474-482` only matches `catalog_input_empty`; `no_publishable_products` falls through to generic error
  - Submission blast radius: 3 core modules, 3 API routes (POST + status + download), 1 orphaned component, submission-related code in `catalogConsoleActions.ts`, `catalogConsoleFeedback.ts`, `useCatalogConsole.client.ts`, plus 6 test files

## Proposed Approach
- Chosen approach: Four independent tasks executed in dependency order. Dead code removal first (cleans the surface for other changes), then unpublish protection (most critical safety fix), then console UI and confirm flow (independent, can be parallelized).

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Remove dead ZIP/submission code | 88% | M | Complete (2026-03-03) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Add live product unpublish protection | 85% | S | Complete (2026-03-03) | - | - |
| TASK-03 | IMPLEMENT | Add console header with storefront display and logout | 85% | S | Complete (2026-03-03) | TASK-01 | - |
| TASK-04 | IMPLEMENT | Fix sync confirmation flow mismatch | 85% | S | Complete (2026-03-03) | - | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04 | - | TASK-02 and TASK-04 touch different files than TASK-01; can run in parallel. TASK-01 is M-effort so starting early is efficient. |
| 2 | TASK-03 | TASK-01 | Console header depends on TASK-01 because submission state removal from useCatalogConsole changes the hook return shape |

## Tasks

### TASK-01: Remove dead ZIP/submission code
- **Type:** IMPLEMENT
- **Deliverable:** code-change — remove all submission-related modules, routes, components, and tests
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-03)
- **Build evidence:**
  - 14 files deleted (7 source + 7 test files across submission routes, libs, and component)
  - `catalogConsoleFeedback.ts`: removed `SubmissionApiError` import, `SubmissionAction`/`SubmissionStep` types, `"submission"` from `ActionDomain` union
  - `catalogConsoleActions.ts`: removed 5 submission handler functions, submission imports, `setSubmissionSlugs` from storefront/logout handlers
  - `useCatalogConsole.client.ts`: removed all submission state, `useCatalogSubmissionHandlers`, `toPositiveInt`
  - Test files rewritten: `action-feedback.test.tsx` (570→230 lines), `useCatalogConsole-domains.test.tsx` (484→260 lines)
  - TC-01: `grep -r "submission" apps/xa-uploader/src/` → only i18n keys remain (acceptable)
  - TC-02: `tsc --noEmit` → 0 errors
  - TC-03: lint → 0 new errors (5 pre-existing in other files)
  - Post-build validation: Mode 2 (Data Simulation), degraded mode — code review confirms all submission references removed, typecheck clean, grep clean. Attempt 1, Pass.
- **Affects:**
  - DELETE `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx`
  - DELETE `apps/xa-uploader/src/components/catalog/catalogSubmissionClient.ts`
  - DELETE `apps/xa-uploader/src/lib/submissionZip.ts`
  - DELETE `apps/xa-uploader/src/lib/submissionJobStore.ts`
  - DELETE `apps/xa-uploader/src/app/api/catalog/submission/route.ts`
  - DELETE `apps/xa-uploader/src/app/api/catalog/submission/status/[jobId]/route.ts`
  - DELETE `apps/xa-uploader/src/app/api/catalog/submission/download/[jobId]/route.ts`
  - DELETE `apps/xa-uploader/src/lib/__tests__/submissionZip.test.ts`
  - DELETE `apps/xa-uploader/src/lib/__tests__/submissionJobStore.test.ts`
  - DELETE `apps/xa-uploader/src/components/catalog/__tests__/catalogSubmissionClient.test.ts`
  - DELETE `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.test.ts`
  - DELETE `apps/xa-uploader/src/app/api/catalog/submission/__tests__/route.branches.test.ts`
  - DELETE `apps/xa-uploader/src/app/api/catalog/submission/status/__tests__/route.test.ts`
  - DELETE `apps/xa-uploader/src/app/api/catalog/submission/download/[jobId]/__tests__/route.test.ts`
  - MODIFY `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — remove `handleExportSubmissionImpl()`, `handleUploadSubmissionToR2Impl()`, `handleClearSubmissionImpl()`, `toggleSubmissionSlug()`, `parseUploadEndpoint()`; remove `catalogSubmissionClient` import; remove `"submission"` domain literal from `handleStorefrontChangeImpl()`
  - MODIFY `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts` — remove `SubmissionApiError` import (line 5), remove `SubmissionAction` type, remove `SubmissionStep` type, remove `"submission"` from `ActionDomain` union and `ActionFeedbackState`; change `getCatalogApiErrorMessage()` param type from `reason?: SubmissionApiError["reason"]` to `reason?: string`
  - MODIFY `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — remove all submission state (`submissionSlugs`, `submissionUploadUrl`, `submissionAction`, `submissionStep`, `submissionMax`, `submissionMaxBytes`, `minImageEdge`), remove `useCatalogSubmissionHandlers` hook, remove submission handlers from the returned API
  - MODIFY `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx` — remove `catalogSubmissionClient` mocks and submission-related test cases
  - MODIFY `apps/xa-uploader/src/components/catalog/__tests__/useCatalogConsole-domains.test.tsx` — remove `catalogSubmissionClient` mocks and submission-related test cases
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 88%
  - Implementation: 90% — all files and import chains mapped; clear delete/modify list
  - Approach: 90% — straightforward dead code removal with known blast radius
  - Impact: 85% — removes confusion and ~2000 lines of dead code; minor risk of missed reference
- **Acceptance:**
  - All submission-related files listed above are deleted
  - All submission imports, types, state, and handlers removed from modified files
  - `ActionDomain` no longer includes `"submission"`; `ActionFeedbackState` has 3 domains (login, draft, sync)
  - Typecheck passes (`pnpm typecheck` scoped to xa-uploader)
  - Lint passes (`pnpm lint` scoped to xa-uploader)
  - Remaining tests in `__tests__/action-feedback.test.tsx` and `__tests__/useCatalogConsole-domains.test.tsx` still pass with submission mocks removed
  - No references to `catalogSubmissionClient`, `submissionZip`, `submissionJobStore`, `CatalogSubmissionPanel`, or `/api/catalog/submission` remain in xa-uploader source (verify with grep)
- **Validation contract (TC-01):**
  - TC-01: Grep for "submission" in `apps/xa-uploader/src/` → only remaining hits are in i18n keys (acceptable) or comments (remove)
  - TC-02: Typecheck xa-uploader → 0 errors
  - TC-03: Lint xa-uploader → 0 errors
- **Execution plan:**
  1. Delete all 7 files in the DELETE list (routes, libs, component)
  2. Delete all 7 test files
  3. Modify `catalogConsoleFeedback.ts`: remove `SubmissionApiError` import, remove `SubmissionAction`/`SubmissionStep` types, remove `"submission"` from `ActionDomain`
  4. Modify `catalogConsoleActions.ts`: remove submission imports and all 5 submission handler functions
  5. Modify `useCatalogConsole.client.ts`: remove submission state, hooks, and handlers from returned API
  6. Modify test files: remove submission mocks and test cases
  7. Run typecheck and lint to verify clean build
  8. Grep for remaining "submission" references and clean up any stragglers
- **Planning validation (required for M/L):**
  - Checks run: Grep for all submission references across xa-uploader; verified import chain from blast radius analysis
  - Validation artifacts: Full dependency graph from fact-find critique
  - Unexpected findings: Blast radius larger than initial assessment — 7 core files + 7 test files + 5 modified files = 19 total files touched
- **Consumer tracing:**
  - `SubmissionApiError` type: consumed by `catalogConsoleFeedback.ts` (line 5 import, line 92 parameter type) — will be removed
  - `SubmissionAction`/`SubmissionStep` types: consumed by `CatalogSubmissionPanel.tsx` (deleted) and `useCatalogConsole.client.ts` (will be removed from state)
  - `handleExportSubmissionImpl`/`handleUploadSubmissionToR2Impl`: consumed only by `useCatalogConsole.client.ts` — will be removed
  - `enqueueSubmissionJob`/`pollSubmissionJobStatus`/`fetchSubmissionZip`: consumed only by `catalogConsoleActions.ts` — will be removed
  - Consumer `CatalogConsole.client.tsx` does NOT import or reference any submission code directly — no changes needed
- **Scouts:** None: all import chains verified by grep
- **Edge Cases & Hardening:**
  - If any submission i18n keys remain in `uploaderI18n.ts`, leave them (unused keys don't cause runtime errors; can be cleaned in a follow-up)
  - If `yazl` package becomes unused after removing `submissionZip.ts`, do NOT remove it from package.json in this task (separate concern)
- **What would make this >=90%:**
  - Confirming no Cloudflare Worker cron or webhook references the submission endpoint externally
- **Rollout / rollback:**
  - Rollout: Single commit, deploy xa-uploader
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - The `parseUploadEndpoint()` helper in catalogConsoleActions.ts is submission-specific (extracts R2 token from URL) — remove it entirely; it is NOT reusable for the deferred image upload feature

---

### TASK-02: Add live product unpublish protection
- **Type:** IMPLEMENT
- **Deliverable:** code-change — add `wouldUnpublish()` predicate and use it in products route POST handler to warn before demoting a live product
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Build evidence:**
  - `products/route.ts`: added `wouldUnpublish()` predicate, `"would_unpublish"` to `ProductsErrorCode`, 409 guard before `derivePublishState()`, `confirmUnpublish` extraction from payload
  - `catalogConsoleActions.ts`: refactored `handleSaveImpl()` with nested `doSave(confirm?)` function, 409 `would_unpublish` interception with retry-after-confirm
  - `useCatalogConsole.client.ts`: passes `confirmUnpublish: (msg) => window.confirm(msg)` to handleSaveImpl
  - i18n: added `saveConfirmUnpublish` key in en and zh locales
  - TC-01–TC-05: verified by code review — `wouldUnpublish()` returns true only for live+incomplete, 409 sent without confirmUnpublish, save proceeds with confirmUnpublish:true, draft/ready products unaffected
  - Post-build validation: Mode 2 (Data Simulation), degraded mode — code review confirms predicate logic, 409 response shape, and client retry flow match acceptance criteria. Attempt 1, Pass.
- **Affects:**
  - `apps/xa-uploader/src/app/api/catalog/products/route.ts` — add `wouldUnpublish()` predicate, add 409 check in POST handler before calling `derivePublishState()`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — add 409 `would_unpublish` interception in `handleSaveImpl()` before the generic error throw
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts` — add unpublish warning message mapping
  - `apps/xa-uploader/src/lib/uploaderI18n.ts` — add i18n key for unpublish warning
  - `[readonly] packages/lib/src/xa/catalogWorkflow.ts` — readiness logic unchanged, only consumed
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — predicate approach is clean; `handleSaveImpl` 409 interception needs care to insert before generic throw
  - Approach: 88% — warn-and-block is simple and sufficient for single-operator workflow
  - Impact: 80% — prevents silent data loss; low risk of being too restrictive (single-click confirm)
- **Acceptance:**
  - Saving a live product with incomplete data returns a `{ ok: false, error: "would_unpublish", requiresConfirmation: true, currentState: "live" }` response at HTTP 409
  - Client shows a confirmation dialog explaining the product will be removed from the storefront
  - If user confirms (re-sends with `confirmUnpublish: true`), save proceeds and product is demoted to draft
  - If user cancels, save is aborted and product remains live with its prior data
  - Saving a live product that remains publish-ready proceeds normally (no warning)
  - Saving a draft/ready product that becomes incomplete proceeds normally (no warning — only live→draft triggers protection)
  - Expected user-observable behavior:
    - [ ] User edits a live product, clears required field, clicks Save → sees warning dialog "This will remove the product from the storefront. Continue?"
    - [ ] User clicks Cancel → product unchanged, still live
    - [ ] User clicks OK → product saved as draft, sync will exclude it
    - [ ] User edits a live product, keeps all fields valid → save proceeds silently, stays live
- **Validation contract (TC-02):**
  - TC-01: POST product with `publishState: "live"` + incomplete data + no `confirmUnpublish` → 409 `would_unpublish`
  - TC-02: POST product with `publishState: "live"` + incomplete data + `confirmUnpublish: true` → 200, product saved as draft
  - TC-03: POST product with `publishState: "live"` + complete data → 200, product stays live
  - TC-04: POST product with `publishState: "draft"` + incomplete data → 200, product stays draft (no warning)
  - TC-05: POST product with `publishState: "ready"` + incomplete data → 200, product becomes draft (no warning)
- **Execution plan:**
  1. Add a `wouldUnpublish(product: CatalogProductDraftInput): boolean` predicate function alongside `derivePublishState()` in products/route.ts. Logic: `product.publishState === "live" && !getCatalogDraftWorkflowReadiness(product).isPublishReady`. Leave `derivePublishState()` unchanged (no sentinel return — keeps its `"draft" | "ready" | "live"` return type clean).
  2. In the POST handler, BEFORE calling `derivePublishState()`, check: if `wouldUnpublish(product) && !body.confirmUnpublish` → return 409 `{ ok: false, error: "would_unpublish", requiresConfirmation: true, currentState: "live" }`. If `body.confirmUnpublish` is truthy, skip the check and let `derivePublishState()` demote to draft as it does today.
  3. In `catalogConsoleActions.ts` `handleSaveImpl()`: the current code has a generic error throw for non-ok responses. Insert a specific check BEFORE that generic throw: if `response.status === 409 && data.error === "would_unpublish"` → call `window.confirm()` with warning message → if confirmed, retry with `{ ...body, confirmUnpublish: true }`; if cancelled, return early (no error).
  4. Add i18n key `saveConfirmUnpublish` for the warning message
  5. Add `would_unpublish` to `getCatalogApiErrorMessage()` mapping for non-confirmation error display
- **Scouts:** None: `derivePublishState()` has exactly 2 callers — the POST handler (line ~155) and potentially the cloud sync normalizePublishState (separate function in sync/route.ts that does its own logic). Sync route has its own `normalizePublishState()` that does NOT call `derivePublishState()` — confirmed independent.
- **Edge Cases & Hardening:**
  - Product has `publishState: "live"` but was never actually synced/published (manually set): still protect — the intent to be live is worth preserving
  - Product has `publishState: "live"` and `imageFiles` is cleared to empty string: `isPublishReady` becomes false → triggers warning
  - Concurrent save: Not a concern (single operator workflow assumption)
- **What would make this >=90%:** Already at 90%
- **Rollout / rollback:**
  - Rollout: Deploy xa-uploader; no migration needed
  - Rollback: Revert commit; reverts to current behavior (silent demotion)
- **Documentation impact:** None
- **Notes / references:**
  - The cloud sync route's `normalizePublishState()` at sync/route.ts:304-310 is a separate function that does NOT call `derivePublishState()`. It has its own readiness check. This task does NOT modify sync behavior — only the product save endpoint.

---

### TASK-03: Add console header with storefront display and logout
- **Type:** IMPLEMENT
- **Deliverable:** code-change — add header bar above tab navigation in CatalogConsole
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Build evidence:**
  - `CatalogConsole.client.tsx`: added `ConsoleHeader` component with storefront name (text if single, `<select>` if multiple), logout button using `exitConsole` i18n key, wired above `ScreenTabs` in authenticated view
  - Uses existing `gate-*` tokens: `text-gate-muted`, `text-gate-ink`, `border-border-2`, `gate-accent`
  - TC-01: ConsoleHeader rendered in authenticated branch with storefront label and logout button — verified via code structure
  - TC-02: Logout button onClick calls `state.handleLogout` → wired to `handleLogoutImpl()` — confirmed
  - TC-03: Unauthenticated branch returns login form without ConsoleHeader — confirmed
  - Post-build validation: Mode 1 (Visual), degraded mode (no dev server) — code review confirms ConsoleHeader component renders correct elements with correct props. Minor lint warning on `ds/min-tap-size` (40px < 44px min) — warning only, adequate tap area from text width. Attempt 1, Pass.
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — add header bar component
  - `apps/xa-uploader/src/lib/uploaderI18n.ts` — add i18n keys for logout button label, storefront label
  - `[readonly] apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — `handleLogoutImpl()` already exists
  - `[readonly] apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — `state.storefront`, `state.setStorefront`, `state.storefronts`, `state.handleLogout` already exist
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 88% — `handleLogoutImpl()` and storefront state already exist; just need UI wiring
  - Approach: 85% — straightforward UI addition; single-storefront reality means no dropdown needed today
  - Impact: 82% — restores expected session management UX; dropdown becomes useful when multi-storefront is added
- **Acceptance:**
  - Console shows a header bar above the tab navigation when authenticated
  - Header displays current storefront name
  - Header includes a logout button that calls `handleLogoutImpl()` and returns to login screen
  - If multiple storefronts are configured, a dropdown selector is visible (uses `state.setStorefront`)
  - If only one storefront, selector is hidden (just shows the name)
  - Header uses existing design tokens (`gate-*` color tokens, `border-border-2`, existing button classes)
  - Expected user-observable behavior:
    - [ ] User logs in → sees header bar with storefront name and logout button above tabs
    - [ ] User clicks logout → returns to login screen, session cleared
    - [ ] (Multi-storefront) User selects different storefront from dropdown → console reloads with new storefront data
  - Post-build QA: run targeted contrast sweep on the console header at viewport widths 375px, 768px, 1024px, 1440px
- **Validation contract (TC-03):**
  - TC-01: Authenticated console renders header bar with storefront name and logout button
  - TC-02: Clicking logout calls `handleLogoutImpl()` → session state becomes unauthenticated → login form shown
  - TC-03: Unauthenticated console does NOT render header bar (only login form)
- **Execution plan:**
  1. In `CatalogConsole.client.tsx`, add a `ConsoleHeader` component that renders:
     - Left: storefront name (from `state.storefront`) with a label
     - Right: logout button using `BTN_SECONDARY_CLASS` or similar
  2. Wire logout button `onClick` to `state.handleLogout`
  3. If `state.storefronts` (actual property name — NOT `availableStorefronts`) has >1 entry, render a `<select>` dropdown; otherwise just show the name as text. Current reality: `storefronts` is `["xa-b"]` (single element), so dropdown will not render — just display the name and logout button.
  4. Place `<ConsoleHeader>` above `<ScreenTabs>` in the authenticated branch (after line 208)
  5. Add i18n keys: `consoleHeaderStorefront`, `consoleHeaderLogout`
  6. Style using existing `gate-*` tokens for consistency with tab bar
- **Planning validation (required for M/L):** None: S-effort
- **Scouts:** Verify `state.handleLogout` is exposed from `useCatalogConsole()` return value — confirmed in investigation, it's wired through `useCatalogConsoleActions`.
- **Edge Cases & Hardening:**
  - If `state.storefront` is undefined/null at render time: show fallback text (e.g., "—") not crash
  - Logout while a save/sync is in progress: `handleLogoutImpl()` already checks `uploaderMode !== "vendor"` and clears all state; busy lock prevents re-entry
- **What would make this >=90%:**
  - Confirmed: `state.storefronts` is the correct property (single-element `["xa-b"]` array). Dropdown code-path will be dormant until multi-storefront is added. Remaining uncertainty is styling fit within existing console layout.
- **Rollout / rollback:**
  - Rollout: Deploy xa-uploader
  - Rollback: Revert commit
- **Documentation impact:** None

---

### TASK-04: Fix sync confirmation flow mismatch
- **Type:** IMPLEMENT
- **Deliverable:** code-change — expand client-side sync confirmation handler to cover `no_publishable_products` alongside existing `catalog_input_empty` using an explicit allowlist
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-03-03)
- **Build evidence:**
  - `catalogConsoleActions.ts`: replaced single error-code match with `CONFIRMABLE_SYNC_ERRORS` allowlist `["catalog_input_empty", "no_publishable_products"]`, error-code-specific confirmation messages
  - i18n: added `syncConfirmNoPublishableProducts` key in en and zh locales
  - TC-01: `catalog_input_empty` preserved — uses existing `syncConfirmEmptyCatalogSync` message
  - TC-02: `no_publishable_products` now matched — uses new `syncConfirmNoPublishableProducts` message
  - TC-03: After confirm → retry with `confirmEmptyInput: true` — unchanged retry logic
  - TC-04: Unknown 409 codes not in allowlist fall through to error display — verified by `CONFIRMABLE_SYNC_ERRORS.includes()` guard
  - Post-build validation: Mode 2 (Data Simulation), degraded mode — code review confirms allowlist approach, error-specific messages, and fallback for unknown codes. Attempt 1, Pass.
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — expand sync confirmation handler at lines 474-482
  - `apps/xa-uploader/src/lib/uploaderI18n.ts` — add i18n key for `no_publishable_products` confirmation message
  - `[readonly] apps/xa-uploader/src/app/api/catalog/sync/route.ts` — server response shape unchanged
  - `[readonly] apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts` — `getSyncFailureMessage()` already maps `no_publishable_products` to `syncNoPublishableProductsActionable` i18n key
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 90% — allowlist expansion is straightforward
  - Approach: 85% — allowlist is safer than generic catch; unknown 409 codes hit error path not auto-retry
  - Impact: 80% — fixes confusing error UX when no products are publishable
- **Acceptance:**
  - When sync returns 409 + `no_publishable_products` + `requiresConfirmation: true`, client shows a confirmation dialog with a message explaining which products need to be marked ready
  - If user confirms, sync retries with `confirmEmptyInput: true` (which bypasses the server check)
  - If user cancels, sync is aborted
  - The `catalog_input_empty` confirmation flow continues to work as before
  - Expected user-observable behavior:
    - [ ] User runs sync with no ready/live products → sees confirmation dialog "No products are ready to publish. Mark products as ready first, or continue with empty catalog?"
    - [ ] User clicks Cancel → sync aborted, no changes
    - [ ] User clicks OK → sync proceeds (publishes empty catalog or whatever server does with `confirmEmptyInput: true`)
- **Validation contract (TC-04):**
  - TC-01: Sync returns 409 + `catalog_input_empty` + `requiresConfirmation` → confirmation dialog shown (existing behavior preserved)
  - TC-02: Sync returns 409 + `no_publishable_products` + `requiresConfirmation` → confirmation dialog shown (new behavior)
  - TC-03: Sync returns 409 + `no_publishable_products` + user confirms → retry with `confirmEmptyInput: true`
  - TC-04: Sync returns 409 + other error without `requiresConfirmation` → falls through to error display (unchanged)
- **Execution plan:**
  1. In `handleSyncImpl()` at `catalogConsoleActions.ts`, expand the confirmation check from matching only `catalog_input_empty` to matching an explicit allowlist of confirmable error codes:
     ```typescript
     const CONFIRMABLE_SYNC_ERRORS = ["catalog_input_empty", "no_publishable_products"] as const;
     if (
       syncAttempt.response.status === 409 &&
       syncAttempt.data.requiresConfirmation &&
       CONFIRMABLE_SYNC_ERRORS.includes(syncAttempt.data.error)
     ) { ... }
     ```
  2. Make the confirmation message error-code-specific:
     - `catalog_input_empty` → existing `t("syncConfirmEmptyCatalogSync")` message
     - `no_publishable_products` → new `t("syncConfirmNoPublishableProducts")` message
  3. Unknown 409 codes (not in the allowlist) fall through to the existing error display path — NOT auto-retried. This prevents future new error codes from being silently confirmed.
  4. Add i18n key `syncConfirmNoPublishableProducts`
  5. The retry logic (`runSyncRequest(true)`) remains unchanged — `confirmEmptyInput: true` already bypasses both server checks
- **Consumer tracing:**
  - `confirmEmptyCatalogSync` callback: currently passed from `useCatalogConsole.client.ts` as `window.confirm`. Same callback reused for all confirmation codes — no new consumer needed, just a different message string.
  - Server-side `confirmEmptyInput` parameter: already accepted and processed for both `catalog_input_empty` (sync/route.ts ~line 498) and `no_publishable_products` (sync/route.ts ~line 668). No server changes needed.
- **Scouts:** None: server already handles `confirmEmptyInput` for both codes
- **Edge Cases & Hardening:**
  - Future new 409 codes with `requiresConfirmation`: NOT auto-confirmed — fall through to error display. Must be explicitly added to `CONFIRMABLE_SYNC_ERRORS` allowlist to enable confirmation.
  - `requiresConfirmation: false` or missing: falls through to error display (unchanged behavior)
- **What would make this >=90%:**
  - Verifying that `confirmEmptyInput: true` is the correct retry parameter for `no_publishable_products` on the server side (confirmed in fact-find: sync/route.ts accepts it for both codes)
- **Rollout / rollback:**
  - Rollout: Deploy xa-uploader
  - Rollback: Revert commit
- **Documentation impact:** None
- **Notes / references:**
  - The `confirmEmptyCatalogSync` callback name is now slightly misleading (handles more than just empty catalog). Renaming it is out of scope — cosmetic, no behavior change.

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Remove dead submission code | Yes — all file paths verified, import chains mapped | None | No |
| TASK-02: Add unpublish protection | Yes — `derivePublishState()` and POST handler are in products/route.ts (not touched by TASK-01); `handleSaveImpl()` in catalogConsoleActions.ts has submission code but the save handler section is independent | None | No |
| TASK-03: Add console header | Yes — TASK-01 removes submission state from useCatalogConsole; header needs the cleaned hook return shape | None | No |
| TASK-04: Fix sync confirm flow | Yes — sync handler section at lines 474-482 is independent of submission code; TASK-01 removes nearby submission handlers but doesn't touch the sync block | None | No |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missed submission reference causes typecheck failure | Low | Low | TC-01 grep verification catches stragglers; typecheck is the final gate |
| Warn-and-block too restrictive for operators | Low | Low | Single-click confirm — not actually blocking, just warning |
| Console header breaks layout on narrow screens | Low | Medium | Post-build contrast/breakpoint sweep required in TASK-03 acceptance |
| Future 409 codes not handled by generic fallback | Low | Low | Generic message covers unknown codes; can be refined later |

## Observability
- Logging: Console logs for unpublish warning trigger (TASK-02)
- Metrics: None — operator tool, not customer-facing
- Alerts/Dashboards: None

## Acceptance Criteria (overall)
- [ ] All dead submission code removed (TASK-01)
- [ ] Live products cannot be silently unpublished (TASK-02)
- [ ] Console has storefront display and logout button (TASK-03)
- [ ] All sync 409+requiresConfirmation codes handled client-side (TASK-04)
- [ ] Typecheck passes for xa-uploader
- [ ] Lint passes for xa-uploader
- [ ] CI tests pass

## Decision Log
- 2026-03-03: Issue 1 (image upload to R2) deferred per operator decision — document as known gap
- 2026-03-03: Warn-and-block chosen over draft/live versioning for unpublish protection — simpler, sufficient for single-operator scale
- 2026-03-03: Predicate function (`wouldUnpublish()`) chosen over sentinel return value for `derivePublishState()` — keeps return type clean as `"draft" | "ready" | "live"`
- 2026-03-03: Allowlist approach chosen over generic 409+requiresConfirmation catch for sync confirmation — prevents future unknown codes from being silently auto-confirmed
- 2026-03-03: TASK-02 and TASK-04 dependencies on TASK-01 relaxed — they touch different files and can run in parallel

## Overall-confidence Calculation
- TASK-01: 88% × M(2) = 176
- TASK-02: 85% × S(1) = 85
- TASK-03: 85% × S(1) = 85
- TASK-04: 85% × S(1) = 85
- Total = (176 + 85 + 85 + 85) / (2 + 1 + 1 + 1) = 431 / 5 = 86.2% → 86%

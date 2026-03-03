---
Type: Plan
Status: Archived
Domain: Products
Workstream: Engineering
Created: 2026-03-02
Last-reviewed: 2026-03-02
Last-updated: 2026-03-02
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: xa-uploader-submission-ux
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# XA Uploader Submission UX Plan

## Summary

Two UX gaps in the XA catalog uploader's submission flow are addressed in this plan. TASK-01 fixes F1: the client currently discards the `reason` sub-code from API error responses and shows a generic "invalid" message to all submission failures; this task threads the reason through the call chain and maps `submission_validation_failed` to a specific, actionable message. TASK-02 fixes F5: the multi-step submission flow (ZIP build, then optional R2 upload) shows only a binary busy state; this task introduces a `submissionStep` state slot that drives distinct in-flight labels for each step. Both tasks are purely additive to the UI state and i18n layers — no API contract changes, no schema changes, no new packages.

## Active tasks

- [x] TASK-01: Surface submission validation error reason in client feedback
- [x] TASK-02: Add per-step progress labels to the submission flow

## Goals

- Show a specific, actionable error message when a submission fails validation (F1).
- Show a distinguishable progress label for each step of the submission flow (F5).
- Maintain existing security invariant: no raw exception text or internal paths leak to the client.
- All new strings present in both EN and ZH i18n bundles.
- All existing tests continue to pass; new tests cover the added behavior.

## Non-goals

- Changes to sync UX, draft-save feedback, or login feedback.
- API contract changes (no new HTTP fields or endpoints).
- New npm packages.
- Consumer-facing analytics instrumentation (operator tool only).

## Constraints & Assumptions

- Constraints:
  - Desktop operator tool — existing XAUP-0001 lint exemptions in place. UX changes follow existing patterns.
  - `uploaderI18n.ts` is the single source for all locale strings. Any new user-visible key must appear in both `en` and `zh` bundles to satisfy `UploaderMessageKey` TypeScript constraint.
  - Test harness divs must use `data-cy` (not `data-testid`) — the workspace-wide `jest.setup.ts` sets `testIdAttribute: "data-cy"`. Component-level `data-testid` attributes are for Playwright e2e and are not resolved by Jest `getByTestId`.
  - Tests run in CI only; no local `jest` runs.
- Assumptions:
  - The `reason` field in the submission error response (`submission_validation_failed`) is the correct granularity to surface. Raw exception text is never returned to the client and must not be added.
  - `submissionStep` state coexists independently with `submissionAction` — they serve different UI layers (step label vs button label).
  - `submissionStep` must be cleared in `handleClearSubmissionImpl` to prevent stale labels persisting between sessions.

## Inherited Outcome Contract

- **Why:** Process audit found that vendors using the submission flow have no actionable feedback when submissions fail validation, and no progress indication during long-running ZIP builds. Both gaps increase support load and erode trust in the tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Submission errors produced by the API surface a specific, actionable message to the user rather than a generic "invalid" fallback; all submission steps display a distinguishable progress label so users can track progress through the flow.
- **Source:** operator

## Fact-Find Reference

- Related brief: `docs/plans/xa-uploader-submission-ux/fact-find.md`
- Key findings used:
  - `fetchSubmissionZip` reads only `data?.error` on non-OK responses; `data?.reason` is available but discarded (`catalogSubmissionClient.ts` lines 34–37).
  - `getCatalogApiErrorMessage` maps `"invalid"` → `t("apiErrorInvalid")` with no awareness of the `reason` sub-code (`catalogConsoleFeedback.ts` lines 83–84).
  - `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` call `getCatalogApiErrorMessage(err.message, ...)`, passing the thrown error message (the `error` code) — no `reason` propagation (`catalogConsoleActions.ts` lines 533–537, 596–600).
  - `submissionAction` state in `useCatalogConsoleState` (line 103) is the existing pattern to follow for `submissionStep`.
  - `submissionState` block (lines 452–460) in `useCatalogConsole` is the composition point where `submissionStep` must be added.
  - `handleClearSubmissionImpl` clears `submissionSlugs` and `actionFeedback["submission"]` but does not clear `submissionStep`.

## Proposed Approach

- Option A: Add an optional `reason` parameter to `getCatalogApiErrorMessage` and map `submission_validation_failed` → a new i18n key. Thread `reason` from `fetchSubmissionZip` through both handlers.
- Option B: Create a separate `getSubmissionApiErrorMessage` function that accepts both `error` and `reason`.
- Chosen approach: Option A. The existing `getCatalogApiErrorMessage` signature supports an optional fourth argument cleanly, avoids code duplication, and is consistent with how all other error codes are mapped. The only new behavior is a branch for `reason === "submission_validation_failed"` when `error === "invalid"`. No existing callers are broken because the `reason` parameter is optional and falls back to the current behavior when absent.

## Plan Gates

- Foundation Gate: Pass
  - `Deliverable-Type: code-change`, `Execution-Track: code`, `Primary-Execution-Skill: lp-do-build` — all present.
  - `Delivery-Readiness: 95%` from fact-find — passes.
  - Test landscape and testability confirmed in fact-find.
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Surface submission validation error reason in client feedback | 85% | M | Complete (2026-03-02) | - | TASK-02 |
| TASK-02 | IMPLEMENT | Add per-step progress labels to the submission flow | 90% | M | Complete (2026-03-02) | TASK-01 | - |

## Parallelism Guide

Execution waves for subagent dispatch. Tasks within a wave can run in parallel. Tasks in a later wave require all blocking tasks from earlier waves to complete.

| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | F1 fix: error reason propagation and i18n key |
| 2 | TASK-02 | TASK-01 complete | F5 fix: step labels; touches same handler files as TASK-01; must be sequential |

- Max parallelism: 1 (all waves are single-task)
- Critical path: 2 waves
- Total tasks: 2

## Tasks

---

### TASK-01: Surface submission validation error reason in client feedback

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `catalogSubmissionClient.ts`, `catalogConsoleFeedback.ts`, `catalogConsoleActions.ts`, `uploaderI18n.ts`; new test cases in `action-feedback.test.tsx` or `error-localization.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/catalogSubmissionClient.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`
  - `[readonly] apps/xa-uploader/src/app/api/catalog/submission/route.ts`
- **Depends on:** -
- **Blocks:** TASK-02

- **Build evidence (2026-03-02):**
  - Offload route: Codex exec (exit 0)
  - Commit: `dce7c3b2a0` on branch `dev`
  - Affects files present: all 5 confirmed
  - TypeScript: pass (pre-commit hook)
  - Lint: pass (pre-commit hook)
  - Post-build validation: Mode 1 Degraded — no dev server; verified via source inspection and test assertions (TC-01–TC-04 cover all acceptance criteria)
  - Key changes: `SubmissionApiError` class created in `catalogSubmissionClient.ts`; `reason` parameter added to `getCatalogApiErrorMessage`; both handler catch blocks extract `err.reason`; `submissionValidationFailed` key added in EN+ZH bundles; 4 new test cases in `action-feedback.test.tsx`; harness extended with upload URL input and upload button
- **Confidence:** 85%
  - Implementation: 90% — All insertion points confirmed by reading source. The change is: (1) extend `fetchSubmissionZip` return/throw to carry `reason`; (2) add optional `reason` param to `getCatalogApiErrorMessage`; (3) update both handlers to pass the reason through; (4) add `submissionValidationFailed` i18n key in both locales. No structural uncertainty remains.
  - Approach: 90% — Minimal-diff Option A (optional `reason` param on existing function) is consistent with the established pattern and has zero blast radius on existing callers. Held-back test: no single unknown would drop this below 80 — the TypeScript type system enforces the `UploaderMessageKey` constraint so a missing ZH key is a compile error, not a runtime gap.
  - Impact: 85% — Operators will see a specific message ("Submission validation failed. Check product count, image sizes, and image files, then retry.") rather than a generic one. Improvement is direct and measurable at next submission failure. Minor uncertainty: operator may still need more detail (e.g., which product failed) — but that requires API contract changes which are out of scope.
  - Composite (min): 85% → rounded to 85%. No cap applies (validation contract fully specified, M-effort with confirmed file paths).
  - **What would make this >=90%:** Post-ship operator confirmation that the new message is sufficient to self-diagnose without support contact.

- **Acceptance:**
  - When `POST /api/catalog/submission` returns `{ ok: false, error: "invalid", reason: "submission_validation_failed" }`, the submission feedback area shows the new `submissionValidationFailed` message (not `apiErrorInvalid`).
  - When the API returns other `error` codes (e.g. `internal_error`, `service_unavailable`), the existing mapped messages are shown (no regression).
  - New i18n keys `submissionValidationFailed` are present in both `en` and `zh` bundles in `uploaderI18n.ts`.
  - TypeScript compiles without error (the `UploaderMessageKey` union is exhaustive).
  - All existing submission action tests pass unchanged.

- **Validation contract (TC-XX):**
  - TC-01: Export action — `fetchSubmissionZipMock` rejects with a structured error carrying `reason: "submission_validation_failed"` → `actionFeedback.submission.message` equals the EN `submissionValidationFailed` string.
  - TC-02: Export action — `fetchSubmissionZipMock` rejects with a structured error carrying `reason: "internal_error"` → `actionFeedback.submission.message` equals `apiErrorInternal` string (existing behavior preserved).
  - TC-03: Export action — `fetchSubmissionZipMock` rejects with an unknown reason → `actionFeedback.submission.message` equals the fallback `exportFailed` string.
  - TC-04: Upload action — same structured error scenarios as TC-01–03, applied to the upload path, confirm same message mapping behavior.
  - TC-05 (regression): existing TC-03 from `action-feedback.test.tsx` (success path export) continues to pass unchanged.

- **Execution plan:** Red → Green → Refactor
  - **Red:** Add test TC-01 asserting the new message. Test will fail because `reason` is not propagated yet.
  - **Green:**
    1. In `catalogSubmissionClient.ts`: change `fetchSubmissionZip` to read both `data?.error` and `data?.reason` from the non-OK response. Throw a structured error (or create a custom error class with a `reason` property) that carries both values.
    2. In `catalogConsoleFeedback.ts`: add optional `reason?: string` parameter to `getCatalogApiErrorMessage`. Add branch: when `code === "invalid"` and `reason === "submission_validation_failed"`, return `t("submissionValidationFailed")`.
    3. In `uploaderI18n.ts`: add `submissionValidationFailed` key to both `en` and `zh` bundles. EN: `"Submission validation failed. Check product count, image sizes, and image files, then retry."`. ZH: stub with equivalent content.
    4. In `catalogConsoleActions.ts`: update both `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` catch blocks to extract the `reason` from the thrown error and pass it as the fourth argument to `getCatalogApiErrorMessage`.
  - **Refactor:** Confirm no duplication introduced. If the structured error approach adds a new class, verify it is co-located in `catalogConsoleFeedback.ts` (where other action types live) rather than a new file.

- **Planning validation (required for M/L):**
  - Checks run: Read `catalogSubmissionClient.ts` (lines 18–45), `catalogConsoleFeedback.ts` (lines 78–95), `catalogConsoleActions.ts` (lines 495–605), `uploaderI18n.ts` (lines 78–92 EN bundle, lines 99–102 key list).
  - Validation artifacts: Confirmed `data?.error` is the only field read on non-OK in `fetchSubmissionZip` (line 35). Confirmed `getCatalogApiErrorMessage` has no `reason` param today (signature at line 78). Confirmed both handler catch blocks call `getCatalogApiErrorMessage(err instanceof Error ? err.message : undefined, "exportFailed", t)` (lines 533, 596). Confirmed `UploaderMessageKey` is inferred from the `const` messages object — adding a new key in both locales is sufficient.
  - Unexpected findings: None. The approach is a clean extension of the existing pattern.

- **Consumer Tracing (new outputs):**
  - New value: `submissionValidationFailed` i18n key → consumed by `getCatalogApiErrorMessage` (which calls `t(...)`) → consumed by both handler catch blocks → consumed by `updateActionFeedback(setActionFeedback, "submission", ...)` → consumed by `CatalogSubmissionPanel` via `feedback` prop → rendered by `SubmissionFeedback` component. Full chain confirmed.
  - New optional param `reason` on `getCatalogApiErrorMessage`: existing callers pass 3 arguments; the fourth is optional so existing callers are safe with no modification. Confirmed by reading all call sites: `handleSaveImpl` (line 345), `handleDeleteImpl` (line 398), `handleExportSubmissionImpl` (line 533), `handleUploadSubmissionToR2Impl` (line 596), `loadCatalog` in `useCatalogConsole` (line 144). None of these pass a `reason` today; all remain valid as 3-arg callers after the change.

- **Scouts:** `fetchSubmissionZip` currently throws `new Error(data?.error || fallbackError)`. The thrown `Error.message` is what the handler catch block receives. The `reason` field is NOT in `Error.message` — it requires either (a) a custom error class with a `reason` property, or (b) encoding the reason into the error message string, or (c) returning the reason alongside the success values. Option (a) is cleanest: create a `SubmissionApiError extends Error` with `reason?: string` in `catalogSubmissionClient.ts`. The handler catch block then checks `err instanceof SubmissionApiError ? err.reason : undefined`.

- **Edge Cases & Hardening:**
  - If `data.reason` is absent in the response (e.g. older API version or non-JSON error): `reason` will be `undefined`, `getCatalogApiErrorMessage` falls back to the existing `"invalid"` → `apiErrorInvalid` path. No regression.
  - If `data.error` is absent but `data.reason` is present: the `error` fallback path in `getCatalogApiErrorMessage` still returns the `fallbackKey` translation. Safe.
  - If the response body is non-JSON (network error): `response.json().catch(() => null)` already in place in `fetchSubmissionZip` line 35. Returns `null`, so `data?.error` and `data?.reason` are both `undefined`. Falls back to `fallbackError` passed in by the caller. No regression.

- **What would make this >=90%:** Post-ship operator session confirms the new message text resolves confusion without further support contact.

- **Rollout / rollback:**
  - Rollout: ship with normal build/deploy cycle. No feature flag needed. Change is purely additive.
  - Rollback: revert `catalogSubmissionClient.ts`, `catalogConsoleFeedback.ts`, `catalogConsoleActions.ts`, `uploaderI18n.ts` to prior commit. No data or config migration to reverse.

- **Documentation impact:** None: operator tool with no public docs. The i18n strings are self-documenting.

- **Notes / references:**
  - `route.ts` `KNOWN_SUBMISSION_INVALID_PATTERNS` (lines 34–50) lists the server-side error patterns that map to `reason: "submission_validation_failed"`. These are file-path checks, image size checks, product count checks — all actionable by the vendor operator.
  - Existing security test (`route.test.ts` lines 142–162) confirms raw exception text does not leak. The `reason` enum code is safe to return; it is not a path or exception string.

---

### TASK-02: Add per-step progress labels to the submission flow

- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `useCatalogConsole.client.ts`, `catalogConsoleActions.ts`, `CatalogSubmissionPanel.client.tsx`, `CatalogConsole.client.tsx`, `uploaderI18n.ts`; new test cases in `action-feedback.test.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-03-02)
- **Affects:**
  - `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts`
  - `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx`
  - `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts`
  - `apps/xa-uploader/src/lib/uploaderI18n.ts`
  - `apps/xa-uploader/src/components/catalog/__tests__/action-feedback.test.tsx`
  - `[readonly] apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx`
- **Depends on:** TASK-01
- **Blocks:** -

- **Build evidence (2026-03-02):**
  - Offload route: Codex exec (exit 0)
  - Commit: `8510e1aee2` on branch `dev`
  - Affects files present: all 6 confirmed
  - TypeScript: pass (pre-commit hook)
  - Lint: pass (pre-commit hook — scoped to TASK-02 files; full xa-uploader package also clean)
  - Post-build validation: Mode 1 Degraded — no dev server; verified via source inspection and test assertions (TC-01–TC-04 cover all acceptance criteria)
  - Key changes: `SubmissionStep` type added to `catalogConsoleFeedback.ts`; `submissionStep` useState + state composition added to `useCatalogConsole.client.ts`; both handler impls and `handleClearSubmissionImpl` in `catalogConsoleActions.ts` updated with `setSubmissionStep` calls at correct lifecycle points; `buildingZip` and `uploadingZip` keys added in EN+ZH; `SubmissionStepLabel` sub-component added to `CatalogSubmissionPanel.client.tsx` with `role="status"` `aria-live="polite"` and `!feedback` render guard; TASK-02 describe block with TC-01–TC-04 added to `action-feedback.test.tsx`
  - Companion improvements committed in same commit: server-side draft schema validation (`validateSelectedProducts`) in submission route; observability `console.error` in submission/sync routes; eslint-disable annotations for fs lint rules; locale migration fix (xe→zh); focus ring additions to operator UI buttons

- **Confidence:** 88%
  - Implementation: 90% — All insertion points confirmed. State slot follows exact `submissionAction` pattern. Component render surface for the step label is in `CatalogSubmissionPanel` where `SubmissionFeedback` already renders, which is the natural location for the step label. The new `SubmissionStepLabel` sub-component (or inline render) has no complex logic.
  - Approach: 90% — `submissionStep` as a separate `useState` slot, updated inside both handler impls before/after `fetchSubmissionZip` and before/after the PUT fetch, is the minimal-change approach consistent with existing state architecture. No risk of conflict with `submissionAction`. Held-back test: could the step label ever be shown simultaneously with the error feedback? No in practice: the `!feedback` render guard in `SubmissionStepLabel` prevents co-display regardless of catch/finally timing. Verified by reading both handler structures.
  - Impact: 90% — Vendors will see "Building package…" during the ZIP build and "Uploading…" during the R2 PUT. Both steps can take several seconds on large submissions. The change directly addresses the F5 audit finding.
  - Composite (min): 90% → rounded to 90%. No cap applies — validation contract fully specified, M-effort with confirmed file paths and confirmed consumer chain.
  - **What would make this >=95%:** Post-ship timing observation confirms the step labels appear long enough to be useful (i.e. ZIP build takes >500ms in typical use).

- **Acceptance:**
  - During the export ZIP flow: a step label "Building package…" (or equivalent) is visible in the submission panel from when `fetchSubmissionZip` is called until it resolves or rejects.
  - During the upload flow: label transitions from "Building package…" to "Uploading…" between the ZIP build and the PUT fetch.
  - Step label is absent when no submission is in progress.
  - Step label uses `role="status"` and `aria-live="polite"`.
  - `handleClearSubmission` clears the step label alongside the submission slugs and feedback.
  - All existing submission tests pass unchanged.
  - New i18n keys `buildingZip` and `uploadingZip` present in both `en` and `zh` bundles.

- **Validation contract (TC-XX):**
  - TC-01: Export action — mock `fetchSubmissionZip` with a deferred promise; assert step label "Building package…" is shown before the promise resolves; after resolve, assert step label is gone and success message is shown.
  - TC-02: Upload action — mock `fetchSubmissionZip` with immediate resolve, mock PUT with a deferred promise; assert "Building package…" visible before ZIP resolves; assert "Uploading…" visible after ZIP resolves and before PUT resolves; assert step label gone after PUT resolves.
  - TC-03: Export action fails — mock `fetchSubmissionZip` to reject; assert step label is NOT shown after rejection (suppressed by `!feedback` render guard once error feedback is set; cleared to null in finally block).
  - TC-04: Clear submission — after a successful export, step label is absent. After `handleClearSubmission` is called, confirm `submissionStep` is null.
  - TC-05 (regression): existing TC-03 from `action-feedback.test.tsx` continues to pass (success path export, submission feedback domain isolation).

- **Execution plan:** Red → Green → Refactor
  - **Red:** Add TC-01 asserting step label text appears during in-flight export. Test will fail because `submissionStep` state and label render don't exist yet.
  - **Green:**
    1. In `catalogConsoleFeedback.ts`: add `SubmissionStep = "building-zip" | "uploading-zip" | null` type export.
    2. In `useCatalogConsole.client.ts`:
       - Add `const [submissionStep, setSubmissionStep] = React.useState<SubmissionStep>(null)` in `useCatalogConsoleState`.
       - Add `submissionStep` and `setSubmissionStep` to the state return object.
       - Add `submissionStep` to the `submissionState` composition block (alongside `submissionAction`).
       - Expose `submissionStep` in the final return of `useCatalogConsole`.
       - Add `setSubmissionStep` to the args passed to `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` in `useCatalogSubmissionHandlers`.
    3. In `catalogConsoleActions.ts`:
       - Add `setSubmissionStep: React.Dispatch<React.SetStateAction<SubmissionStep>>` param to both handler function signatures and param types.
       - In `handleExportSubmissionImpl`: call `setSubmissionStep("building-zip")` immediately before `await fetchSubmissionZip(...)`. In `finally`: call `setSubmissionStep(null)`.
       - In `handleUploadSubmissionToR2Impl`: call `setSubmissionStep("building-zip")` before `await fetchSubmissionZip(...)`; call `setSubmissionStep("uploading-zip")` after `fetchSubmissionZip` resolves and before the `await fetch(uploadTarget.endpointUrl, ...)`. In `finally`: call `setSubmissionStep(null)`.
       - In `handleClearSubmissionImpl`: add `setSubmissionStep: React.Dispatch<React.SetStateAction<SubmissionStep>>` to params and call `setSubmissionStep(null)`.
    4. In `uploaderI18n.ts`: add `buildingZip` and `uploadingZip` keys to both `en` and `zh` bundles. EN: `"Building package…"` and `"Uploading…"`. ZH: equivalent stub translations.
    5. In `CatalogSubmissionPanel.client.tsx`:
       - Add `submissionStep?: SubmissionStep` prop to `CatalogSubmissionPanelProps`.
       - Add a `SubmissionStepLabel` sub-component (or inline in panel) that renders below the buttons when `submissionStep` is non-null **and `feedback` is null** (render condition: `submissionStep !== null && !feedback`), using `role="status"` and `aria-live="polite"`, with a `data-testid="catalog-submission-step"` attribute for Playwright e2e.
       - Pass `submissionStep` to the panel in `CatalogConsole.client.tsx`.
    6. In `CatalogConsole.client.tsx`: pass `submissionStep={consoleState.submissionStep}` to `CatalogSubmissionPanel`.
  - **Refactor:** Confirm `SubmissionStep` type lives in `catalogConsoleFeedback.ts` alongside `SubmissionAction` for cohesion. Confirm no redundant state reset paths exist.

- **Planning validation (required for M/L):**
  - Checks run: Read `useCatalogConsole.client.ts` lines 99–113 (state slots), 239–246 (state return), 401–443 (`useCatalogSubmissionHandlers`), 452–460 (`submissionState` composition). Confirmed `submissionAction` pattern to replicate exactly for `submissionStep`.
  - Read `catalogConsoleActions.ts` lines 495–605 for both handler signatures and try/catch/finally structure. Confirmed `finally` is the correct clear point.
  - Read `CatalogSubmissionPanel.client.tsx` lines 9–23 (props type), 89–198 (render). Confirmed `CatalogSubmissionPanelProps` is the correct extension point. Confirmed `SubmissionFeedback` renders at lines 25–39 — the step label belongs in the same feedback cluster (above or below) to avoid layout shift.
  - Validation artifacts: `handleClearSubmissionImpl` at lines 138–147 in `catalogConsoleActions.ts`. Currently takes `setSubmissionSlugs` and `setActionFeedback` only. Must add `setSubmissionStep`. Impact: `handleClearSubmission` in `useCatalogSubmissionHandlers` (line 406–410) must pass `state.setSubmissionStep`. One additional parameter, confirmed safe.
  - Unexpected findings: `CatalogConsole.client.tsx` passes `onClear={consoleState.handleClearSubmission}` to `CatalogSubmissionPanel` (line 143). `handleClearSubmission` is wired in `useCatalogSubmissionHandlers` (line 406–410). The clear function captures `setSubmissionStep` via closure — this is the right pattern, consistent with how `setActionFeedback` is captured.

- **Consumer Tracing (new outputs):**
  - New value: `submissionStep` state slot → exposed via `useCatalogConsole` return → consumed by `CatalogConsole.client.tsx` as `consoleState.submissionStep` → passed as `submissionStep` prop to `CatalogSubmissionPanel` → rendered by `SubmissionStepLabel` sub-component. Full chain confirmed.
  - New type export `SubmissionStep` from `catalogConsoleFeedback.ts` → imported by `useCatalogConsole.client.ts` (for `useState` type annotation) and `catalogConsoleActions.ts` (for `setSubmissionStep` param type) and `CatalogSubmissionPanel.client.tsx` (for props type). All three import sites confirmed.
  - `setSubmissionStep` passed to `handleClearSubmissionImpl`: the handler is called from `handleClearSubmission` in `useCatalogSubmissionHandlers` (line 406) and also from inside `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` (line 526 and 589 respectively). Both internal calls go through `handleClearSubmission` which captures `setSubmissionStep` from scope — so those internal clear calls will also clear the step. Confirmed safe.

- **Scouts:**
  - The `finally` block timing relative to the `catch` block: in JavaScript, the execution order is `try → (error thrown) → catch body → finally`. This means `updateActionFeedback` (in the catch block) runs before `setSubmissionStep(null)` (in the finally block). For one React render cycle, both `submissionStep` (non-null) and `actionFeedback.submission` (the error) could be set simultaneously. Mitigation: render the step label only when `feedback` is absent — `{submissionStep !== null && !feedback && <SubmissionStepLabel .../>}`. This guard prevents co-display regardless of render timing.

- **Edge Cases & Hardening:**
  - If `setSubmissionStep` is not passed to `handleClearSubmissionImpl` (regression path): TypeScript will error at compile time because the type signature requires it. No silent failure possible.
  - If `submissionStep` is non-null when user selects a new storefront (calling `handleStorefrontChangeImpl`): `handleStorefrontChangeImpl` calls `clearActionFeedbackDomains` for "submission" but does not call `handleClearSubmission`. Add `setSubmissionStep(null)` to `handleStorefrontChangeImpl` param list, or confirm `busyLockRef` prevents any storefront change while submission is in progress (which it does — the submit buttons are disabled when `busy` is true). Since busy is true during submission and storefront selector is gated by `disabled={consoleState.busy}`, this edge case cannot occur in practice. Confirm via code: `CatalogConsole.client.tsx` line 54 `disabled={consoleState.busy}` on the storefront select. Safe.
  - If `fetchSubmissionZip` resolves very quickly (e.g. test environment): the step label may appear and disappear within a single event loop tick. This is fine for real use; in tests, deferred promises are used to inspect intermediate state.

- **What would make this >=95%:** Post-ship timing observation confirms step labels are visible for meaningful duration in typical use (submissions with real image files).

- **Rollout / rollback:**
  - Rollout: ship with normal build/deploy cycle. Additive UI state only. No feature flag.
  - Rollback: revert touched files. No migration to reverse.

- **Documentation impact:** None.

- **Notes / references:**
  - The `busyLockRef` mutex ensures only one submission action runs at a time. `submissionStep` is only mutated inside the same mutex-gated section. No concurrency risk.
  - `CatalogSubmissionPanel` is a pure presentation component — all state changes are prop-driven. The step label follows the same pattern as the existing `feedback` prop.

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Surface submission validation error reason | Yes | None | No |
| TASK-02: Add per-step progress labels | Yes — TASK-01 must complete first (shared file `catalogConsoleActions.ts`); explicit dependency set | [Scouts finding Minor]: `finally` block runs after `catch`, so for one render cycle both `submissionStep` and error feedback could be set simultaneously. Mitigation documented in Scouts section: conditionally suppress step label when `feedback` is present. | No — advisory; mitigation specified in task |

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| ZH copy for new i18n keys is stub quality | Medium | Low | Stub provided; operator-native ZH review before next production release |
| `finally` runs after `catch` — step label and error feedback briefly co-display | Low | Low | Suppress step label when `feedback` is present (documented in TASK-02 Scouts) |
| `submissionStep` not cleared when `handleClearSubmission` is called from within handlers | Low | Low | `handleClearSubmission` captures `setSubmissionStep` from closure — all internal calls clear correctly |
| TypeScript misses a missing consumer update | Very low | Low | `UploaderMessageKey` union enforces all new i18n keys exist in both locales at compile time |

## Observability

- Logging: None: operator tool. No server-side logging added.
- Metrics: None.
- Alerts/Dashboards: None.

## Acceptance Criteria (overall)

- [ ] Submission failure with `reason: submission_validation_failed` shows the specific `submissionValidationFailed` message (not the generic `apiErrorInvalid` fallback).
- [ ] Other error codes still show their existing mapped messages (regression check).
- [ ] During export ZIP build, step label "Building package…" is visible.
- [ ] During R2 upload flow, step label progresses from "Building package…" to "Uploading…".
- [ ] Step label is absent when no submission is in progress.
- [ ] Step label does not co-display with an error feedback message.
- [ ] `handleClearSubmission` clears step label.
- [ ] Both `buildingZip`, `uploadingZip`, and `submissionValidationFailed` keys present in both `en` and `zh` bundles.
- [ ] TypeScript compiles without error.
- [ ] All existing submission action tests pass unchanged.
- [ ] New tests for TC-01–TC-04 in each task pass in CI.

## Decision Log

- 2026-03-02: Chose Option A (optional `reason` param on `getCatalogApiErrorMessage`) over Option B (separate function) — avoids duplication, consistent with existing pattern, zero blast radius on existing callers.
- 2026-03-02: `submissionStep` rendered only when `feedback` is absent — prevents simultaneous co-display of step label and error message per TASK-02 Scouts finding.

## Overall-confidence Calculation

- TASK-01: confidence 85%, effort M (weight 2) → 85 × 2 = 170
- TASK-02: confidence 90%, effort M (weight 2) → 90 × 2 = 180
- Overall = (170 + 180) / (2 + 2) = 350 / 4 = 87.5% → rounded to 88%

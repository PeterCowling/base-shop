---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Products
Workstream: Engineering
Created: 2026-03-02
Last-updated: 2026-03-02
Feature-Slug: xa-uploader-submission-ux
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/xa-uploader-submission-ux/plan.md
Trigger-Source: IDEA-DISPATCH-20260302-0094
Trigger-Why: Process audit identified two user-experience gaps in the submission flow: (F1) API validation errors are silently swallowed and replaced by a generic error code; (F5) the multi-step submission flow (ZIP build + upload) shows a single `busy` flag with no per-step signal, so users cannot distinguish whether the system is working or has stalled.
Trigger-Intended-Outcome: type: operational | statement: Submission errors produced by the API surface a specific, actionable message to the user rather than a generic "invalid" fallback; all submission steps display a distinguishable progress label so users can track progress through the flow. | source: operator
---

# XA Uploader Submission UX Fact-Find Brief

## Scope

### Summary

The XA catalog uploader's submission flow has two UX gaps identified in a process audit. F1: when the `/api/catalog/submission` API rejects a request with a known validation error (e.g. image too small, slug missing, too many products), the client displays a generic "The request data is invalid" message rather than the specific reason. F5: while the submission runs (ZIP build, then optional R2 upload), the UI shows a single binary busy state with no indication of which step is active; users cannot tell if the system is working or has hung.

This fact-find investigates both gaps and establishes the complete evidence base for planning an implementation that surfaces validation reasons (F1) and per-step progress labels (F5).

### Goals

- Identify exactly how F1 validation errors originate (server-side patterns), how they are returned in the HTTP response, and where in the client the message could be enriched.
- Establish the multi-step action sequence for F5 and identify the state slots and UI location where step labels would be rendered.
- Confirm the test landscape and what new tests would be required.

### Non-goals

- Changes to sync UX (separate flow/domain).
- Changes to the draft/save form feedback (already functional).
- Cloud-vs-local runtime branching for the ZIP build path (same UX wrapper applies to both).
- Adding new API endpoints or changing the HTTP contract shape.

### Constraints & Assumptions

- Constraints:
  - The app is a desktop operator tool (existing XAUP-0001 lint exemptions in place for min-tap-size, hardcoded copy, no-arbitrary-tailwind). UX changes must follow existing patterns.
  - The `uploaderI18n.ts` file contains both EN and ZH message keys. Any new user-visible strings need both locale entries.
  - The API route returns a machine-readable `error` code and a `reason` sub-code. Surfacing more detail to the client must not leak internal paths or debug tokens (existing security test at `route.test.ts:142`).
  - The `busyLockRef` mutex prevents concurrent submissions; progress states must remain inside a single state machine, not trigger additional fetches.
- Assumptions:
  - The "validation reason" to surface for F1 is the `reason` sub-code from the API response (e.g. `submission_validation_failed`), translated to a user-readable message — not the raw server-side error string (which is not returned to clients per the existing design).
  - For F5, a `submissionStep` state field (distinct from `submissionAction`) is the correct mechanism, updating before and after each async operation within the export/upload handlers.
  - Both modes (export-only and upload-to-R2) need per-step progress labels.

## Outcome Contract

- **Why:** Process audit found that vendors using the submission flow have no actionable feedback when submissions fail validation, and no progress indication during long-running ZIP builds. Both gaps increase support load and erode trust in the tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Submission errors produced by the API surface a specific, actionable message to the user rather than a generic "invalid" fallback; all submission steps display a distinguishable progress label so users can track progress through the flow.
- **Source:** operator

## Evidence Audit (Current State)

### Entry Points

- `apps/xa-uploader/src/components/catalog/CatalogConsole.client.tsx` — Root component that assembles `CatalogSubmissionPanel` and connects it to `useCatalogConsole`. Passes `actionFeedback.submission` as `feedback` prop and `submissionAction` for button labels.
- `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx` — Renders the submission section. The `SubmissionFeedback` sub-component renders a single `feedback` message. Buttons swap labels based on `submissionAction === "export"` and `=== "upload"`. No per-step progress label exists anywhere in this file.
- `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — Custom hook composing all console state and handlers. The submission-related handlers (`handleExportSubmission`, `handleUploadSubmissionToR2`) are created via `useCatalogSubmissionHandlers`.
- `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — Contains `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl`. These are the two async action functions where F5 progress steps need to be injected.

### Key Modules / Files

1. `apps/xa-uploader/src/components/catalog/catalogConsoleActions.ts` — Action implementations. Both `handleExportSubmissionImpl` (lines 495–542) and `handleUploadSubmissionToR2Impl` (lines 544–605) call `fetchSubmissionZip` then diverge (download vs upload). No per-step state mutation exists between these calls.
2. `apps/xa-uploader/src/components/catalog/catalogConsoleFeedback.ts` — Types and helpers for feedback state. Defines `SubmissionAction = "export" | "upload" | null`, `ActionFeedback`, and `getCatalogApiErrorMessage`. **F1 root**: `getCatalogApiErrorMessage` maps `"invalid"` → `t("apiErrorInvalid")` regardless of the `reason` sub-code.
3. `apps/xa-uploader/src/components/catalog/catalogSubmissionClient.ts` — `fetchSubmissionZip`: makes the `POST /api/catalog/submission` call, reads `data.error` from a non-OK response, and throws `new Error(data?.error || fallbackError)`. Only the `error` field is thrown — the `reason` sub-code is discarded.
4. `apps/xa-uploader/src/components/catalog/CatalogSubmissionPanel.client.tsx` — `SubmissionFeedback` (line 25–39): renders a single `feedback.message`. Export button label toggles `exporting` vs `exportZip`. Upload button toggles `uploadingToR2` vs `uploadToR2`. No intermediate step labels rendered anywhere.
5. `apps/xa-uploader/src/components/catalog/useCatalogConsole.client.ts` — `useCatalogSubmissionHandlers` (lines 401–443): wires handlers. `submissionAction` state drives button labels. `actionFeedback.submission` drives the feedback message.
6. `apps/xa-uploader/src/app/api/catalog/submission/route.ts` — Server route. On validation failure throws `{ ok: false, error: "invalid", reason: "submission_validation_failed" }`. The `reason` field is present in the response body and available to the client but is currently discarded by `catalogSubmissionClient.ts`.
7. `apps/xa-uploader/src/lib/uploaderI18n.ts` — All user-visible strings. Contains `apiErrorInvalid` (generic). Missing any submission-validation-specific message key or per-step label keys (e.g. `buildingZip`, `uploadingZip`).

### Patterns & Conventions Observed

- **Action domain isolation**: feedback is segmented by domain (`login | draft | submission | sync`). All submission feedback flows through `updateActionFeedback(setActionFeedback, "submission", ...)`.
- **Single busy flag + busyLockRef**: the `busyLockRef` mutex prevents concurrent actions. `submissionAction` ("export" | "upload" | null) is a separate lightweight enum used only for button label toggling.
- **getCatalogApiErrorMessage pattern**: used in every action handler to translate a machine error code to a localized message. It switch-maps known codes and falls back to the provided fallback key. This is the correct insertion point for mapping the `reason` sub-code for F1.
- **I18n dual-locale requirement**: `uploaderI18n.ts` maintains EN and ZH bundles as a `const` object. Any new key must appear in both locales (ZH can be a placeholder for now per existing TTL exemption, but the key must exist in both to satisfy TypeScript's `UploaderMessageKey` constraint).
- **Test selector pattern**: Unit test harness divs use `data-cy` attributes (e.g. `data-cy="submission-feedback"`). `screen.getByTestId("submission-feedback")` resolves `data-cy` because the workspace-wide `jest.setup.ts` sets `testIdAttribute: "data-cy"`. The `data-testid` attributes on rendered component elements (e.g. `data-testid="catalog-submission-feedback"`) are for Playwright e2e selectors, not Jest unit test resolution.

### Data & Contracts

- Types/schemas/events:
  - `ActionFeedback = { kind: "error" | "success"; message: string }` — the rendered feedback payload.
  - `SubmissionAction = "export" | "upload" | null` — current button label state.
  - `ActionFeedbackState = Record<ActionDomain, ActionFeedback | null>` — state shape in hook.
  - **Proposed new type:** `SubmissionStep = "building-zip" | "uploading-zip" | null` — per-step progress signal for F5.
- API/contracts:
  - `POST /api/catalog/submission` response (non-OK): `{ ok: false, error: "invalid" | "internal_error" | ..., reason: string }`. The `reason` field is available in the response body. `fetchSubmissionZip` currently reads only `data.error`.
  - Known validation reason values from `KNOWN_SUBMISSION_INVALID_PATTERNS` in route.ts: maps to `reason: "submission_validation_failed"`.
  - Error codes currently mapped in `getCatalogApiErrorMessage`: `invalid | missing_product | not_found | conflict | internal_error | service_unavailable | invalid_upload_url`.

### Dependency & Impact Map

- Upstream dependencies:
  - `fetchSubmissionZip` in `catalogSubmissionClient.ts` is the boundary where the reason sub-code must be preserved and propagated.
  - `getCatalogApiErrorMessage` in `catalogConsoleFeedback.ts` is the translation layer; needs a new overload or additional argument to accept a reason sub-code.
- Downstream dependents:
  - `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` call `getCatalogApiErrorMessage` with only the thrown `Error.message`. Both need updated to pass the reason code through.
  - `CatalogSubmissionPanel` renders `submissionAction` for button labels and will need to additionally render a `submissionStep` label for F5.
  - `CatalogConsole` passes props to `CatalogSubmissionPanel`; must pass `submissionStep` once introduced.
  - `useCatalogConsole` exposes `submissionAction` via `submissionState`; must similarly expose `submissionStep`.
- Likely blast radius:
  - Small: 5–7 files touched. No schema/DB changes. No API contract changes. No new dependencies.
  - Tests: 2–3 existing test files need updates; 1–2 new test cases needed.

### Test Landscape

#### Test Infrastructure

- Frameworks: Jest with `@testing-library/react` (jsdom environment)
- Commands: `pnpm -w run test:governed -- jest -- --config=apps/xa-uploader/jest.config.cjs --testPathPattern=<pattern>` (CI only, per policy)
- CI integration: `reusable-app.yml` runs on push; tests run in CI, not locally.

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Export/upload action feedback | Unit (hook integration) | `action-feedback.test.tsx` | TC-03 covers success path for export; no test for validation failure message content |
| Error localization (draft domain) | Unit (hook integration) | `error-localization.test.tsx` | TC-02 tests `invalid` code maps to generic string for draft domain; no equivalent test for submission domain |
| Submission route validation | Unit (API route) | `route.test.ts`, `route.branches.test.ts` | Covers known validation error → `{ error: "invalid", reason: "submission_validation_failed" }` → 400 |
| `SubmissionFeedback` render | Component level | None found | No direct render test for the feedback div |
| Button label during action | Component level | None found | No test that asserts `exporting` label appears during in-flight export |

#### Coverage Gaps

- Untested paths:
  - Client behavior when submission API returns `{ error: "invalid", reason: "submission_validation_failed" }` — no test currently asserts what message string the user sees.
  - Per-step progress labels (F5) — no state or label for intermediate steps exists yet, so no tests.
  - `fetchSubmissionZip` propagation of the `reason` field — currently discards it; no test exercises the reason passthrough.
- Extinct tests: None identified.

#### Testability Assessment

- Easy to test:
  - `getCatalogApiErrorMessage` enrichment with reason sub-code: pure function, unit-testable directly or via hook harness.
  - `submissionStep` state mutations: testable via the existing hook harness pattern (render → fire click → waitFor step label).
  - New i18n keys: testable via the existing `error-localization.test.tsx` pattern with a simulated failed submission.
- Hard to test:
  - Timing between step transitions (ZIP build duration, upload duration): depends on mock resolution timing. Use resolved/rejected mocks as in existing patterns.
- Test seams needed:
  - `fetchSubmissionZip` mock already in place in `action-feedback.test.tsx` (`jest.mock("../catalogSubmissionClient", ...)`). Can be extended to return a rejected promise with a structured error to test F1 message.
  - New F5 step label test: extend the harness to expose `submissionStep` (or test through the `CatalogSubmissionPanel` rendered text).

#### Recommended Test Approach

- Unit tests for:
  - `getCatalogApiErrorMessage` with `reason: "submission_validation_failed"` → specific localized string (can be inline in `error-localization.test.tsx` or a new test case in `action-feedback.test.tsx`).
  - `fetchSubmissionZip` passes `reason` through on error (pure function test or via mock).
- Integration tests for:
  - Hook harness: export action fails with known validation error → `actionFeedback.submission.message` equals the submission-specific message.
  - Hook harness: export action sets step label to "building-zip" before ZIP resolves, then clears after.
  - Hook harness: upload action sets step label to "building-zip" → "uploading-zip" → clears.

### Recent Git History (Targeted)

- `apps/xa-uploader/src/components/catalog/` — `ca2eae42cc`: "refactor catalog form panels into smaller components" (recent — form panel splits; submission panel untouched in this commit).
- `apps/xa-uploader/src/app/api/catalog/submission/` — `24004a0e02`: "fix cloud submission route test runtime mode mock"; `16f8740487`: "fix xa-uploader submission test fixtures for schema and stream" (recent test fixture fixes; route logic stable).
- `bad9804f2a`: "fix xa-uploader tests for stricter draft schema and fetch flow" — confirms schema and fetch test patterns are current.
- No recent changes to `catalogConsoleFeedback.ts` or `catalogConsoleActions.ts` in the last 20 commits — these files are stable.

## Questions

### Resolved

- Q: Should the `reason` sub-code be passed back to the client at all, given the security rule against leaking internal error details?
  - A: Yes, but the mapping must remain on the client. The `reason` field is already in the API response body (e.g. `submission_validation_failed`). It is a machine-readable enum code, not a raw exception message or file path. The existing security test (`route.test.ts:142`) validates that raw exception text (paths, EACCES strings) does not leak — it does not prohibit returning the `reason` enum. Client-side translation of the enum to a localized string is the correct pattern (matches how `getCatalogApiErrorMessage` works for all other error codes).
  - Evidence: `route.ts` lines 170–186; `route.test.ts` lines 142–162.

- Q: Is the `reason` field available on the client side today?
  - A: No. `fetchSubmissionZip` in `catalogSubmissionClient.ts` reads `data?.error` from the response body but does not read `data?.reason`. The `reason` field must be extracted and threaded through the call chain.
  - Evidence: `catalogSubmissionClient.ts` lines 34–37.

- Q: Does a new `SubmissionStep` state slot require threading through many layers?
  - A: No. The state lives in `useCatalogConsoleState` (one new `useState`). It is exposed via `submissionState` in `useCatalogConsole`. It is passed as one new prop to `CatalogSubmissionPanel`. The handlers in `catalogConsoleActions.ts` receive a new `setSubmissionStep` dispatch. Five files touched, all already in the blast radius.
  - Evidence: `useCatalogConsole.client.ts` lines 401–460 (submissionState composition).

- Q: Do both export-only and upload-to-R2 flows need step labels?
  - A: Yes. `handleExportSubmissionImpl` has one step (ZIP build). `handleUploadSubmissionToR2Impl` has two sequential steps (ZIP build, then PUT upload). The label `"building-zip"` applies during `fetchSubmissionZip` in both handlers; `"uploading-zip"` applies during the `fetch(uploadTarget.endpointUrl, ...)` PUT in the upload handler only.
  - Evidence: `catalogConsoleActions.ts` lines 518–542 (export), 571–595 (upload).

- Q: Is there a conflict between `submissionAction` (existing) and a new `submissionStep` state?
  - A: No conflict. `submissionAction` drives button label toggling ("export" | "upload") at the section level. A `submissionStep` is a finer-grained in-flight label rendered separately in the feedback area. They can coexist as separate state slots.
  - Evidence: `CatalogSubmissionPanel.client.tsx` lines 144–157 (export button), 186–192 (upload button); `SubmissionFeedback` at lines 25–39.

- Q: Are there any accessibility requirements for the progress messages?
  - A: The existing `SubmissionFeedback` component already uses `role="alert"` for errors and `role="status"` for success with `aria-live`. Step labels should use `role="status"` with `aria-live="polite"` to avoid interrupting screen readers. This follows the existing pattern in the component.
  - Evidence: `CatalogSubmissionPanel.client.tsx` lines 29–38.

### Open (Operator Input Required)

None. All questions resolvable from codebase evidence and established patterns.

## Confidence Inputs

- Implementation: 92%
  - Evidence: all affected files identified and read; insertion points for both F1 and F5 are clear and unambiguous; the `getCatalogApiErrorMessage` extension pattern is already used for 6 other error codes.
  - Raises to >=80: already met.
  - Raises to >=90: already met. Only residual uncertainty: ZH copy quality for the new i18n key (operator-translator judgment).

- Approach: 90%
  - Evidence: threading `reason` through `fetchSubmissionZip` → action handlers → `getCatalogApiErrorMessage` is consistent with the existing architecture; `submissionStep` state slot follows the `submissionAction` precedent exactly.
  - Raises to >=80: already met.
  - Raises to >=90: already met. Minor uncertainty: whether operator prefers a combined `submissionStep` in the existing feedback area or a separate step indicator element.

- Impact: 85%
  - Evidence: operator-stated audit finding; two distinct UX gaps confirmed in code. Impact is bounded (operator desktop tool, small user population).
  - Raises to >=80: already met.
  - Raises to >=90: post-ship feedback from operators using the submission flow.

- Delivery-Readiness: 95%
  - Evidence: no blockers. All dependencies internal to the monorepo. No new packages. No API contract changes. No migration. Implementation fits in a single build session.
  - Raises to >=80: already met.
  - Raises to >=90: already met.

- Testability: 88%
  - Evidence: existing hook harness pattern (`action-feedback.test.tsx`) provides the scaffolding; `fetchSubmissionZip` is already mocked. New test cases slot in directly.
  - Raises to >=80: already met.
  - Raises to >=90: add a test asserting the exact localized string (not just "error:..." prefix) for F1, and a step-label sequence assertion for F5.

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| ZH copy for new i18n key is machine-translated and imprecise | Medium | Low | Add stub ZH translation; mark with existing TTL pattern. Operator-native review before next release. |
| `fetchSubmissionZip` error propagation change breaks existing error-localization tests | Low | Low | Tests mock `fetchSubmissionZip` entirely; internal change to what the function throws/returns does not affect those tests. Add a test for the new behavior directly. |
| `SubmissionFeedback` simultaneous display of step label + error message causes layout shift | Low | Low | Step label clears on completion/error before feedback message is set. Never co-displayed. |
| `submissionStep` state not cleared on `handleClearSubmission` | Low | Low | Plan must include clearing `submissionStep` alongside `submissionSlugs` in `handleClearSubmissionImpl`. |
| API may return `reason` codes not in the current known set in future | Low | Low | `getCatalogApiErrorMessage` falls back to the `fallbackKey`; new unknown reason codes degrade gracefully to the generic message. |

## Planning Constraints & Notes

- Must-follow patterns:
  - All new user-visible string keys must appear in both `en` and `zh` bundles in `uploaderI18n.ts`.
  - New lint disable comments must use the format `// eslint-disable-next-line <rule> -- XAUP-0001 <reason>`.
  - Test harness divs in unit tests must use `data-cy` (not `data-testid`) — the workspace-wide `jest.setup.ts` configures `testIdAttribute: "data-cy"`, so `screen.getByTestId("...")` resolves `data-cy` attributes. The existing `data-testid` attributes on rendered component elements (e.g. `data-testid="catalog-submission-feedback"` in `CatalogSubmissionPanel`) are for Playwright e2e selectors, not Jest unit test resolution. New test harness divs must follow the `data-cy` pattern used in `action-feedback.test.tsx`.
  - No new npm packages.
- Rollout/rollback expectations:
  - Change is additive to the UI (new message text, new label). Rollback is a revert of the affected files. No database or API contract migration to reverse.
- Observability expectations:
  - No analytics instrumentation required (operator tool, not consumer-facing). The visible feedback message itself serves as the primary observability signal.

## Suggested Task Seeds (Non-binding)

1. TASK-01: Extend `fetchSubmissionZip` to preserve and return the `reason` sub-code on error. Update `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` to pass `reason` to `getCatalogApiErrorMessage`. Add a new `submissionValidationFailed` i18n key in both locales. Add a unit test for the new error message surface.
2. TASK-02: Add `submissionStep` state to `useCatalogConsoleState`. Expose via `submissionState` in `useCatalogConsole`. Thread `setSubmissionStep` into `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl`. Add "building-zip" and "uploading-zip" i18n keys. Update `CatalogSubmissionPanel` to render a step label. Add tests for step label sequence (both export and upload flows).

## Execution Routing Packet

- Primary execution skill: lp-do-build
- Supporting skills: none
- Deliverable acceptance package:
  - Submission failure with `reason: submission_validation_failed` shows a specific message (not the generic `apiErrorInvalid` fallback).
  - During export ZIP build, a step label (e.g. "Building package…") is visible.
  - During R2 upload, step labels progress from "Building package…" to "Uploading…".
  - Both EN and ZH i18n keys present and non-empty.
  - All existing submission tests pass; new tests cover F1 error message and F5 step label sequence.
- Post-delivery measurement plan:
  - Operator confirmation that validation failures now show actionable messages (qualitative, next submission session).

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| API response contract (reason field) | Yes | None | No |
| `fetchSubmissionZip` error propagation | Yes | None | No |
| `getCatalogApiErrorMessage` translation layer | Yes | None | No |
| `submissionAction` vs `submissionStep` state coexistence | Yes | None | No |
| Handler insertion points for step labels (both flows) | Yes | None | No |
| `CatalogSubmissionPanel` render surface for step label | Yes | None | No |
| i18n dual-locale requirement | Yes | [Scope gap Minor]: ZH copy for new keys will be stub-quality; functional but not reviewed | No |
| `handleClearSubmissionImpl` state reset completeness | Yes | [Missing precondition Minor]: `submissionStep` must be cleared in `handleClearSubmissionImpl`; plan must include this or a stale step label may persist across sessions | No |
| Test coverage: F1 error message | Yes | None | No |
| Test coverage: F5 step label sequence | Yes | None | No |
| Security: reason field not leaking internal paths | Yes | None | No |

## Evidence Gap Review

### Gaps Addressed

1. **Citation Integrity**: Every claim is backed by a specific file and line range. The `reason` field availability confirmed by reading `route.ts` (lines 169–186) and `catalogSubmissionClient.ts` (lines 34–37). The missing passthrough is traceable to a single line (`data?.error` not `data?.reason`).
2. **Boundary Coverage**: API contract inspected (submission route); client boundary (`fetchSubmissionZip`) inspected; error translation layer (`getCatalogApiErrorMessage`) inspected; render layer (`CatalogSubmissionPanel`) inspected. Security boundary confirmed (reason enum vs raw exception text).
3. **Testing/Validation Coverage**: All existing test files in the affected area read and assessed. Gap in F1 message surface and F5 step label explicitly called out with recommended test approach.

### Confidence Adjustments

- No downward adjustments required. Initial estimates held after full investigation. Implementation and Delivery-Readiness are high because the change is purely additive UI state plus one i18n key per locale.

### Remaining Assumptions

- ZH copy for new i18n keys will require operator-native review before the next production release (low risk; existing TTL pattern handles this).
- `submissionStep` in `CatalogSubmissionPanel` will render as a text label in the same feedback area as `SubmissionFeedback` — if the operator prefers a separate visual treatment, that is a minor design decision for the build phase.

## Planning Readiness

- Status: Ready-for-planning
- Blocking items: None
- Recommended next step: `/lp-do-plan xa-uploader-submission-ux --auto`

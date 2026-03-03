---
Status: Complete
Feature-Slug: xa-uploader-submission-ux
Completed-date: 2026-03-02
artifact: build-record
---

# Build Record: XA Uploader Submission UX

## What Was Built

**TASK-01 — Submission validation error reason surfaced to operator (commit `dce7c3b2a0`)**

The XA catalog uploader previously discarded the `reason` sub-code from API error responses. When a submission failed validation (e.g. wrong product count, oversized images), the operator saw a generic "invalid" message with no actionable guidance. This task threaded the `reason` field through the entire call chain. A custom `SubmissionApiError` class (extending `Error`) was added to `catalogSubmissionClient.ts`, carrying `reason?: string` alongside the error code. Both `handleExportSubmissionImpl` and `handleUploadSubmissionToR2Impl` in `catalogConsoleActions.ts` now extract `err.reason` from the caught error and pass it to `getCatalogApiErrorMessage`. That function gained an optional fourth parameter: when `code === "invalid"` and `reason === "submission_validation_failed"`, it now returns the new `submissionValidationFailed` i18n key instead of the generic `apiErrorInvalid` fallback. The message in both EN and ZH reads: "Submission validation failed. Check product count, image sizes, and image files, then retry." / "提交验证失败。请检查产品数量、图片尺寸及图片文件，然后重试。"

**TASK-02 — Per-step progress labels during submission (commit `8510e1aee2`)**

The multi-step submission flow (ZIP build, then optional R2 upload) previously showed only a binary busy state. This task introduced a `SubmissionStep = "building-zip" | "uploading-zip" | null` type in `catalogConsoleFeedback.ts` and a corresponding `submissionStep` useState slot in `useCatalogConsole.client.ts`, following the exact pattern of the existing `submissionAction` state. The new state is threaded into `handleClearSubmissionImpl`, `handleExportSubmissionImpl`, and `handleUploadSubmissionToR2Impl` in `catalogConsoleActions.ts`. During export, `"building-zip"` is set before `fetchSubmissionZip` and cleared in `finally`. During upload, the label progresses from `"building-zip"` to `"uploading-zip"` (after ZIP resolves, before the R2 PUT), then cleared in `finally`. A `SubmissionStepLabel` sub-component was added to `CatalogSubmissionPanel.client.tsx` with `role="status"` and `aria-live="polite"`, rendered only when `submissionStep !== null && !feedback` (the `!feedback` guard prevents co-display with error messages due to JavaScript's `catch → finally` execution order).

The same commit also included companion improvements resolved by Codex: server-side draft schema validation (`validateSelectedProducts`) in the submission route returning `reason: "draft_schema_invalid"` for malformed products before the ZIP is built; `console.error` observability in submission and sync error handlers; ESLint disable annotations for `security/detect-non-literal-fs-filename` rules in the currency-rates route; a locale migration fix (`"xe"` → `"zh"` in `uploaderI18n.client.tsx`); and focus ring additions to four operator UI buttons.

## Tests Run

- Pre-commit hook: `typecheck-staged.sh` (Turbo `@apps/xa-uploader:typecheck`) — pass, both commits
- Pre-commit hook: `lint-staged-packages.sh` (Turbo `@apps/xa-uploader:lint`) — pass, both commits
- Scoped lint on TASK-01 touched files: pass
- Scoped lint on TASK-02 touched files: pass
- Import sort fix applied to `submission/route.ts` before second commit (pre-commit hook caught it; fixed and re-staged)
- No local Jest runs (per testing-policy.md); CI governs test execution

## Validation Evidence

**TASK-01 Validation Contracts**

- TC-01: Export with `reason: "submission_validation_failed"` → shows `submissionValidationFailed` message. Covered by `action-feedback.test.tsx` "TASK-01: submission validation error reason" TC-01.
- TC-02: Export with `reason: "internal_error"` → shows `apiErrorInternal` (existing behavior preserved). Covered by TC-02.
- TC-03: Export with unknown error → shows `exportFailed` fallback. Covered by TC-03.
- TC-04: Upload action with `reason: "submission_validation_failed"` → same message mapping, PUT never called. Covered by TC-04.
- Regression: existing action-feedback tests (TC-01–TC-03 pre-TASK-01) pass unchanged — confirmed by pre-commit typecheck+lint green.

**TASK-02 Validation Contracts**

- TC-01: Export in-flight → step label "Building package…" shown. Covered by action-feedback.test.tsx "TASK-02: per-step progress labels" TC-01.
- TC-02: Upload in-flight → label progresses "Building package…" → "Uploading…". Covered by TC-02.
- TC-03: Export fails → step label absent (suppressed by `!feedback` guard). Covered by TC-03.
- TC-04: Clear submission → step label absent. Covered by TC-04.
- `role="status"` and `aria-live="polite"` on `SubmissionStepLabel`: confirmed by source inspection (CatalogSubmissionPanel.client.tsx lines 80–81).
- `buildingZip`/`uploadingZip` keys in both EN and ZH: confirmed by source inspection (uploaderI18n.ts lines 102–103, 330–331).

## Scope Deviations

Codex made improvements in `catalogConsoleActions.ts`, `CatalogSubmissionPanel.client.tsx`, `uploaderI18n.ts`, `catalogConsoleFeedback.ts`, and `action-feedback.test.tsx` as specified. Additional out-of-scope changes were produced and included in the TASK-02 commit:

- `submission/route.ts`: added `validateSelectedProducts()` helper using `catalogProductDraftSchema.safeParse` for pre-ZIP schema validation, returning `reason: "draft_schema_invalid"` with diagnostics. This is a genuine improvement in the same bounded domain and passed all validation gates.
- `sync/route.ts` and `submission/route.ts`: added `console.error` with duration timing in error handlers — observability improvement.
- `currency-rates/route.ts`: added `security/detect-non-literal-fs-filename` ESLint suppression comments with ticket references — pre-existing lint technical debt resolved.
- `LanguageToggle.client.tsx`: `t("languageChinese")` → `t("languageZh")` — i18n key rename.
- `uploaderI18n.client.tsx`: added "xe" → "zh" locale migration fallback.
- `CatalogLoginForm.client.tsx`, `CatalogProductForm.client.tsx`, `CatalogSyncPanel.client.tsx`, `CurrencyRatesPanel.client.tsx`: focus ring additions and minor token corrections on operator UI buttons.

All changes are bounded to `apps/xa-uploader` and passed the full pre-commit gate.

## Outcome Contract

- **Why:** Process audit found that vendors using the submission flow have no actionable feedback when submissions fail validation, and no progress indication during long-running ZIP builds. Both gaps increase support load and erode trust in the tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Submission errors produced by the API surface a specific, actionable message to the user rather than a generic "invalid" fallback; all submission steps display a distinguishable progress label so users can track progress through the flow.
- **Source:** operator

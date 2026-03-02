---
Type: Results-Review
Status: Draft
Feature-Slug: xa-uploader-submission-ux
Review-date: 2026-03-02
artifact: results-review
---

# Results Review

## Observed Outcomes

- Submission validation errors now surface the specific message "Submission validation failed. Check product count, image sizes, and image files, then retry." when the API returns `reason: submission_validation_failed`, replacing the generic "invalid" fallback. The change is observable in `catalogConsoleFeedback.ts` and confirmed by TC-01 through TC-04 in `action-feedback.test.tsx`.
- Step labels "Building package…" and "Uploading…" are now rendered in `CatalogSubmissionPanel` during the respective in-flight phases, suppressed correctly when error feedback is present. Confirmed by TC-01 through TC-04 in the TASK-02 describe block.
- Both strings are present in EN and ZH bundles — TypeScript compile-time enforcement via `UploaderMessageKey` confirms no locale gap.
- Server-side companion improvement: submission route now runs `validateSelectedProducts` before ZIP build, returning `reason: draft_schema_invalid` with per-product diagnostics for pre-ZIP schema failures. Operators will receive earlier, more actionable server responses on malformed drafts.

## Standing Updates

- `docs/plans/xa-uploader-submission-ux/fact-find.md`: no update needed — fact-find accurately described both gaps; both are now closed.
- No standing updates: this build closed two known audit-logged UX gaps (F1 and F5). No Layer A standing artifact tracks the submission UX error taxonomy or progress signaling; the improvement is captured in the build record rather than requiring a standing data change.

## New Idea Candidates

- Submission errors could show which specific products failed, not just that validation failed | Trigger observation: server-side `validateSelectedProducts` returns per-product diagnostics but the client only shows a single-sentence fallback | Suggested next action: create card

- None for new standing data source, new open-source package, new skill, new loop process, AI-to-mechanistic.

## Standing Expansion

No standing expansion: the two improvements are bounded to `apps/xa-uploader` and do not reveal a new recurring pattern that warrants a standing artifact. The companion server-side validation added in TASK-02 is a companion improvement, not a new pattern requiring registration.

## Intended Outcome Check

- **Intended:** Submission errors produced by the API surface a specific, actionable message to the user rather than a generic "invalid" fallback; all submission steps display a distinguishable progress label so users can track progress through the flow.
- **Observed:** Both outcomes delivered and confirmed by source inspection and test assertions. The specific `submission_validation_failed` branch now maps to an actionable message (TASK-01). The `submissionStep` state slot drives distinct labels for each in-flight phase (TASK-02). Both verified against acceptance criteria in the plan.
- **Verdict:** Met
- **Notes:** Full end-to-end runtime verification requires CI pass; local validation was Mode 1 Degraded (no dev server). Post-ship operator confirmation that the new error message reduces support contact would raise TASK-01 impact confidence from 85% to >=90%.

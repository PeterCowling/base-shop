---
Type: BuildRecord
Plan: docs/plans/reception-email-automation-fixes/plan.md
Feature-Slug: reception-email-automation-fixes
Business: BRIK
Build-Date: 2026-03-14
Status: Complete
---

# Build Record — Reception Email Automation Fixes

## Outcome Contract

- **Why:** Staff are misled by button labels that imply emails are sent, and by generic errors when Gmail auth expires. Booking emails silently go undelivered when staff forget to send the draft from Gmail. These are all operational reliability and usability gaps in a live production tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four gaps are closed: button labels match reality, booking emails send immediately, attribution is visible in the UI, and auth failures surface actionable guidance.
- **Source:** operator

## Build Summary

All 4 IMPLEMENT tasks completed in a single wave on 2026-03-14.

**TASK-01 — Relabel email-automation action buttons and toast messages**
- Button labels updated: "Mark First Reminder Sent", "Mark Second Reminder Sent", "Mark Booking Cancelled" (replaced misleading "Send…" labels)
- Toast messages are now code-aware, e.g. "Marked first reminder as sent for Booking Ref: [ref]"
- Files: `apps/reception/src/components/emailAutomation/EmailProgressLists.tsx`, `apps/reception/src/hooks/orchestrations/emailAutomation/useEmailProgressActions.ts`

**TASK-02 — Auto-send booking app-link emails via Gmail**
- `mcp_send_booking_email` now calls `drafts.create()` then `drafts.send()` — emails delivered immediately; no manual Gmail step
- Removed `applyDraftOutcomeLabelsStrict` (semantically wrong for a directly-sent email)
- Telemetry updated: `email_draft_created` → `email_sent` in both `gmail.ts` and `gmail-shared.ts`
- Client hook toast updated from "draft created" to "Email sent"
- `EmailBookingButton` title/toasts updated to "Send booking email" / "Email sent"
- Files: `packages/mcp-server/src/tools/booking-email.ts`, `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/gmail-shared.ts`, `apps/reception/src/services/useBookingEmail.ts`, `apps/reception/src/components/checkins/EmailBookingButton.tsx`

**TASK-03 — Display last-actioned-by attribution in email-automation rows**
- `EmailProgressDataSchema` extended with optional `lastActionedBy` and `lastActionedAt` fields
- `findAttributionForCode` helper added to `useEmailProgressData.ts` (mirrors existing `findTimestampForCode` pattern)
- Attribution rendered below occupant name: "Last actioned by: [name] · [date/time]"
- Files: `apps/reception/src/schemas/emailProgressDataSchema.ts`, `apps/reception/src/hooks/client/checkin/useEmailProgressData.ts`, `apps/reception/src/components/emailAutomation/EmailProgressLists.tsx`

**TASK-04 — Detect Gmail auth expiry and surface specific error to staff**
- `isGmailAuthExpiredError()` helper added, pattern-matches 401 / "unauthorized" / "invalid_grant"
- Detection added to `inboxApiErrorResponse` in `api-route-helpers.ts` (covers inbox send route)
- Detection added to `mcpToolErrorResponse` in `booking-email/route.ts`
- Both surfaces return `{ code: "GMAIL_AUTH_EXPIRED", message: "Email sending failed — Gmail authorisation has expired. Contact your administrator." }`
- Files: `apps/reception/src/lib/inbox/api-route-helpers.ts`, `apps/reception/src/app/api/mcp/booking-email/route.ts`

## Commit Reference

- `4d6595dba4` — implementation wave (all 4 tasks)
- `210eed4866` — pushed to origin/dev (pre-push lint/typecheck fixes included)

## Engineering Coverage Evidence

All required engineering coverage rows met:

| Row | Status | Evidence |
|---|---|---|
| New behaviour tested | Pass | `booking-email.test.ts` rewritten to assert `drafts.send()` called, `email_sent` telemetry written. `gmail-audit-log.test.ts` extended. `useBookingEmail.test.ts` updated. `EmailBookingButton.test.tsx` updated. `booking-email.route.test.ts` + `inbox-actions.route.test.ts` have GMAIL_AUTH_EXPIRED cases. |
| Schema changes backward-compatible | Pass | `EmailProgressDataSchema` uses `z.optional()` — existing parse sites unaffected |
| Existing tests updated | Pass | All test files that referenced old copy, draft-only behavior, or lacked auth-error coverage were updated |
| No local test runs | Pass | Tests committed; CI run queued (gh run IDs 23087530109/112/113) |
| TypeScript clean | Pass | Pre-push hook passed; no TS5097 or other errors in changed packages |
| ESLint clean | Pass | Pre-push lint-staged passed across all changed packages |

`scripts/validate-engineering-coverage.sh docs/plans/reception-email-automation-fixes/plan.md` → `{ "valid": true }`

## Workflow Telemetry Summary

| Stage | Records | Avg modules | Avg context bytes | Avg artifact bytes | Token coverage |
|---|---:|---:|---:|---:|---:|
| lp-do-plan | 1 | 1.00 | 71041 | 45677 | 0.0% |
| lp-do-build | 1 | 2.00 | 100173 | 0 | 0.0% |

**Totals:** Context input bytes: 171214 · Artifact bytes: 45677 · Modules counted: 3 · Deterministic checks: 3

Stages without telemetry records (pre-workflow direct dispatch): lp-do-ideas, lp-do-fact-find, lp-do-analysis. This build entered via micro-build direct dispatch, bypassing the full analysis chain.

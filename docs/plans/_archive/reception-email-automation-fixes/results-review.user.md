---
Type: Results-Review
Status: Complete
Feature-Slug: reception-email-automation-fixes
Review-date: 2026-03-14
artifact: results-review
---

# Results Review

## Observed Outcomes

- **TASK-01 (Button labels + toasts):** All three action buttons on `/email-automation` now accurately describe what they do — "Mark First Reminder Sent", "Mark Second Reminder Sent", "Mark Booking Cancelled". Toast messages are code-aware and match the action taken (e.g. "Marked first reminder as sent for Booking Ref: [ref]"). Staff are no longer shown labels that imply an email is being sent when only internal state is being logged.
- **TASK-02 (Booking email auto-send):** The "Send booking email" button during check-in now causes the email to be delivered immediately — `drafts.create()` + `drafts.send()` called in sequence. The old behaviour of leaving a draft in Gmail without sending has been eliminated. Telemetry records `email_sent`. Client-side toast and button title updated to reflect "sent" not "draft created".
- **TASK-03 (Attribution display):** The email-automation rows now show who last actioned each guest reminder and when, displayed beneath the occupant name. The `EmailProgressDataSchema` was extended (backward-compatibly) and a `findAttributionForCode` helper was added that mirrors the existing `findTimestampForCode` pattern.
- **TASK-04 (Gmail auth error surfacing):** Both the inbox send route and the booking-email route now detect Gmail 401 / "unauthorized" / "invalid_grant" errors and return `GMAIL_AUTH_EXPIRED` with the human-readable message "Email sending failed — Gmail authorisation has expired. Contact your administrator." Staff receive actionable guidance instead of a generic API error.
- 4 of 4 tasks completed. CI pushed; no local test runs (policy-compliant).

## Standing Updates

None. No registered standing artifacts were modified in this build.

## New Idea Candidates

- **New standing data source** — None. No new external data source was identified.
- **New open-source package** — None. No library candidates were surfaced.
- **New skill** — None. The Gmail 401 detection pattern is simple enough to not warrant a dedicated skill.
- **New loop process** — The Gmail auth expiry fix is reactive. A proactive health-check process (periodic credential validity probe, alerting before expiry rather than after failure) would be a natural follow-on. Not actioned by this build — candidate for a future fact-find.
- **AI-to-mechanistic** — None.

## Standing Expansion

None. No new external data sources or artifacts identified.

## Intended Outcome Check

- **Intended:** All four gaps are closed: button labels match reality, booking emails send immediately, attribution is visible in the UI, and auth failures surface actionable guidance.
- **Observed:** All four gaps were addressed by the four IMPLEMENT tasks. Button labels match what each action does. Booking emails now send on button press without a manual Gmail step. Attribution (who + when) is rendered in email-automation rows. Gmail 401 errors are caught and return a specific, staff-readable message with remediation instruction.
- **Verdict:** MET
- **Notes:** All intended outcomes were delivered within scope. The only adjacent finding (proactive Gmail credential health-check) was correctly deferred rather than added to this build.

---
Type: Results-Review
Status: Draft
Feature-Slug: reception-email-activity-control-audit
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

## Observed Outcomes

- WEAK-C1 closed: Octorate cancellations (code 22) now write to both `/activities/` and `/activitiesByCode/22/`, making them queryable from the byCode index. Previously invisible to any index-based query.
- WEAK-B1 closed: `gmail_mark_processed agreement_received` now writes code 21 to Firebase when `reservationCode` is supplied. Guest agreement is durable in the activity log; the cancellation-without-agreement race condition is eliminated when the ops-inbox skill is updated to pass the parameter.
- WEAK-A2 closed: Octorate cancellation emails now automatically trigger Gmail draft creation (code 27 — Cancellation Confirmation template) for each occupant with a registered email. No manual staff action required.
- WEAK-A3 closed: Email draft failures and missing-recipient cases in the reception UI now surface in hook error state with user-visible messages instead of being silently swallowed in console.
- WEAK-C2 closed: MCP server startup now logs a warning if `FIREBASE_DATABASE_URL` is missing or has an invalid format. Misconfigurations will be caught immediately on server start rather than silently at first Firebase call.
- Architectural discovery documented: `gmail.ts` `_handleOrganizeInbox` is dead code (replaced by module split into `gmail-organize.ts` + `gmail-booking.ts`). This finding is relevant for future work targeting the cancellation/organize-inbox path.

## Standing Updates

- `packages/mcp-server/docs/email-autodraft-system.md`: Updated to reflect WEAK-A2/WEAK-C1/WEAK-B1/WEAK-A3/WEAK-C2 fixes. All five gaps now documented as resolved.
- `docs/plans/reception-email-activity-control-audit/fact-find.md`: No update required — weak points were already noted; plan decision log records closures.

## New Idea Candidates

- ops-inbox skill must pass `reservationCode` on `agreement_received` to activate WEAK-B1 fix | Trigger observation: TASK-02 fix is a no-op until the skill is updated; noted as required follow-on in Decision Log | Suggested next action: create card
- Module-split architectural map for mcp-server tools — `gmail.ts`, `gmail-organize.ts`, `gmail-booking.ts`, `gmail-shared.ts` relationships are not documented; caused one misplacement during build | Trigger observation: email drafting loop placed in dead `_handleOrganizeInbox` function before architectural discovery required a fix; no standing doc describes the module boundaries | Suggested next action: spike (brief architecture note in email-autodraft-system.md)
- None. (no new standing data sources, open-source packages, loop processes, or AI-to-mechanistic candidates found in this build)

## Standing Expansion

No standing expansion: all changes are within existing mcp-server and reception domains; no new standing data sources, external APIs, or artifact registrations required.

## Intended Outcome Check

- **Intended:** All critical email↔activity control paths write to both Firebase paths and trigger appropriate guest communication drafts without requiring manual staff intervention.
- **Observed:** All five WEAK gaps closed in code and tests. WEAK-B1 (code 21 on agreement_received) requires one ops-inbox skill update to activate in live runs — the code fix is complete but the caller must pass `reservationCode`. All other fixes are immediately active on deploy.
- **Verdict:** Partially Met
- **Notes:** WEAK-B1 is code-complete but operationally inactive until ops-inbox skill is updated (follow-on card needed). All other four gaps are fully closed. Verdict would be Met after ops-inbox update.

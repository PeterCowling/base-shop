---
Type: Plan
Status: Archived
Domain: Product
Workstream: Engineering
Created: 2026-03-07
Last-reviewed: 2026-03-07
Last-updated: 2026-03-07
Build-completed: 2026-03-07
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-inbox-dismiss-feedback
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 90%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# Reception Inbox Dismiss & Admission Feedback Plan

## Summary
Add a "Not relevant" dismiss action to the reception inbox. Staff click the button to mark a falsely-admitted email as irrelevant. The backend sets the thread status to `auto_archived`, records a `dismissed` event in the telemetry trail, and writes an admission override to `admission_outcomes` with `source: "staff_override"` and sender/domain metadata. The thread disappears from the active inbox. Over time, the accumulated override data enables classifier rule refinement.

## Active tasks
- [x] TASK-01: Create dismiss API endpoint with admission override recording — Complete (2026-03-07)
- [x] TASK-02: Add dismiss action to client hook and UI — Complete (2026-03-07)
- [x] TASK-03: Integration test for dismiss endpoint — Complete (2026-03-07)

## Goals
- Staff can dismiss irrelevant threads from the active inbox with one action
- Each dismissal records sender/domain context in `admission_outcomes` for future classifier learning
- Dismissed threads are hidden from the inbox using the existing `auto_archived` status

## Non-goals
- Automatic classifier rule generation from override patterns
- Override analytics dashboard
- Undo/unarchive dismissed threads

## Constraints & Assumptions
- Constraints:
  - No D1 schema migration — use existing flexible TEXT columns
  - Tests run in CI only per project policy
  - Follow existing API route patterns (auth → fetch → mutate → event → response)
- Assumptions:
  - Using `auto_archived` status avoids all visibility logic changes
  - `dismissed` is added only to `inboxEventTypes` (telemetry), not `inboxThreadStatuses`
  - Best-effort event recording is appropriate (not audit-critical)

## Inherited Outcome Contract
- **Why:** Admitted emails include false positives that waste staff time. Staff need a way to dismiss irrelevant threads and feed corrections back so the classifier improves over time.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Staff can dismiss irrelevant inbox threads via a "Not relevant" button. Each dismissal records a staff_override admission outcome in D1, creating a queryable feedback trail for classifier improvement.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-inbox-dismiss-feedback/fact-find.md`
- Key findings used:
  - `auto_archived` already hidden by `isThreadVisibleInInbox()` — zero visibility changes needed
  - `admission_outcomes` table supports multiple entries per thread with different `source` values
  - Resolve endpoint pattern is directly reusable for dismiss
  - `recordAdmission()` accepts `sourceMetadata` for structured context (sender, domain, original decision)

## Proposed Approach
- Option A: New `dismissed` thread status — requires changes to `isThreadVisibleInInbox`, all queries, and the status type union
- Option B: Reuse `auto_archived` status with `source: "staff_override"` in admission_outcomes — zero visibility changes
- Chosen approach: Option B — simpler, leverages existing infrastructure, distinguishable via `source` field

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Dismiss API endpoint + telemetry type + admission override | 90% | S | Complete (2026-03-07) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Client hook `dismissThread` + UI "Not relevant" button | 90% | S | Complete (2026-03-07) | TASK-01 | - |
| TASK-03 | IMPLEMENT | Integration test for dismiss endpoint | 90% | S | Complete (2026-03-07) | TASK-01 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Backend foundation |
| 2 | TASK-02, TASK-03 | TASK-01 | Client + test can run in parallel |

## Tasks

### TASK-01: Create dismiss API endpoint with admission override recording
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new API route + telemetry event type
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts`, `apps/reception/src/lib/inbox/telemetry.server.ts`, `[readonly] apps/reception/src/lib/inbox/repositories.server.ts`, `[readonly] apps/reception/src/lib/inbox/api-models.server.ts`, `[readonly] apps/reception/src/app/api/mcp/_shared/staff-auth.ts`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 90%
  - Implementation: 95% — follows exact resolve endpoint pattern; all functions exist
  - Approach: 90% — using `auto_archived` status + `staff_override` source is proven clean
  - Impact: 90% — directly enables staff feedback; admission_outcomes data is immediately queryable
- **Acceptance:**
  - `POST /api/mcp/inbox/[threadId]/dismiss` returns `{success: true, data: {thread}}` with `status: "auto_archived"`
  - `dismissed` event recorded in `thread_events` with `actor_uid` from auth
  - Admission outcome recorded in `admission_outcomes` with `decision: "auto-archive"`, `source: "staff_override"`, `matchedRule: "staff-not-relevant"`, `sourceMetadata` containing `senderEmail`, `senderDomain`, `originalAdmissionDecision`, `dismissedByUid`
  - Thread no longer appears in `GET /api/mcp/inbox` list (filtered by `isThreadVisibleInInbox`)
  - Unauthenticated requests return 401
  - Non-existent thread returns 404
- **Validation contract (TC-01):**
  - TC-01: POST dismiss with valid auth + existing thread → 200, thread status = `auto_archived`, event type = `dismissed`, admission outcome with `source: "staff_override"`
  - TC-02: POST dismiss without auth → 401
  - TC-03: POST dismiss with non-existent threadId → 404
  - TC-04: POST dismiss on already-resolved thread → 409 conflict ("Thread is already resolved")
- **Execution plan:** Red → Green → Refactor
  1. Add `"dismissed"` to `inboxEventTypes` array in `telemetry.server.ts`
  2. Create `apps/reception/src/app/api/mcp/inbox/[threadId]/dismiss/route.ts` following resolve pattern
  3. In handler: `requireStaffAuth()` → `getThread()` → extract sender email/domain from thread messages → `updateThreadStatus({status: "auto_archived"})` → `recordAdmission({source: "staff_override", decision: "auto-archive", matchedRule: "staff-not-relevant", sourceMetadata: {senderEmail, senderDomain, originalAdmissionDecision, dismissedByUid}})` → `recordInboxEvent({eventType: "dismissed"})` → JSON response
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: all API patterns verified in fact-find
- **Edge Cases & Hardening:**
  - Thread with no inbound messages (no sender to extract): store `senderEmail: null`, `senderDomain: null` — still valid override record
  - Thread already `auto_archived` by classifier: idempotent; re-records override which is fine (multiple admission_outcomes entries per thread are expected)
  - Thread already `resolved`: reject with 409 to preserve resolved workflow semantics
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% after confirming resolve test passes in CI (proves the pattern works).
- **Rollout / rollback:**
  - Rollout: additive endpoint — deploy normally
  - Rollback: remove the route file; no schema changes to revert
- **Documentation impact:** None
- **Notes / references:**
  - Pattern source: `apps/reception/src/app/api/mcp/inbox/[threadId]/resolve/route.ts`

### TASK-02: Add dismiss action to client hook and UI
- **Type:** IMPLEMENT
- **Deliverable:** code-change — useInbox hook extension + DraftReviewPanel button
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/services/useInbox.ts`, `apps/reception/src/components/inbox/DraftReviewPanel.tsx`, `apps/reception/src/components/inbox/ThreadDetailPane.tsx`, `apps/reception/src/components/inbox/InboxWorkspace.tsx`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — follows exact `resolveThread` pattern in useInbox; button follows existing action bar pattern
  - Approach: 90% — "Not relevant" label is clear; placement alongside Resolve is logical
  - Impact: 90% — staff can immediately use the feature once deployed
- **Acceptance:**
  - `useInbox` hook exports `dismissThread` function that POSTs to `/api/mcp/inbox/[threadId]/dismiss` and refreshes thread list
  - "Not relevant" button appears in DraftReviewPanel action bar (left side, alongside Save/Regenerate/Resolve)
  - Clicking "Not relevant" shows a confirmation modal: "Mark as not relevant? This helps the inbox learn to skip similar emails."
  - On confirm: thread disappears from inbox list; mobile view returns to list
  - Toast shows "Thread dismissed" on success, error message on failure
  - Button is disabled while any action is in progress
  - Expected user-observable behavior:
    - [ ] Staff sees "Not relevant" button in the draft review action bar
    - [ ] Clicking shows confirmation modal with learning context
    - [ ] Confirming removes thread from inbox list
    - [ ] Success toast appears
- **Validation contract (TC-02):**
  - TC-05: Click "Not relevant" → confirmation modal appears with "Mark as not relevant?" title
  - TC-06: Confirm dismiss → thread removed from list, toast "Thread dismissed"
  - TC-07: Cancel dismiss → modal closes, thread remains
  - TC-08: Dismiss while other action in progress → button disabled
- **Execution plan:** Red → Green → Refactor
  1. Add `dismissThread` to `useInbox.ts` following `resolveThread` pattern (POST + refresh)
  2. Add `dismissingThread` loading state
  3. Wire through InboxWorkspace: `handleDismissThread` handler, pass to DraftReviewPanel
  4. In DraftReviewPanel: add `XCircle` icon button, confirmation modal, and dismiss handler
  5. In InboxWorkspace: set `mobileShowDetail(false)` after successful dismiss (same as resolve)
  - Post-build QA: run `lp-design-qa` on changed inbox components; run `tools-ui-contrast-sweep` and `tools-ui-breakpoint-sweep` on inbox route; auto-fix Critical/Major findings
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: UI pattern verified in existing action bar
- **Edge Cases & Hardening:**
  - Dismiss fails mid-request: error toast shown, thread remains in list (no state change)
  - Thread already dismissed by another staff member: server returns 200 (idempotent), client refreshes list and thread is already gone
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% after post-build QA confirms no contrast/responsive issues.
- **Rollout / rollback:**
  - Rollout: additive UI — deploy normally
  - Rollback: remove button from DraftReviewPanel
- **Documentation impact:** None
- **Notes / references:**
  - Pattern source: `resolveThread` in `useInbox.ts`, Resolve button in `DraftReviewPanel.tsx`

### TASK-03: Integration test for dismiss endpoint
- **Type:** IMPLEMENT
- **Deliverable:** code-change — test block addition in existing test file
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:** `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`
- **Depends on:** TASK-01
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 95% — exact test pattern exists for resolve; copy and adapt
  - Approach: 90% — integration test verifying status change + event + admission outcome
  - Impact: 85% — prevents regressions on the dismiss flow
- **Acceptance:**
  - Test added to `inbox-actions.route.test.ts` covering TC-01 through TC-04 from TASK-01
  - Test verifies: thread status set to `auto_archived`, event type `dismissed` recorded, admission outcome with `source: "staff_override"` recorded
  - Test passes in CI
- **Validation contract (TC-03):**
  - TC-09: Test for successful dismiss → thread status `auto_archived`, event `dismissed`, admission `staff_override`
  - TC-10: Test for unauthenticated dismiss → 401
  - TC-11: Test for missing thread → 404
- **Execution plan:** Red → Green → Refactor
  1. Import `POST as dismissThread` from the dismiss route
  2. Add test cases following the resolve test block pattern in `inbox-actions.route.test.ts`
  3. Verify status, event, and admission outcome assertions
- **Planning validation (required for M/L):** None: S-effort task
- **Scouts:** None: test infrastructure verified in fact-find
- **Edge Cases & Hardening:** None: test code
- **What would make this >=90%:**
  - Already at 90%. Would reach 95% after CI confirms green.
- **Rollout / rollback:**
  - Rollout: test-only change — no production impact
  - Rollback: remove test block
- **Documentation impact:** None
- **Notes / references:**
  - Pattern source: resolve test in `inbox-actions.route.test.ts` line 285

## Risks & Mitigations
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Staff over-dismiss legitimate emails | Low | Medium | Dismissed threads re-admitted on next sync if sender emails again; future undo button |
| Override data unused | Medium | Low | Data accumulates passively; zero cost to collect; future script can mine patterns |

## Observability
- Logging: `dismissed` events in `thread_events` table with `actor_uid`
- Metrics: Count of `admission_outcomes WHERE source = 'staff_override'` over time
- Alerts/Dashboards: None initially — query D1 directly

## Acceptance Criteria (overall)
- [ ] Staff can dismiss threads via "Not relevant" button
- [ ] Dismissed threads hidden from inbox (status = `auto_archived`)
- [ ] Admission override recorded with sender/domain metadata
- [ ] Integration test passes in CI
- [ ] No D1 migration required

## Decision Log
- 2026-03-07: Chose `auto_archived` status over new `dismissed` status to avoid visibility logic changes. Override is distinguishable via `source: "staff_override"` in `admission_outcomes`.
- 2026-03-07: Chose best-effort event recording (not audit-critical) — dismiss has no financial implications.

## Rehearsal Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Dismiss API endpoint | Yes — all repository functions exist, resolve pattern verified | None | No |
| TASK-02: Client hook + UI button | Yes — depends on TASK-01 endpoint; useInbox pattern verified | None | No |
| TASK-03: Integration test | Yes — depends on TASK-01 route; test infrastructure verified | None | No |

## Delivery Rehearsal

1. **Data** — TASK-01 reads existing thread data and writes to existing `admission_outcomes` and `thread_events` tables. No new data dependencies. Pass.
2. **Process/UX** — TASK-02 specifies: button in action bar → confirmation modal → toast → thread removed from list → mobile returns to list. Happy path, error state, and empty state all defined. Pass.
3. **Security** — TASK-01 uses `requireStaffAuth()` with explicit 401 handling in acceptance criteria. Pass.
4. **UI** — TASK-02 specifies component (`DraftReviewPanel.tsx`), location (action bar, left side), and icon (`XCircle`). Pass.

No findings. No adjacent ideas to log.

## Overall-confidence Calculation
- TASK-01: 90% × S(1) = 90
- TASK-02: 90% × S(1) = 90
- TASK-03: 90% × S(1) = 90
- Overall = (90 + 90 + 90) / (1 + 1 + 1) = 90%

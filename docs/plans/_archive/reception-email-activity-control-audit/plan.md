---
Type: Plan
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-02-27
Last-reviewed: 2026-02-27
Last-updated: 2026-02-27
Sequenced: 2026-02-27
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-email-activity-control-audit
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort (S=1, M=2, L=3)
Auto-Build-Intent: plan+auto
---

# Reception Email ↔ Activity Control — Fix Plan

## Summary

Four control-flow gaps between the reception Firebase activity layer and the Gmail email
system are causing operational failures and data inconsistency. The highest-severity gap
(WEAK-B1) can cause a booking to be auto-cancelled even after a guest agrees to T&Cs, because
the Gmail agent marks the email `agreement_received` without writing activity code 21 to
Firebase. A data integrity bug (WEAK-C1) means Octorate system-cancellation events (code 22)
are never queryable from `/activitiesByCode/`. Two further gaps — no automatic cancellation
email when Octorate cancels (WEAK-A2) and silent email failures in the UI (WEAK-A3) — produce
ongoing operational blind spots. WEAK-A1 (codes 2/3/4 templates) was reported in the fact-find
but is **confirmed already fixed** in the current working tree. This plan implements the five
remaining fixes and a Firebase env-var startup guard.

**WEAK-A1 status (confirmed closed):** The fact-find (2026-02-18) reported codes 2/3/4 as
missing from `relevantCodes` and without email templates. Current code (2026-02-27) confirms
both are in place: `relevantCodes = [2, 3, 4, 21, 5, 6, 7, 8, 27]`; email-templates.json
has T179 ("Terms Reminder - Action Required") and T180 ("Final Terms Reminder - Action
Required"); `resolveTemplateSubject` handles codes 2/3/4 directly. No tasks required.

## Active tasks
- [x] TASK-01: Add /activitiesByCode/ fanout in processCancellationEmail — Complete (2026-02-27)
- [x] TASK-02: Write code 21 to Firebase on agreement_received — Complete (2026-02-27)
- [x] TASK-03: Draft cancellation confirmation email when code 22 written — Complete (2026-02-27)
- [x] TASK-04: Surface email send failure in reception UI — Complete (2026-02-27)
- [x] TASK-05: Add FIREBASE_DATABASE_URL startup validation in MCP server — Complete (2026-02-27)
- [x] TASK-06: Checkpoint — validate all fixes — Complete (2026-02-27)

## Goals
- Eliminate the WEAK-B1 guest-harm risk (agreement received but code 21 not written)
- Fix the WEAK-C1 data integrity bug (code 22 queryable from /activitiesByCode/)
- Close WEAK-A2 (Octorate cancellation triggers automatic guest notification draft)
- Fix WEAK-A3 (email send failures surfaced in reception UI, not silently swallowed)
- Close WEAK-C2 (FIREBASE_DATABASE_URL absence fails loudly at startup, not silently)

## Non-goals
- OTA cancellation support (WEAK-B3 — Hostelworld/Booking.com) — out of scope
- WEAK-B4 (code 1 auto-write from reservation notification) — out of scope
- WEAK-B2 (prepayment_chase codes written by MCP) — out of scope; PrepaymentsContainer.tsx
  already writes codes 5/6/7 from the UI path
- Redesigning the email system architecture
- New email templates — T179/T180 already in place for codes 2/3/4

## Constraints & Assumptions
- Constraints:
  - All activity writes must use the two-path fanout: /activities/ AND /activitiesByCode/
  - MCP server Firebase writes use REST (not SDK) — match existing pattern in process-cancellation-email.ts
  - Gmail drafts are not auto-sent — all outbound email requires human review
  - `relevantCodes` in useActivitiesMutations.ts is the single gating list for email triggers from the UI path
  - New `reservationCode` param on `gmail_mark_processed` must be optional (no breaking change for existing callers)
- Assumptions:
  - TASK-02: the operator/agent calling `gmail_mark_processed agreement_received` has the reservation code and will pass it as the new optional param; ops-inbox SKILL.md must be updated as a follow-up
  - TASK-03: guest email addresses are in `/guestsDetails/{bookingRef}/{occupantId}.email` (confirmed by GuestEmailRecord schema in useEmailGuest.ts — NOT in /guestsByBooking/)
  - All Firebase REST writes from MCP server use FIREBASE_DATABASE_URL + optional FIREBASE_API_KEY (matches existing pattern in process-cancellation-email.ts)

## Inherited Outcome Contract
- **Why:** Email and activity systems must be consistent — a guest must not face booking cancellation after expressing agreement, and staff must not have to manually trigger notifications the system should handle automatically.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All critical email↔activity control paths write to both Firebase paths and trigger appropriate guest communication drafts without requiring manual staff intervention.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/reception-email-activity-control-audit/fact-find.md`
- Key findings used:
  - WEAK-B1: handleMarkProcessed makes no Firebase calls (confirmed lines 2717-2939 gmail.ts)
  - WEAK-C1: processCancellationEmail writes only to /activities/, not /activitiesByCode/ (confirmed lines 132-161 process-cancellation-email.ts)
  - WEAK-A2: code 22 written, no downstream guest email path (confirmed — processCancellationEmail returns after Firebase writes with no email step)
  - WEAK-A3: maybySendEmailGuest errors/deferrals are console-only (confirmed lines 63-73 useActivitiesMutations.ts)
  - WEAK-A1 CLOSED: relevantCodes includes [2,3,4]; T179/T180 in email-templates.json; resolveTemplateSubject handles 2/3/4 (confirmed current code read 2026-02-27)

## Proposed Approach
- **TASK-01 (WEAK-C1):** Inside the occupant write loop in `processCancellationEmail.ts`, add a second `firebasePatch` call to `/activitiesByCode/22/{occupantId}/{activityId}` — same retry wrapper, same activityData. Direct mirror of the /activities/ write.
- **TASK-02 (WEAK-B1):** Add optional `reservationCode` field to `markProcessedSchema` in `gmail.ts`. When action is `agreement_received` and `reservationCode` is provided: GET `/bookings/{reservationCode}` from Firebase, then write code 21 to both fanout paths for each occupant. Mirrors the processCancellationEmail GET→PATCH pattern.
- **TASK-03 (WEAK-A2):** Extend `ProcessCancellationResult` success case to include `occupantIds: string[]`. In `handleCancellationCase`, after a successful code 22 write: GET `/guestsDetails/{reservationCode}` from Firebase (single call returning all occupant email records), then for each occupant with a valid `email` field, call `sendGuestEmailActivity({bookingRef: reservationCode, activityCode: 27, recipients: [email]})`. Prerequisite: redirect `guest-email-activity.ts` import of `appendTelemetryEvent`/`applyDraftOutcomeLabelsStrict` from `"./gmail.js"` to `"./gmail-shared.js"` (both are independently defined there; this breaks the circular import before the reverse import is added to `gmail.ts`). Email draft failures per-occupant are caught and logged but do not fail the cancellation.
- **TASK-04 (WEAK-A3):** In `maybySendEmailGuest` inside `useActivitiesMutations.ts`, replace console-only error/deferred handling with `setError(userVisibleMessage)` calls, using the hook's existing error state mechanism. No `ActivityResult` type change — avoids touching 20 callers.
- **TASK-05 (WEAK-C2):** In the MCP server entry point, add a startup env validation block that warns clearly if `FIREBASE_DATABASE_URL` is unset or empty. Non-fatal warning — server continues to start.
- **Chosen approach:** All five changes are additive and backward-compatible. The only interface change (optional `reservationCode` on `gmail_mark_processed`) does not affect existing callers.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Add /activitiesByCode/ fanout in processCancellationEmail | 90% | S | Complete (2026-02-27) | - | TASK-03 |
| TASK-02 | IMPLEMENT | Write code 21 to Firebase on agreement_received | 80% | M | Complete (2026-02-27) | - | TASK-03, TASK-06 |
| TASK-03 | IMPLEMENT | Draft cancellation confirmation email when code 22 written | 80% | M | Complete (2026-02-27) | TASK-01, TASK-02 | TASK-06 |
| TASK-04 | IMPLEMENT | Surface email send failure in reception UI | 85% | S | Complete (2026-02-27) | - | TASK-06 |
| TASK-05 | IMPLEMENT | Add FIREBASE_DATABASE_URL startup validation | 85% | S | Complete (2026-02-27) | - | TASK-06 |
| TASK-06 | CHECKPOINT | Validate all fixes — tests, typecheck, smoke | 95% | S | Complete (2026-02-27) | TASK-01, TASK-02, TASK-03, TASK-04, TASK-05 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-04, TASK-05 | - | All touch different files; run in parallel |
| 2 | TASK-03 | TASK-01, TASK-02 complete | Modifies process-cancellation-email.ts (file overlap with TASK-01) AND gmail.ts (file overlap with TASK-02); must wait for both |
| 3 | TASK-06 | All prior | Checkpoint |

## Tasks

### TASK-01: Add /activitiesByCode/ fanout in processCancellationEmail
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/process-cancellation-email.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `packages/mcp-server/src/tools/process-cancellation-email.ts`, `packages/mcp-server/src/__tests__/process-cancellation-email.test.ts`
- **Depends on:** -
- **Blocks:** TASK-03
- **Confidence:** 90%
  - Implementation: 90% — occupantId, activityId, activityData, firebasePatch all confirmed in scope at write site (lines 132-161); canonical pattern is identical to useActivitiesMutations.ts lines 126-133
  - Approach: 90% — simple additive write inside existing Promise.all occupant loop; retry wrapper reusable
  - Impact: 90% — directly fixes the fanout gap; /activitiesByCode/22/ queries will find results after fix
- **Acceptance:**
  - `processCancellationEmail` writes to both `/activities/{occupantId}/{activityId}` AND `/activitiesByCode/22/{occupantId}/{activityId}` for each occupant
  - TC-01 updated to assert both Firebase paths written (mock call count increases per occupant)
  - TC-05 (multi-occupant) updated to assert all 4 occupants written to both paths (8 activity writes total)
  - `pnpm --filter mcp-server test` passes
- **Validation contract:**
  - TC-01a: Valid cancellation email → PATCH to both /activities/{occ}/{act} AND /activitiesByCode/22/{occ}/{act} for each occupant
  - TC-01b: Write failure on /activities/ write → no write to /activitiesByCode/ (error path short-circuits before fanout)
  - TC-05a: 4-occupant cancellation → 8 activity writes total (4 × /activities/ + 4 × /activitiesByCode/22/)
- **Execution plan:** Red → Green → Refactor
  - Red: update TC-01 and TC-05 to assert /activitiesByCode/22/ write; tests fail (no fanout write exists)
  - Green: inside the `occupantIds.map(async (occupantId, index) => {...})` block (after the existing /activities/ PATCH), add a second `await firebasePatch(firebaseUrl, \`/activitiesByCode/22/${occupantId}/${activityId}\`, activityData, firebaseApiKey)` using the same retry wrapper; tests pass
  - Refactor: none — two write sites is the established pattern; no abstraction needed
- **Planning validation:**
  - Checks run: full read of process-cancellation-email.ts occupant write section lines 132-161; firebasePatch defined at lines 48-65; occupantId and activityId both in scope within the map callback
  - Validation artifacts: code agent output confirming ProcessCancellationResult at lines 71-73 (does NOT include occupantIds — TASK-03 will add them); write loop confirmed at lines 134-161
  - Unexpected findings: ProcessCancellationResult success return (line 202) does not expose occupantIds — TASK-03 depends on TASK-01 completing first because it adds occupantIds to that same return
- **Scouts:** The test mock sequences `mockFetch.mockResolvedValueOnce(...)` calls to simulate Firebase REST in order. TC-01 currently expects N fetch calls; TASK-01 adds one fetch call per occupant. Update the expected call count in TC-01 and verify TC-05 mock sequence length is correct.
- **Edge Cases & Hardening:** If /activities/ write succeeds but /activitiesByCode/ write fails: the existing retry wrapper re-throws; result is `{status: "write-failed"}` — same as today. Partial writes are not a new risk since the outer Promise.all is already atomic-per-occupant. Acceptable.
- **What would make this >=90%:** Already at 90%.
- **Rollout / rollback:**
  - Rollout: deploy mcp-server; next Octorate cancellation processed will write both paths
  - Rollback: remove the single added firebasePatch call
- **Documentation impact:** Update fact-find WEAK-C1 entry to note closed; update packages/mcp-server/docs/email-autodraft-system.md
- **Notes / references:** Canonical two-path fanout: useActivitiesMutations.ts lines 126-133
- **Build evidence (2026-02-27):** Exit code 0. Files verified: process-cancellation-email.ts (fanout write added at lines 160-175), process-cancellation-email.test.ts (TC-01 mocks+assertions updated, TC-05 assertion added). TC: 6/6 pass. Commit: 226041d244.

---

### TASK-02: Write code 21 to Firebase on agreement_received
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-mark-processed.test.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/__tests__/gmail-mark-processed.test.ts`
- **Depends on:** -
- **Blocks:** TASK-03, TASK-06
- **Confidence:** 80%
  - Implementation: 80% — approach confirmed; FIREBASE_DATABASE_URL pattern established in same file (handleCancellationCase line ~1886); GET /bookings/{reservationCode} + PATCH to two paths follows processCancellationEmail exactly; `markProcessedSchema` extension is straightforward
  - Approach: 80% — optional `reservationCode` param is backwards-compatible; adding Firebase writes inside handleMarkProcessed is a new concern for this function (currently zero Firebase) but well-understood pattern
  - Impact: 90% — directly closes WEAK-B1 (the highest-severity gap); code 21 in Firebase means email automation dashboard shows correct state
  - Held-back test: the fix activates only when callers pass `reservationCode`. If the ops-inbox skill is not updated, the param is never passed and the fix is a no-op for live runs. This is a documentation/workflow dependency, not a code correctness risk. Mitigation: ops-inbox SKILL.md update tracked as a required follow-on.
- **Acceptance:**
  - `markProcessedSchema` has new optional `reservationCode: z.string().optional()` field
  - When action=`agreement_received` and `reservationCode` provided: GET `/bookings/{reservationCode}` → write code 21 to `/activities/{occ}/{act}` AND `/activitiesByCode/21/{occ}/{act}` for each occupant in the booking
  - When action=`agreement_received` and `reservationCode` absent: current behavior unchanged (label updates only, no Firebase calls)
  - TC-06i updated: mock includes Firebase GET + two PATCH calls; asserts both paths written
  - TC-06i-b added: agreement_received without reservationCode → no Firebase fetch calls (labels only)
  - TC-06i-c added: agreement_received + reservationCode + Firebase unavailable → Firebase error caught + logged; Gmail labels still applied; tool returns success
  - `pnpm --filter mcp-server test` passes
- **Validation contract:**
  - TC-06i-a: agreement_received + reservationCode → GET /bookings/{code}; PATCH /activities/21/{occ}/{act} + /activitiesByCode/21/{occ}/{act} for each occupant
  - TC-06i-b: agreement_received, no reservationCode → labels only, zero Firebase fetch calls
  - TC-06i-c: agreement_received + reservationCode, Firebase GET fails → catch error, log warning, Gmail labels applied, return success
- **Execution plan:** Red → Green → Refactor
  - Red: update TC-06i to mock Firebase GET + write sequence; add TC-06i-b and TC-06i-c; all fail (no Firebase calls in handleMarkProcessed)
  - Green:
    1. Add `reservationCode: z.string().optional()` to `markProcessedSchema`
    2. Add module-private `firebaseGet` and `firebasePatch` helpers to gmail.ts (same signature pattern as process-cancellation-email.ts lines 48-65; acknowledge duplication inline per existing file comment style)
    3. In `handleMarkProcessed`, after the Gmail `modify` call and before the final return: if `action === "agreement_received" && reservationCode`: read `FIREBASE_DATABASE_URL` + `FIREBASE_API_KEY` from `process.env`, GET `/bookings/${reservationCode}` (response is `{[occupantId]: any}` — use `Object.keys(response)` for occupant IDs; same pattern as `useBookingEmail.ts:95`; if response is null or empty, log warning and skip), write code 21 for each occupant to both fanout paths, catch any error gracefully
  - Refactor: if a shared Firebase REST utility module is already planned or easy to introduce (e.g. `packages/mcp-server/src/utils/firebase-rest.ts`), extract; otherwise leave as module-private helpers per existing pattern
- **Planning validation:**
  - Checks run: full read of handleMarkProcessed lines 2717-2939 (confirmed zero Firebase calls, confirmed schema args); confirmed handleCancellationCase reads FIREBASE_DATABASE_URL at line ~1886 in same file; markProcessedSchema identified (line 2721)
  - Validation artifacts: code agent output; ProcessCancellationResult pattern from process-cancellation-email.ts
  - Unexpected findings: handleMarkProcessed currently has no process.env.FIREBASE_DATABASE_URL read — must be added inline; no abstraction exists yet for Firebase REST reads in gmail.ts
- **Consumer tracing (new outputs):**
  - New optional `reservationCode` param: all existing callers pass no such field → no behavior change
  - New Firebase writes (code 21): consumed by `useEmailProgressData` reads from /activitiesByCode/ — no code changes needed in that consumer; it will correctly reflect code 21 presence after fix
  - Return structure of `handleMarkProcessed`: unchanged
- **Scouts:**
  - ops-inbox SKILL.md must be updated to pass `reservationCode` when calling `gmail_mark_processed agreement_received`. This is out of scope for this code task but is a required follow-on. Record in Decision Log.
  - The `reservationCode` value in the ops-inbox context comes from the email thread — the agent reads the email body, extracts the booking reference, and passes it. The email body format for T&C agreement replies should contain the reservation code (either in thread subject or prior reply).
- **Edge Cases & Hardening:**
  - `reservationCode` present but booking not in Firebase: log warning "Booking {code} not found", return success (labels applied)
  - `reservationCode` present, Firebase write fails: catch per-occupant, log, return success (degrade gracefully — labels still applied, staff can manually log code 21)
  - Multiple occupants for same reservation: write code 21 for ALL occupants (same behavior as processCancellationEmail)
- **What would make this >=90%:** Verify that the T&C agreement email thread reliably contains the reservation code in a machine-readable location (subject or body), and update ops-inbox skill to extract and pass it. With that confirmed, confidence rises to 90%.
- **Rollout / rollback:**
  - Rollout: deploy mcp-server; new optional param immediately available; callers start passing reservationCode after ops-inbox skill update
  - Rollback: remove the Firebase write block from handleMarkProcessed; schema change is backwards-compatible, no rollback needed for callers
- **Documentation impact:** Update ops-inbox SKILL.md to include reservationCode in agreement_received args; update email-autodraft-system.md WEAK-B1 entry
- **Notes / references:** processCancellationEmail.ts lines 48-65 (firebasePatch pattern); handleCancellationCase line ~1886 (FIREBASE_DATABASE_URL read pattern in same file)
- **Build evidence (2026-02-27):** Exit code 0. `reservationCode: z.string().optional()` added to markProcessedSchema; `reservationCode` added to handleMarkProcessed destructure; Firebase write block (GET /bookings/{code} → PATCH /activities/ + /activitiesByCode/21/) inserted after lockStoreRef.release(). TC-06i updated; TC-06i-b and TC-06i-c added (global.fetch assignment pattern — jest.spyOn not usable in node env). TC: 17/17 pass (all gmail-mark-processed tests). Commit: 226041d244.

---

### TASK-03: Draft cancellation confirmation email when code 22 written
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/tools/process-cancellation-email.ts` (return type), `packages/mcp-server/src/tools/gmail.ts` (handleCancellationCase)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Complete (2026-02-27)
- **Affects:** `packages/mcp-server/src/tools/process-cancellation-email.ts`, `packages/mcp-server/src/tools/gmail.ts`, `packages/mcp-server/src/tools/guest-email-activity.ts` [prerequisite import redirect], `packages/mcp-server/src/__tests__/process-cancellation-email.test.ts`
- **Depends on:** TASK-01, TASK-02 (TASK-01: same file process-cancellation-email.ts — must complete occupant write section before TASK-03 adds occupantIds to return; TASK-02: same file gmail.ts — handleCancellationCase edit must not conflict with handleMarkProcessed edits)
- **Blocks:** TASK-06
- **Confidence:** 80%
  - Implementation: 82% — ProcessCancellationResult extension is additive (one field); email path is `/guestsDetails/{bookingRef}/{occupantId}.email` (confirmed by GuestEmailRecord schema); handleCancellationCase has gmail client, firebaseUrl, firebaseApiKey in scope; `sendGuestEmailActivity({bookingRef, activityCode, recipients})` callable from same package (no `gmail` param needed — function creates own client)
  - Approach: 80% — delegating email drafting to handleCancellationCase after processCancellationEmail returns keeps concerns separate; email failures per-occupant are gracefully isolated from cancellation success
  - Impact: 90% — guests receive cancellation draft without staff action; closes WEAK-A2
  - Held-back test: GET `/guestsDetails/{reservationCode}` returns a map of `{[occupantId]: GuestEmailRecord}` via REST. Confirmed via GuestEmailRecord schema (`.email` field). The single-call approach (vs per-occupant) reduces REST calls. Risk: if REST response structure differs from SDK shape, field extraction may fail silently — mitigated by (a) graceful skip if `email` absent, (b) build execution reads one live record to confirm REST shape before implementing.
- **Acceptance:**
  - `ProcessCancellationResult` success response includes `occupantIds: string[]`
  - After successful code 22 write, `handleCancellationCase` creates Gmail drafts for each occupant that has an email address, using activity code 27 (Cancellation Confirmation template T041)
  - Guests with no email in `/guestsDetails/{reservationCode}` are silently skipped — not an error
  - Email draft failures per-occupant are caught and logged; cancellation still returns `{processed: true}`
  - Test added: valid cancellation → `drafts.create` called with "Cancellation Confirmation" subject for each occupant with email
  - `pnpm --filter mcp-server test` passes
- **Validation contract:**
  - TC-03a: Valid cancellation, guest has email → `drafts.create` called with code 27 template for that occupant
  - TC-03b: Valid cancellation, guest has no email in /guestsDetails/ → no draft created; `{processed: true}` returned
  - TC-03c: `drafts.create` fails → error caught per-occupant; cancellation still `{processed: true}`; error logged
  - TC-03d: ProcessCancellationResult.occupantIds present after TASK-01 completes → usable in handleCancellationCase loop
- **Execution plan:** Red → Green → Refactor
  - Red: add TC-03a to the gmail test file (or handleCancellationCase integration test); test fails (no drafts.create call today)
  - Green:
    0. **Prerequisite (circular import fix):** In `packages/mcp-server/src/tools/guest-email-activity.ts` line 11, change `import { appendTelemetryEvent, applyDraftOutcomeLabelsStrict } from "./gmail.js"` to `import { appendTelemetryEvent, applyDraftOutcomeLabelsStrict } from "./gmail-shared.js"`. Both functions are independently defined in `gmail-shared.ts` (lines 327 and 643); `gmail-shared.ts` does not import from `gmail.ts`. This breaks the circular dependency, allowing step 1b to import safely.
    1. Extend `ProcessCancellationResult` success return at line 202: add `occupantIds` field (`return { status: "success", reservationCode, activitiesWritten: occupantIds.length, occupantIds }`)
    2. Add `import { sendGuestEmailActivity } from "./guest-email-activity.js"` to `gmail.ts` imports (safe after step 0 above)
    3. In `handleCancellationCase` (gmail.ts), in the success branch after `processCancellationEmail` returns: call `await firebaseGet<Record<string, {email?: string}>>(firebaseUrl, \`/guestsDetails/${result.reservationCode}\`, firebaseApiKey)` (reuse `firebaseGet` helper from TASK-02). If response is null (booking has no guestsDetails node), skip the draft loop silently.
    4. Loop over `result.occupantIds`; for each occupantId: look up `guestsDetails?.[occupantId]?.email`
    5. If email present: call `await sendGuestEmailActivity({ bookingRef: result.reservationCode, activityCode: 27, recipients: [email] })`
    6. Wrap each occupant iteration in try-catch — log errors, continue to next occupant
  - Refactor: if `firebaseGet` not yet extracted in TASK-02, add as module-private helper in `gmail.ts` here
- **Planning validation:**
  - Checks run: ProcessCancellationResult type confirmed at lines 71-73 (no occupantIds today); handleCancellationCase lines ~1886 confirmed to have gmail, firebaseUrl, firebaseApiKey in scope; `sendGuestEmailActivity` is exported from the same package (guest-email-activity.ts) with signature `{bookingRef, activityCode, recipients}` — no `gmail` param, creates own client; circular import confirmed: `guest-email-activity.ts:11` imports from `gmail.ts` — resolved by step 0 redirect to `gmail-shared.ts` (both target functions independently defined at lines 327+643 in gmail-shared.ts; gmail-shared.ts does not import gmail.ts)
  - Validation artifacts: code agent output; ProcessCancellationResult does NOT include occupantIds — must be added; `gmail-shared.ts` import chain verified clean
  - Unexpected findings: handleCancellationCase wraps processCancellationEmail in try-catch and returns `{processed: false}` on exception. Email drafting must execute inside the success branch, after the try-catch, to avoid being swallowed by the exception handler.
- **Consumer tracing (modified behavior):**
  - `ProcessCancellationResult` extended with `occupantIds` — additive only; existing callers reading `result.status === "success"` are unaffected; new field is additional data
  - `handleCancellationCase` return value: unchanged (`{processed: true/false}`)
  - Potential double-draft: if staff also manually log code 27 after this auto-draft, two draft emails will be in Gmail. Both require human review before sending — duplicate is visible and deletable. Acceptable trade-off.
- **Scouts:** Confirm the REST response shape of `/guestsDetails/{reservationCode}` before implementing the GET. Expected: `{[occupantId]: {email: string, ...}}` based on GuestEmailRecord schema in useEmailGuest.ts. Read one live record in build execution to verify before implementing the loop. (Note: path is `/guestsDetails/` not `/guestsByBooking/` — the former has email, the latter has reservationCode only.)
- **Edge Cases & Hardening:**
  - Multiple occupants in same booking: each gets a separate draft — this is the expected behavior
  - Occupant with no entry in `/guestsDetails/{reservationCode}` (guest not yet registered): lookup returns undefined → skip silently
  - `sendGuestEmailActivity` called with activityCode 27: uses existing T041 "Cancellation Confirmation" template. This template expects a guest-facing message. It is the same template staff use for manual cancellations — appropriate reuse.
  - `sendGuestEmailActivity` throws on error (no `status: "error"` return) — wrap each per-occupant call in try-catch to prevent a single draft failure from aborting remaining occupants.
- **What would make this >=90%:** Confirm `/guestsDetails/{reservationCode}` REST response shape via direct read in build execution; verify `sendGuestEmailActivity` import path compiles cleanly from gmail.ts (same package — should be straightforward).
- **Rollout / rollback:**
  - Rollout: deploy mcp-server; next Octorate cancellation will also draft guest notification emails
  - Rollback: remove email drafting loop from handleCancellationCase; remove `occupantIds` from ProcessCancellationResult success
- **Documentation impact:** Update email-autodraft-system.md WEAK-A2 entry
- **Notes / references:** ProcessCancellationResult lines 71-73; handleCancellationCase lines ~1886 (FIREBASE_DATABASE_URL read); `sendGuestEmailActivity` in `packages/mcp-server/src/tools/guest-email-activity.ts` — signature: `({bookingRef, activityCode, recipients})` — no `gmail` param, creates own client, throws on error
- **Build evidence (2026-02-27):** Exit code 0. Key architectural discovery: `gmail.ts` `_handleOrganizeInbox` is dead code — live code path routes via `handleOrganizeInboxModule` (gmail-organize.ts) → `handleCancellationCase` (gmail-booking.ts). Implementation placed correctly in `gmail-booking.ts`. Circular import fix confirmed in `guest-email-activity.ts` (line 11 changed to `gmail-shared.js`). `ProcessCancellationResult` extended with `occupantIds` and `guestEmails`. Step 6 in `processCancellationEmail` GETs `/guestsDetails/{code}` (non-fatal). Email drafting loop in `handleCancellationCase` uses `Promise.allSettled` with per-occupant try-catch. TC-01 updated (7th mock for guestsDetails GET); TC-05 asserts `occupantIds`; TC-07a/b/c added for guestEmails edge cases. TC-03a/b/c in `gmail-organize-inbox.test.ts` assert drafting called per-occupant email. 51 targeted tests pass; typecheck clean. Commit: 58f6c21426.

---

### TASK-04: Surface email send failure in reception UI
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — `setError` is in scope in useActivitiesMutations (confirmed); error and deferred branches identified at lines 63-73; one-line change per branch
  - Approach: 85% — using the hook's existing error state avoids touching 20 callers of addActivity; components that already read the hook's `error` field will surface the message; components that don't read `error` are unaffected (acceptable)
  - Impact: 80% — surfaces failure through the hook's error mechanism; depends on consuming components reading `error` state — likely given hook pattern, but not verified for all 20 callers
- **Acceptance:**
  - When `emailResult.status === "error"`: `setError("Email draft not sent — guest notification failed. Please send manually.")` called (in addition to console.error, not replacing it)
  - When `emailResult.status === "deferred"` with `reason === "no-recipient-email"`: `setError("No guest email on record — email not sent.")` called (in addition to console.warn)
  - When `emailResult.status === "deferred"` with other reasons (e.g. `"manual-review"`): behavior unchanged — console.warn only, no error state
  - `pnpm --filter reception test -- useActivitiesMutations` passes (update test if it asserts on error state for these branches)
- **Validation contract:**
  - TC-04a: addActivity, code in relevantCodes, email fails → `error` state set with message containing "Email" or "draft"
  - TC-04b: addActivity, code in relevantCodes, email deferred with no-recipient-email → `error` state set
  - TC-04c: addActivity, code in relevantCodes, email deferred with manual-review → `error` state NOT set
  - TC-04d: addActivity, code NOT in relevantCodes → no email attempted → `error` state not set by email path
- **Execution plan:** Red → Green → Refactor
  - Red: update useActivitiesMutations test to assert `error` state is set on email failure and no-recipient-email deferred; test fails
  - Green: in `maybySendEmailGuest` inside useActivitiesMutations.ts:
    - lines 69-73 (`emailResult.success === false && emailResult.status === "error"`): add `setError("Email draft not sent — guest notification failed. Please send manually.")`
    - lines 63-67 (`emailResult.status === "deferred"` check): add condition on `emailResult.reason === "no-recipient-email"` → `setError("No guest email on record — email not sent.")`
    - `setError` is a stable `useState` dispatcher — React 18 guarantees stability; do NOT add it to the `useCallback` dependency array (exhaustive-deps rules typically exempt setState functions; adding it would cause spurious re-renders on every render)
  - Refactor: none needed
- **Planning validation:**
  - Checks run: maybySendEmailGuest lines 45-92 confirmed; setError in hook scope confirmed; deferred and error branches at lines 63-73; ActivityResult type confirmed (`{success, data?, message?}`) — not changing this type
  - Validation artifacts: code agent output lines 45-92; ActivityResult type from activitiesDomain.ts
  - Unexpected findings: 20 files call addActivity — no changes to those callers; the setError change is inside maybySendEmailGuest which is module-private to the hook
  - Type shape clarification: the `status: "error"` variant exists on `SendEmailGuestResult` (the reception-side wrapper type in `apps/reception/src/services/useEmailGuest.ts`), NOT on `GuestEmailActivityResult` (the MCP tool type in `packages/mcp-server/src/tools/guest-email-activity.ts`). The MCP tool throws on error rather than returning `status: "error"` — the reception wrapper catches the throw and returns `{status: "error", ...}`. `useActivitiesMutations.ts` reads `SendEmailGuestResult` (the wrapper), so the `status === "error"` branch is valid and not dead code.
- **Consumer tracing (modified behavior):**
  - `setError` now called from email failure path — hook's `error` state is set. Components reading `error` (standard hook usage) will display the message. No `ActivityResult` type change → zero caller impact.
- **Scouts:** None: change is contained within the hook.
- **Edge Cases & Hardening:** Error messages must be user-facing (not stack traces). Keep existing console.error/warn alongside setError for developer visibility.
- **What would make this >=90%:** Verify at least one key caller (e.g. StatusButton, EmailBookingButton) reads the hook's `error` state and renders it. If confirmed, impact confidence rises to 90%.
- **Rollout / rollback:**
  - Rollout: deploy reception app; email failures will surface in UI going forward
  - Rollback: remove setError calls, restore console-only
- **Documentation impact:** None
- **Build evidence (2026-02-27):** Exit code 0. setError("No guest email on record — email not sent.") added to no-recipient-email deferred branch; setError("Email draft not sent — guest notification failed. Please send manually.") added to error branch. Existing "logs error" test updated to assert error state; 2 new tests added (no-recipient-email sets error; other deferred reasons do not). TC: 10/10 pass. Commit: 226041d244.

---

### TASK-05: Add FIREBASE_DATABASE_URL startup validation in MCP server
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `packages/mcp-server/src/index.ts` (or equivalent server entry point)
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `packages/mcp-server/src/index.ts`
- **Depends on:** -
- **Blocks:** TASK-06
- **Confidence:** 85%
  - Implementation: 85% — env var validation on startup is a standard pattern; FIREBASE_DATABASE_URL usage confirmed in both process-cancellation-email.ts and gmail.ts; exact startup file not yet confirmed (likely index.ts — locate by grep during build execution)
  - Approach: 90% — non-fatal warning is the correct approach (server must still start for non-Firebase tools)
  - Impact: 80% — prevents silent failures for the next misconfigured deployment; does not retroactively fix existing silent failures
- **Acceptance:**
  - If `process.env.FIREBASE_DATABASE_URL` is empty string or undefined on startup: log warning `[MCP Server] WARNING: FIREBASE_DATABASE_URL is not set — cancellation and activity writes will fail silently`
  - Server still starts (non-fatal — existing Gmail-only functionality must continue)
  - If `FIREBASE_DATABASE_URL` is set but does not start with `https://`: log warning about invalid format
  - No new test required for S-effort guard (acceptable to verify manually post-deploy)
- **Validation contract:**
  - TC-05a: Server starts with valid FIREBASE_DATABASE_URL → no warning in startup output
  - TC-05b: Server starts with FIREBASE_DATABASE_URL unset → warning logged containing "FIREBASE_DATABASE_URL"
- **Execution plan:** Red → Green → Refactor
  - Red: (optional — add startup warning test if test infrastructure allows; otherwise skip and verify manually)
  - Green: in packages/mcp-server/src/index.ts (or main entry file found via grep for `server.run()` or similar), add startup env validation block after imports
  - Refactor: none
- **Planning validation:**
  - Checks run: confirmed FIREBASE_DATABASE_URL read from process.env in process-cancellation-email.ts and gmail.ts; exact entry point not yet read
  - Validation artifacts: code agent report confirms env pattern; index.ts path assumed standard (grep to confirm during build)
  - Unexpected findings: None expected
- **Consumer tracing:** None — startup guard does not change any existing behavior or return types
- **Scouts:** Locate MCP server startup entry point: grep `packages/mcp-server/src` for `server.start()` or `Server.run()` or the main export.
- **Edge Cases & Hardening:** Do not crash/throw on missing URL — log warning only. Firebase tools will fail individually with their own errors. This guard is advisory, not a hard gate.
- **What would make this >=90%:** Confirm exact startup entry point file path and validate the startup hook pattern in that file.
- **Rollout / rollback:**
  - Rollout: deploy mcp-server; startup logs surface missing URL on misconfigured deployments
  - Rollback: remove validation block
- **Documentation impact:** None (operational guard)
- **Build evidence (2026-02-27):** Exit code 0. Startup env validation block added to index.ts before async function main(): warns if FIREBASE_DATABASE_URL unset or does not start with https://. Server continues to start in both cases. No new test (S-effort guard; manual verification acceptable per task acceptance). Commit: 226041d244.

---

### TASK-06: Checkpoint — validate all fixes
- **Type:** CHECKPOINT
- **Deliverable:** evidence that all 5 fixes pass tests and typecheck
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Effort:** S
- **Status:** Complete (2026-02-27)
- **Affects:** `docs/plans/reception-email-activity-control-audit/plan.md`
- **Depends on:** TASK-01, TASK-02, TASK-03, TASK-04, TASK-05
- **Blocks:** -
- **Confidence:** 95%
  - Implementation: 95% — process is defined
  - Approach: 95% — prevents dead-end execution
  - Impact: 95% — controls downstream risk
- **Acceptance:**
  - `pnpm --filter mcp-server test` passes (all updated tests green)
  - `pnpm --filter reception test -- useActivitiesMutations` passes
  - `pnpm typecheck` passes across mcp-server and reception packages
  - No new lint errors introduced in any changed file
- **Horizon assumptions to validate:**
  - All 5 changes compile cleanly (no TypeScript errors from ProcessCancellationResult extension or schema additions)
  - Existing test suites for gmail.ts, process-cancellation-email.ts, useActivitiesMutations.ts all pass
  - No regressions in non-Firebase Gmail tool paths
- **Validation contract:** Test output showing all relevant tests green; `pnpm typecheck` clean
- **Planning validation:** None: checkpoint
- **Rollout / rollback:** `None: planning control task`
- **Documentation impact:** Update plan.md task statuses; note WEAK-B1, WEAK-C1, WEAK-A2, WEAK-A3, WEAK-C2 closed in fact-find
- **Build evidence (2026-02-27):** All gates passed. mcp-server: 51/51 tests pass (process-cancellation-email, gmail-organize-inbox, gmail-mark-processed); typecheck clean (tsc -b exit 0). reception: 10/10 useActivitiesMutations tests pass. No new lint errors. All 5 acceptance criteria met. Commits: 226041d244 (TASK-01/02/04/05), 58f6c21426 (TASK-03).

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: activitiesByCode fanout | Yes — occupantId, activityId, activityData, firebasePatch all in scope at write site | None | No |
| TASK-02: code 21 on agreement_received | Partial — no Firebase infrastructure in handleMarkProcessed today; must add env read and helpers | Moderate: adds Firebase concern to a currently-pure-Gmail function; isolated to one action branch | No — addressed in execution plan (add inline helpers) |
| TASK-03: cancellation email draft | Partial — circular import resolved by prerequisite step 0 (guest-email-activity.ts redirect to gmail-shared.ts); ProcessCancellationResult lacks occupantIds; TASK-01 must complete first (same file) | Resolved: step 0 prerequisite breaks circular dependency before any reverse import is added; `/guestsDetails/` null guard added to execution plan; `sendGuestEmailActivity` throws — try-catch per occupant documented | No — all items addressed in execution plan |
| TASK-04: surface email failure | Yes — setError in scope; error branches confirmed at lines 63-73 | None | No |
| TASK-05: startup validation | Partial — entry point file (index.ts) location not yet confirmed | Minor: grep needed to locate startup hook | No — scout in execution plan |
| TASK-06: checkpoint | Yes — depends on all prior | None | No |

No Critical simulation findings. No Simulation-Critical-Waiver required.

---

## Risks & Mitigations
- **TASK-02 caller dependency:** Fix activates only when ops-inbox skill passes `reservationCode`. If skill not updated, code 21 write is a no-op for live runs. Mitigation: ops-inbox SKILL.md update is required follow-on, noted in Decision Log.
- **TASK-03 circular import (resolved in plan):** `guest-email-activity.ts` imports from `gmail.ts`; importing `sendGuestEmailActivity` back from `guest-email-activity.ts` into `gmail.ts` would be circular. Mitigation: TASK-03 step 0 redirects `guest-email-activity.ts` import to `gmail-shared.ts` first (`appendTelemetryEvent` and `applyDraftOutcomeLabelsStrict` independently defined there). No circular dependency after redirect.
- **TASK-03 double-draft risk:** If staff also manually log code 27 after the MCP auto-draft, two drafts appear in Gmail. Mitigation: both require human review before sending — duplicate is visible and deletable. Acceptable.
- **TASK-03 Octorate webhook retry:** If the same cancellation email is processed twice, two sets of guest drafts are created. Mitigation: drafts require human review; duplicates are visible and deletable. No guest harm.
- **TASK-04 error display dependency:** `setError` is used but consuming components may not display the error state visibly. Mitigation: S-effort change; if error display proves insufficient, a follow-on TASK can add a toast.

## Observability
- Logging: TASK-02 and TASK-03 add per-occupant Firebase write outcome logging; TASK-04 adds user-visible error messages in hook state
- Metrics: None new
- Alerts/Dashboards: TASK-05 startup warning is the primary observability improvement

## Acceptance Criteria (overall)
- [ ] processCancellationEmail writes code 22 to both /activities/ AND /activitiesByCode/ for each occupant (WEAK-C1 closed)
- [ ] `gmail_mark_processed agreement_received` with reservationCode writes code 21 to Firebase (WEAK-B1 closed)
- [ ] Octorate cancellation auto-creates Gmail draft for each guest using code 27 template (WEAK-A2 closed)
- [ ] Email send failure in reception UI sets hook error state with user-visible message (WEAK-A3 closed)
- [ ] MCP server startup warns if FIREBASE_DATABASE_URL missing (WEAK-C2 closed)
- [ ] All relevant tests pass; pnpm typecheck clean across mcp-server and reception

## Decision Log
- 2026-02-27: WEAK-A1 confirmed closed — codes 2/3/4 in relevantCodes and email-templates.json T179/T180 present in current code; no tasks needed
- 2026-02-27: TASK-02 uses optional reservationCode param (not a new MCP tool) — backwards-compatible; callers opt in
- 2026-02-27: TASK-03 uses code 27 (T041 existing template) for guest cancellation notification, not code 22 — avoids needing a new template
- 2026-02-27: TASK-04 uses setError (no ActivityResult type change) — avoids updating 20 callers
- 2026-02-27: ops-inbox SKILL.md update (to pass reservationCode on agreement_received) required as follow-on to TASK-02 — out of scope for this code plan

## Overall-confidence Calculation
- TASK-01: S=1, 90%
- TASK-02: M=2, 80%
- TASK-03: M=2, 80%
- TASK-04: S=1, 85%
- TASK-05: S=1, 85%
- TASK-06: S=1, 95% (checkpoint)
- Weighted = (90×1 + 80×2 + 80×2 + 85×1 + 85×1 + 95×1) / (1+2+2+1+1+1) = 675 / 8 = **84% → 85%**

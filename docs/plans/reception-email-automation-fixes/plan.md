---
Type: Plan
Status: Complete
Domain: UI/API
Workstream: Engineering
Created: 2026-03-14
Last-reviewed: 2026-03-14
Last-updated: 2026-03-14
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: reception-email-automation-fixes
Dispatch-ID: IDEA-DISPATCH-20260314200000-BRIK-001
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 85%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
Related-Analysis: none
---

# Reception Email Automation Fixes Plan

## Summary

Four bounded fixes to the reception app's email automation page and email sending pipeline. The problems were identified through a walkthrough of the `/email-automation` page and its email infrastructure. Issues include: (1) button labels that say "Send" when they only log internal state; (2) booking emails that create Gmail drafts but never send them; (3) no UI display of who last actioned each guest reminder (data is captured but not shown); (4) Gmail auth expiry failures surfacing as generic errors rather than actionable guidance for staff. All tasks are independent and S-effort.

## Active tasks
- [x] TASK-01: Relabel email-automation action buttons and toast messages — Complete (2026-03-14)
- [x] TASK-02: Auto-send booking app-link emails via Gmail (no draft stop) — includes telemetry type, test, EmailBookingButton copy — Complete (2026-03-14)
- [x] TASK-03: Display last-actioned-by (who + when) attribution in email-automation rows — Complete (2026-03-14)
- [x] TASK-04: Detect Gmail auth expiry and surface specific error to staff — Complete (2026-03-14)

## Goals
- Buttons on `/email-automation` accurately describe what they do (log state, not send email).
- Booking app-link emails are sent immediately when the button is pressed during check-in.
- Staff can see who last actioned each reminder and when, directly on the email-automation page.
- Gmail auth failures produce a specific, actionable error message instead of a generic one.

## Non-goals
- Adding actual email-sending capability to the `/email-automation` page itself (out of scope; may be a future feature).
- Full audit log UI with history of all actions per guest.
- Retry or re-send logic for booking emails.
- Changes to the Gmail OAuth credential rotation process.

## Constraints & Assumptions
- Constraints:
  - Tests must not be run locally; push and use CI (`docs/testing-policy.md`).
  - The MCP server and reception app have separate Gmail client implementations; TASK-04 must update both error paths.
  - The `EmailProgressDataSchema` is a Zod schema — extending it requires adding optional fields to avoid breaking the `safeParse` calls in `useEmailProgressData`.
- Assumptions:
  - Gmail `drafts.send()` preserves the message ID so the existing `applyDraftOutcomeLabelsStrict` call can still reference the same message after sending.
  - The `Activity.who` field populated by `useActivitiesMutations.addActivity()` is already present in Firebase for existing records; new records also get it.
  - `findTimestampForCode` in `dateUtils.ts` iterates the `Activity[]` array from `allActivitiesMap` — the same list contains the `who` field for raw activities.

## Inherited Outcome Contract

- **Why:** Staff are misled by button labels that imply emails are sent, and by generic errors when Gmail auth expires. Booking emails silently go undelivered when staff forget to send the draft from Gmail. These are all operational reliability and usability gaps in a live production tool.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** All four gaps are closed: button labels match reality, booking emails send immediately, attribution is visible in the UI, and auth failures surface actionable guidance.
- **Source:** operator

## Analysis Reference
- Related analysis: none (direct micro-build dispatch, no analysis artifact)
- Selected approach inherited: N/A — all four items are execution-tier decisions with no meaningful option forks.
- Key reasoning used: Direct code inspection confirmed the exact lines to change for each task.

## Selected Approach Summary
- What was chosen: Direct code changes at the identified call sites; no architectural changes.
- Why planning is not reopening option selection: All four fixes are point changes. TASK-02 could have kept draft-only and updated UI to say "draft created", but the operator confirmed the fix is to actually send. TASK-04 could use a custom error class instead of message-pattern detection — message-pattern detection is chosen as simpler with no new dependencies.

## Fact-Find Support
- Supporting brief: none (dispatch based on direct code analysis in conversation)
- Evidence carried forward:
  - `EmailProgressLists.tsx:271–275` — exact button label strings confirmed
  - `EmailProgressLists.tsx:56` — exact toast string confirmed
  - `booking-email.ts:95–100` — `gmail.users.drafts.create()` call with no subsequent `drafts.send()`
  - `useActivitiesMutations.ts:187–189` — `Activity` object includes `who` and `timestamp`
  - `emailProgressDataSchema.ts` — schema does not include `who`/attribution field
  - `useEmailProgressData.ts:193–197` — `findTimestampForCode` pattern shows how to extract per-code attribution
  - `gmail-client.ts:350–363` — 401 retry logic, then throws generic `Error`
  - `api-route-helpers.ts:64–74` — `inboxApiErrorResponse` passes raw message through
  - `booking-email/route.ts:47–57` — `mcpToolErrorResponse` passes raw message through

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Relabel email-automation action buttons and toasts | 90% | S | Complete (2026-03-14) | - | - |
| TASK-02 | IMPLEMENT | Auto-send booking app-link emails via Gmail | 80% | S | Complete (2026-03-14) | - | - |
| TASK-03 | IMPLEMENT | Display last-actioned-by (who + when) in email-automation rows | 85% | S | Complete (2026-03-14) | - | - |
| TASK-04 | IMPLEMENT | Detect Gmail auth expiry and surface specific error | 85% | S | Complete (2026-03-14) | - | - |

## Engineering Coverage
| Coverage Area | Planned handling | Tasks covering it | Notes |
|---|---|---|---|
| UI / visual | Button label copy changes; new attribution text in list rows; error message display | TASK-01, TASK-03 | No layout changes; copy-only or small text addition |
| UX / states | Success toast wording updated; auth error state now shows specific message; attribution row is omitted entirely when `who`/`timestamp` is absent (no placeholder text rendered) | TASK-01, TASK-04, TASK-03 | |
| Security / privacy | N/A — no auth changes, no new data exposure | - | TASK-03 shows `who` (staff name) which is internal-only data visible to reception staff |
| Logging / observability / audit | TASK-02 updates telemetry event from `email_draft_created` to `email_sent`; TASK-04 adds specific error code `GMAIL_AUTH_EXPIRED` to response | TASK-02, TASK-04 | |
| Testing / validation | Push to CI; governed test runner for changed components | All | No local test execution per policy |
| Data / contracts | `EmailProgressDataSchema` extended with optional `lastActionedBy` / `lastActionedAt` fields (TASK-03); `BookingEmailResult` type updated (TASK-02) | TASK-02, TASK-03 | Zod schema changes are additive (optional fields) |
| Performance / reliability | TASK-02 adds one additional Gmail API call per booking email send; negligible overhead | TASK-02 | |
| Rollout / rollback | All changes are stateless UI/logic; rollback is git revert | All | No migrations or feature flags required |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01, TASK-02, TASK-03, TASK-04 | - | All independent; can be executed sequentially or in any order |

## Delivered Processes

| Area | Trigger | Delivered step-by-step flow | Tasks / dependencies | Unresolved issues / rollback seam |
|---|---|---|---|---|
| Email automation page — reminder logging | Staff presses action button on `/email-automation` | (1) Staff sees button "Mark First Reminder Sent"; (2) presses it; (3) Firebase activity code written with `who`+`timestamp`; (4) toast: "Marked first reminder as sent for Booking Ref: [ref]"; (5) row moves to code-2 section showing "Last actioned by: [name]" | TASK-01, TASK-03 | None |
| Booking app-link email send | Staff presses booking email button during check-in | (1) Hook fetches guest emails from Firebase; (2) POSTs to `/api/mcp/booking-email`; (3) MCP tool creates Gmail draft + immediately sends it; (4) telemetry `email_sent` logged; (5) success toast shown | TASK-02 | If `drafts.send()` fails, error is returned to client — no partial-send state since message never leaves Gmail's draft state until send succeeds |
| Gmail auth expiry error | Gmail 401 after retry on either inbox send or booking email | (1) `gmailApiRequest` / googleapis throws 401; (2) route handler detects auth-expired pattern; (3) returns `GMAIL_AUTH_EXPIRED` code with message "Email sending failed — Gmail authorisation has expired. Contact your administrator."; (4) client displays specific message | TASK-04 | Rolling back TASK-04 reverts to generic error; no data risk |

## Tasks

---

### TASK-01: Relabel email-automation action buttons and toast messages
- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated button labels and toast strings in `EmailProgressLists.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/components/emailAutomation/EmailProgressLists.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 90%
  - Implementation: 90% — exact string locations confirmed at lines 271–275 (buttons) and 56 (toast). Straightforward copy change.
  - Approach: 90% — no alternative; button copy must match actual action. Operator confirmed: fix is relabelling, not adding send capability.
  - Impact: 90% — eliminates misleading copy that caused staff to believe emails were being sent.
- **Acceptance:**
  - [ ] Button in code-1 section shows "Mark First Reminder Sent" (was "Send First Reminder")
  - [ ] Button in code-2 section shows "Mark Second Reminder Sent" (was "Send Second Reminder")
  - [ ] Button in code-3 section shows "Mark Booking Cancelled" (was "Cancel Booking")
  - [ ] Success toast on code-1→2 transition reads "Marked first reminder as sent for Booking Ref: [ref]"
  - [ ] Success toast on code-2→3 transition reads "Marked second reminder as sent for Booking Ref: [ref]"
  - [ ] Success toast on code-3→4 transition reads "Marked booking as cancelled for Booking Ref: [ref]"
  - [ ] Error toast text is unchanged (already describes the action generically: "Error logging next activity for [ref]")
  - **Expected user-observable behavior:**
    - Staff on `/email-automation` see "Mark First Reminder Sent" instead of "Send First Reminder"
    - After pressing the button, toast uses "Marked" language — never implies an email was sent by the system
    - Section header labels ("First Reminder Sent", "Second Reminder Sent", "Cancelled") remain unchanged — they accurately describe where the guest is, not what action was taken
- **Engineering Coverage:**
  - UI / visual: Required — button label strings and toast strings changed
  - UX / states: Required — toast copy updated per code transition
  - Security / privacy: N/A — copy-only change, no data or auth impact
  - Logging / observability / audit: N/A — no logging changes
  - Testing / validation: Required — CI covers existing component tests; no new test stubs needed for copy changes
  - Data / contracts: N/A — no schema or API changes
  - Performance / reliability: N/A — no logic changes
  - Rollout / rollback: Required — git revert; stateless
- **Validation contract:**
  - TC-01: Render `/email-automation` with a guest at code 1 → button reads "Mark First Reminder Sent"
  - TC-02: Render `/email-automation` with a guest at code 2 → button reads "Mark Second Reminder Sent"
  - TC-03: Render `/email-automation` with a guest at code 3 → button reads "Mark Booking Cancelled"
  - TC-04: Click button on code-1 guest → toast reads "Marked first reminder as sent for Booking Ref: …"
  - TC-05: Click button on code-2 guest → toast reads "Marked second reminder as sent for Booking Ref: …"
  - TC-06: Click button on code-3 guest → toast reads "Marked booking as cancelled for Booking Ref: …"
- **Execution plan:** Red → Green → Refactor
  - Red: Identify all string literals to change in `EmailProgressLists.tsx`
  - Green: Update the ternary in the button render (lines 271–275) and the `showToast` call in `handleNextButton` (line 56) to be code-aware (pass `item.currentCode` through or use a lookup)
  - Refactor: Ensure the three toast messages are consistent in voice and tense
- **Scouts:** None — code locations confirmed by direct read.
- **Edge Cases & Hardening:**
  - The toast is called inside `handleNextButton` which doesn't receive the code directly. The `item` object has `item.currentCode`. The current code at time of button press is the code before the transition. Use a code-to-message map keyed by `item.currentCode`.
  - Section header labels ("First Reminder Sent" etc.) describe the state of guests IN that section, not the action. They remain correct and unchanged.
- **What would make this >=90%:** Already at 90%. No unknowns.
- **Rollout / rollback:**
  - Rollout: Deploy as part of normal reception app release.
  - Rollback: Git revert; no state migration required.
- **Documentation impact:** None.
- **Notes / references:**
  - Button render: `EmailProgressLists.tsx:271–275`
  - Toast call: `EmailProgressLists.tsx:56`
  - Post-build QA: run `/lp-design-qa` and `/tools-ui-contrast-sweep` on `/email-automation` route after build.

---

### TASK-02: Auto-send booking app-link emails via Gmail
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `sendBookingEmail` in `packages/mcp-server/src/tools/booking-email.ts` updated to send the draft; telemetry type extended; test updated; UI copy in `EmailBookingButton.tsx` updated
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/mcp-server/src/tools/booking-email.ts`
  - `packages/mcp-server/src/tools/gmail.ts` — add `email_sent` to `TelemetryEventKey` union (line 191) and `TelemetryEventSchema` z.enum (line 218); update `computeDailyTelemetryRollup` rollup at lines 342–392 to also count `email_sent` → `bucket.drafted` (booking send is create+send in one operation)
  - `packages/mcp-server/src/tools/gmail-shared.ts` — add `email_sent` to `TelemetryEventKey` union (line 162) and `TelemetryEventSchema` z.enum (line 189); update `email_draft_created` rollup logic (lines 375–424) to also count `email_sent`
  - `packages/mcp-server/src/__tests__/gmail-audit-log.test.ts` — add `email_sent` test event to TC-03-03 (lines 372–431) so the rollup test covers the new event key
  - `packages/mcp-server/src/__tests__/booking-email.test.ts` — add `drafts.send` mock; update `email_draft_created` assertion to `email_sent`; update TC-09-03 for softened label-failure contract
  - `apps/reception/src/services/useBookingEmail.ts`
  - `apps/reception/src/services/__tests__/useBookingEmail.test.ts` — update test assertions that reference `draftId: "draft-1"` to match sent semantics (`messageId`); update any assertions that check for draft-related strings
  - `apps/reception/src/components/checkins/EmailBookingButton.tsx` — update toast strings and button title attribute
  - `apps/reception/src/components/checkins/__tests__/EmailBookingButton.test.tsx` — update assertions on `getByTitle("Create booking email draft")` → `"Send booking email"`; update `showToast("Email draft created", "success")` → `"Email sent"`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 80%
  - Implementation: 80% — `gmail.users.drafts.send()` call pattern is clear from googleapis API. `applyDraftOutcomeLabelsStrict` is removed (it applied wrong "drafted" labels). Score: 80 not 85 because the exact googleapis `GaxiosError` format on 401 for the send call is not directly read.
  - Approach: 85% — sending immediately is the correct fix per operator. No option ambiguity.
  - Impact: 85% — guests receive links without requiring manual Gmail step. Direct improvement to a live operational gap.
- **Acceptance:**
  - [ ] After `sendBookingEmail` completes successfully, the email is in the guest's inbox (not just Gmail Drafts)
  - [ ] `BookingEmailResult.success` is true and telemetry event is `email_sent` (not `email_draft_created`)
  - [ ] `useBookingEmail` hook's `message` state reflects sent confirmation (not "draft-created")
  - [ ] `applyDraftOutcomeLabelsStrict` is NOT called — it applies "Brikette/Drafts/Ready-For-Review" + "Brikette/Outcome/Drafted" labels and logs `action: "drafted"`, which are semantically wrong for a directly-sent booking email
  - [ ] `EmailBookingButton.tsx` button title reads "Send booking email" (was "Create booking email draft")
  - [ ] `EmailBookingButton.tsx` success toast reads "Email sent" (was "Email draft created")
  - [ ] `EmailBookingButton.tsx` error toast reads "Failed to send email" (was "Failed to create email draft")
  - **Expected user-observable behavior:**
    - Staff press the booking email button during check-in
    - Operation completes with a success state
    - Guest receives the app-link email without any staff Gmail action required
- **Engineering Coverage:**
  - UI / visual: N/A — no UI component changes (hook's `message` state is consumer-side; existing callers display it)
  - UX / states: Required — hook `message` string updated to reflect sent not draft
  - Security / privacy: N/A — no new data exposure; same recipients, same auth flow
  - Logging / observability / audit: Required — telemetry event key updated from `email_draft_created` to `email_sent`; `draft_id` field may be removed or retained as context
  - Testing / validation: Required — CI covers MCP server tests
  - Data / contracts: Required — `BookingEmailResult.draftId` field: after send the draft ID is no longer meaningful. Either remove or repurpose. Decision: keep field name but note it reflects the draft that was created-then-sent; `messageId` reflects the sent message.
  - Performance / reliability: Required — one additional Gmail API call per booking email; latency impact negligible. If `drafts.send()` throws, the draft was created but not sent — handle error clearly and do not hide it behind the draft-creation success.
  - Rollout / rollback: Required — git revert reverts to draft-only behaviour; existing drafts already in Gmail are unaffected.
- **Validation contract:**
  - TC-01: Call `sendBookingEmail` with valid recipients → Gmail draft created and sent, function returns `{ success: true }`
  - TC-02: Call `sendBookingEmail` with valid recipients → check Gmail Sent folder contains message (not Drafts)
  - TC-03: `appendTelemetryEvent` receives `event_key: "email_sent"` not `"email_draft_created"`
  - TC-04: `drafts.send()` throws (simulate network error after draft creation) → error propagates to caller; no silent swallow
  - TC-05: `applyDraftOutcomeLabelsStrict` is NOT called during `sendBookingEmail` — it applies "drafted" outcome labels which are semantically incorrect for a directly-sent booking email; test TC-09-03 updated to assert the helper is never invoked
  - TC-06: `TelemetryEventKey` type accepts `"email_sent"` — TypeScript compiles without error
  - TC-07: `EmailBookingButton` success toast shows "Email sent"
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm `gmail.users.drafts.send({ userId: "me", requestBody: { id: draftId } })` is the correct call signature for the googleapis client version in use (`packages/mcp-server/package.json`)
  - Green:
    1. In `packages/mcp-server/src/tools/gmail.ts`: add `"email_sent"` to `TelemetryEventKey` union (line 191) and to the `z.enum([...])` in `TelemetryEventSchema` (line 218)
    1b. In `packages/mcp-server/src/tools/gmail-shared.ts`: same — add `"email_sent"` to `TelemetryEventKey` union (line 162) and `TelemetryEventSchema` z.enum (line 189); update rollup branch at lines 375–424 that counts only `email_draft_created` to also count `email_sent`
    2. In `booking-email.ts`: after `gmail.users.drafts.create()`, capture `draftId = response.data?.id` and `draftMessageId = response.data?.message?.id`; guard: throw if `draftId` is null
    3. Call `await gmail.users.drafts.send({ userId: "me", requestBody: { id: draftId } })`
    4. **Remove** the `applyDraftOutcomeLabelsStrict` call entirely. **Reason**: this helper applies `Brikette/Drafts/Ready-For-Review` + `Brikette/Outcome/Drafted` labels and logs `action: "drafted"` — all semantically wrong for a booking email that is directly sent. Booking emails are not workflow drafts; they should not appear in the draft review queue. **Contract change**: TC-09-03 in the existing test currently asserts this helper is called and throws an error; update it to assert the helper is NOT called at all.
    5. Update `appendTelemetryEvent` to use `event_key: "email_sent"`
    6. Update return value: `messageId` is the sent message ID; keep `draftId` field for audit trail
    7. In `useBookingEmail.ts`: update `setMessage` line 240 to use `json?.messageId ?? "sent"` instead of `"draft-created"`
    8. In `EmailBookingButton.tsx`: update `title="Create booking email draft"` → `title="Send booking email"`; update `showToast("Email draft created", ...)` → `showToast("Email sent", ...)`; update error toast `"Failed to create email draft"` → `"Failed to send email"`; update secondary error `"Email draft created, but activity logging failed..."` → `"Email sent, but activity logging failed..."`
    9. Update `packages/mcp-server/src/__tests__/booking-email.test.ts`:
       - Add `send: jest.fn().mockResolvedValue({ data: { id: "msg-1" } })` to the `drafts` mock object
       - Change `draftCreatedEvent` assertion to look for `event_key: "email_sent"` (not `email_draft_created`)
       - Update TC-09-03: when labels fail, result should now have `success: true` (not `isError: true`); add assertion that `sendMock` was called; confirm no throw
    10. Update `apps/reception/src/services/__tests__/useBookingEmail.test.ts`:
        - Update assertions that check `draftId: "draft-1"` in mock responses to use `messageId: "msg-1"` to reflect sent semantics
        - Update any string assertions that reference "draft" in the success path
    11. Update `apps/reception/src/components/checkins/__tests__/EmailBookingButton.test.tsx`:
        - Update `getByTitle("Create booking email draft")` → `getByTitle("Send booking email")` (lines 76, 109, 136)
        - Update `showToast("Email draft created", "success")` → `showToast("Email sent", "success")` (line 88)
  - Refactor: Ensure error thrown by `drafts.send()` propagates cleanly (not swallowed)
- **Planning validation (required for M/L):** N/A — S effort.
- **Scouts:**
  - Verify `googleapis` package version in `packages/mcp-server/package.json` supports `gmail.users.drafts.send()` — this is a standard API call available in all versions ≥ v100.
  - Verify whether a sent Gmail message retains its original message ID (it does by Gmail spec — the message ID is immutable after creation).
- **Edge Cases & Hardening:**
  - If `drafts.create()` succeeds but `drafts.send()` fails: the orphaned draft stays in Gmail Drafts. This is acceptable — staff can find and send it manually, same as before.
  - If label application fails after send: log error but return success. Labels are telemetry/organisation tooling; their failure must not block delivery confirmation.
  - `draftId` may be null if `response.data?.id` is undefined — guard before passing to `drafts.send()`.
- **What would make this >=90%:** Directly verifying the `GaxiosError` message format thrown by googleapis on a 401 response for `drafts.send()`, to confirm the auth-expiry detection in TASK-04 also covers this call path.
- **Rollout / rollback:**
  - Rollout: Normal MCP server deploy.
  - Rollback: Git revert; existing undelivered drafts in Gmail are unaffected.
- **Documentation impact:** MCP tool description in `bookingEmailTools[0].description` should be updated from "Create booking app-link email drafts" to "Send booking app-link emails".
- **Notes / references:**
  - Current draft-create call: `booking-email.ts:95–100`
  - Telemetry call: `booking-email.ts:110–118`
  - Client hook: `useBookingEmail.ts:240`

---

### TASK-03: Display last-actioned-by (who + when) attribution in email-automation rows
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `emailProgressDataSchema.ts` extended with `lastActionedBy` and `lastActionedAt`; `useEmailProgressData.ts` computes both; `EmailProgressLists.tsx` displays both
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/schemas/emailProgressDataSchema.ts`
  - `apps/reception/src/hooks/client/checkin/useEmailProgressData.ts`
  - `apps/reception/src/components/emailAutomation/EmailProgressLists.tsx`
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — `who` field is present in `rawActivities` (from `useActivitiesData`). `allActivitiesMap` already merges raw activities. `findTimestampForCode` pattern shows the extraction approach. Schema extension is additive (optional field).
  - Approach: 85% — displaying existing data in the UI is the minimal correct fix. Full audit log is out of scope.
  - Impact: 85% — staff can now see who last actioned each guest without going to Firebase directly.
- **Acceptance:**
  - [ ] Each guest row on `/email-automation` shows "Last actioned by: [name] · [date time]" when both `who` and `timestamp` are available
  - [ ] When `who` or `timestamp` is absent (older records), the field is omitted entirely (no crash, no "undefined")
  - [ ] `emailProgressDataSchema.ts` has new optional fields `lastActionedBy: z.string().optional()` and `lastActionedAt: z.string().optional()`
  - [ ] `safeParse` continues to succeed for existing records that lack these fields
  - **Expected user-observable behavior:**
    - Each guest row shows a small attribution label: "Last actioned by: Maria · 14 Mar 14:30" or similar
    - Rows where attribution data is missing show nothing — not an error state
    - `hoursElapsed` chip remains unchanged (it shows time since current code was logged, not who did it)
- **Engineering Coverage:**
  - UI / visual: Required — new text element in each list row
  - UX / states: Required — handle missing `who` gracefully (don't render anything if absent)
  - Security / privacy: Required — `who` is `user.user_name` (staff name). Shown to other reception staff; no guest data exposed. Acceptable.
  - Logging / observability / audit: N/A — this IS the observability improvement; no additional logging needed
  - Testing / validation: Required — CI
  - Data / contracts: Required — `EmailProgressDataSchema` extended with optional `lastActionedBy` field
  - Performance / reliability: N/A — `allActivitiesMap` is already computed; finding the attribution is an O(n) scan of the existing activity list for each occupant
  - Rollout / rollback: Required — git revert; no data changes
- **Validation contract:**
  - TC-01: Guest with activity code 2, `who: "Maria"`, `timestamp: "2026-03-14T14:30:00Z"` → row shows "Last actioned by: Maria · 14 Mar 14:30"
  - TC-02: Guest with activity code 2 but `who` field missing → row shows nothing in attribution area (no crash, no "undefined")
  - TC-03: `EmailProgressDataSchema.parse({ ...validItem, lastActionedBy: "Maria", lastActionedAt: "2026-03-14T14:30:00Z" })` → succeeds
  - TC-04: `EmailProgressDataSchema.parse({ ...validItem })` (no attribution fields) → still succeeds (optional fields)
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm `Activity.who` is present in `allActivitiesMap` entries from `rawActivities` (it is, per `useActivitiesMutations.ts:187`)
  - Green:
    1. In `emailProgressDataSchema.ts`: add `lastActionedBy: z.string().optional()` and `lastActionedAt: z.string().optional()` to schema
    2. In `useEmailProgressData.ts`: add a helper `findAttributionForCode(activityList: Activity[], code: number): { who?: string; timestamp?: string }` that finds the `who` and `timestamp` fields on the Activity matching the given code (mirrors `findTimestampForCode`)
    3. In `useEmailProgressData.ts`: compute `{ who: lastActionedBy, timestamp: lastActionedAt } = findAttributionForCode(activityList, currentCode)` and include both in the `candidate` object
    4. In `EmailProgressLists.tsx`: render `{item.lastActionedBy && <span className="text-muted-foreground text-xs">Last actioned by: {item.lastActionedBy}{item.lastActionedAt ? ` · ${formatEnGbDateTime(new Date(item.lastActionedAt), { dateStyle: 'short', timeStyle: 'short' })}` : ''}</span>}` in the row layout (use the existing `formatEnGbDateTime` utility already imported in `EmailBookingButton`)
  - Refactor: Ensure `findWhoForCode` handles the case where no activity with the given code exists
- **Planning validation (required for M/L):** N/A — S effort.
- **Scouts:**
  - Confirm `Activity` type has a `who` field (confirmed: `useActivitiesMutations.ts:187` creates `{ code, who: finalWho, timestamp }`).
  - Confirm `rawActivities` from `useActivitiesData()` provides the `who` field per activity (code inspection of `useActivitiesData` not done — but the Activity type from `useActivitiesMutations` confirms the shape written to Firebase; `useActivitiesData` reads the same path).
- **Edge Cases & Hardening:**
  - Activities written while offline use `queueOfflineWrite`; they also include `who: user.user_name` — attribution is present for offline-queued writes that have synced.
  - `activitySchema` requires `who` — records missing this field are dropped by the parser before reaching `useEmailProgressData`. The only "no attribution" scenario is: no activity record found for the guest's current code. Handle gracefully by treating absent attribution as "don't render the field" (not "render Unknown").
  - The `codeActivitiesMap` (from `activitiesByCodes`) drops `timestamp` and may not have `who` populated reliably. Only use `rawActivities` entries for attribution.
- **What would make this >=90%:** Reading `useActivitiesData.ts` to confirm the `who` field is returned in the hook's output.
- **Rollout / rollback:**
  - Rollout: Normal reception app deploy.
  - Rollback: Git revert; Firebase data unchanged.
- **Documentation impact:** None.
- **Notes / references:**
  - Activity write with `who`: `useActivitiesMutations.ts:185–189`
  - `findTimestampForCode` pattern: `useEmailProgressData.ts:193–197`
  - Schema location: `apps/reception/src/schemas/emailProgressDataSchema.ts`
  - Post-build QA: run `/lp-design-qa` and `/tools-ui-contrast-sweep` on `/email-automation` route after build.

---

### TASK-04: Detect Gmail auth expiry and surface specific error to staff
- **Type:** IMPLEMENT
- **Deliverable:** code-change — `api-route-helpers.ts` and `booking-email/route.ts` updated to detect auth-expired errors and return specific error code/message
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `apps/reception/src/lib/inbox/api-route-helpers.ts`
  - `apps/reception/src/app/api/mcp/booking-email/route.ts`
  - `apps/reception/src/app/api/mcp/__tests__/booking-email.route.test.ts` — add new test case covering `GMAIL_AUTH_EXPIRED` code when Gmail returns 401 (alongside existing test at lines 151–178 for generic `MCP_TOOL_ERROR`)
  - `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts` — add new test case adjacent to the existing happy-path send test (lines 523–602) covering `GMAIL_AUTH_EXPIRED` code when `sendGmailDraft` throws a 401 error, so the inbox send path is verified for the new error code
- **Depends on:** -
- **Blocks:** -
- **Confidence:** 85%
  - Implementation: 85% — error message pattern from `gmail-client.ts:363` is `"Gmail API request failed: HTTP 401"` or `"Gmail API request failed: <Google error message>"`. For MCP server (googleapis library), 401 errors use `GaxiosError` with `response.status === 401`. Pattern-matching on the error message is reliable for the reception app path. The MCP server path is slightly less certain without reading the googleapis error format — this is the cap.
  - Approach: 85% — message-pattern detection is the simplest approach. Creating a custom error class would be cleaner but adds complexity across two separate packages. Message-pattern is sufficient.
  - Impact: 85% — staff get a clear, actionable message instead of a cryptic one. Direct UX improvement.
- **Acceptance:**
  - [ ] When Gmail returns 401 on inbox send, response body contains `{ code: "GMAIL_AUTH_EXPIRED", error: "Email sending failed — Gmail authorisation has expired. Contact your administrator." }`
  - [ ] When Gmail returns 401 on booking email send, same specific error is returned
  - [ ] All other Gmail errors still use generic error codes and messages (no regression)
  - [ ] `useBookingEmail.ts` `message` state displays the specific message (already propagated via `json?.error`)
  - **Expected user-observable behavior:**
    - When Gmail auth expires, staff see: "Email sending failed — Gmail authorisation has expired. Contact your administrator."
    - For all other email failures, error presentation is unchanged
- **Engineering Coverage:**
  - UI / visual: N/A — error message text change only; no component changes
  - UX / states: Required — specific error state distinguishable from generic errors
  - Security / privacy: N/A — error message text does not expose credentials or internal details
  - Logging / observability / audit: Required — `GMAIL_AUTH_EXPIRED` error code is distinct in logs; observable in Cloudflare log drain
  - Testing / validation: Required — CI
  - Data / contracts: Required — response schema for both routes gains a new `code` value `GMAIL_AUTH_EXPIRED`; clients that switch on `code` should be checked
  - Performance / reliability: N/A — error detection adds negligible overhead (string check)
  - Rollout / rollback: Required — git revert returns to generic error messages
- **Validation contract:**
  - TC-01: `inboxApiErrorResponse(new Error("Gmail API request failed: HTTP 401"))` → returns JSON with `code: "GMAIL_AUTH_EXPIRED"` and specific error message
  - TC-02: `mcpToolErrorResponse(new Error("Gmail API request failed: HTTP 401"))` → returns JSON with `code: "GMAIL_AUTH_EXPIRED"` and specific error message
  - TC-03: `inboxApiErrorResponse(new Error("Some other error"))` → returns generic `INBOX_API_ERROR` code (no regression)
  - TC-04: `mcpToolErrorResponse(new Error("Invalid payload"))` → returns generic `MCP_TOOL_ERROR` code (no regression)
  - TC-05: Gmail auth error from googleapis (MCP server path) contains "401" or "Unauthorized" in message → detected and mapped to `GMAIL_AUTH_EXPIRED`
- **Execution plan:** Red → Green → Refactor
  - Red: Confirm exact error message format from `gmail-client.ts` on 401 (confirmed: `"Gmail API request failed: HTTP 401"` or `"Gmail API request failed: <Google detail>"`)
  - Green:
    1. Add helper `isGmailAuthExpiredError(error: unknown): boolean` that checks if message includes `"401"` or `"Unauthorized"` or `"invalid_grant"` — in `api-route-helpers.ts` and inline in `booking-email/route.ts`
    2. In `inboxApiErrorResponse`: check `isGmailAuthExpiredError(error)` before the generic branch; if true return `{ code: "GMAIL_AUTH_EXPIRED", error: "Email sending failed — Gmail authorisation has expired. Contact your administrator." }` with status 502
    3. In `mcpToolErrorResponse` in `booking-email/route.ts`: same pattern
    4. In `apps/reception/src/app/api/mcp/__tests__/booking-email.route.test.ts`: add test case adjacent to the existing generic-error test (lines 151–178) that mocks a Gmail 401 error and asserts `{ code: "GMAIL_AUTH_EXPIRED", error: "Email sending failed — Gmail authorisation has expired. Contact your administrator." }` in the response
    5. In `apps/reception/src/app/api/mcp/__tests__/inbox-actions.route.test.ts`: add test case where `sendGmailDraftMock` throws `new Error("Gmail API request failed: HTTP 401")` and assert response contains `{ code: "GMAIL_AUTH_EXPIRED" }` — covers the inbox send path for the same helper
  - Refactor: Extract the helper to a shared location if it needs to be reused (otherwise inline is fine for S effort)
- **Planning validation (required for M/L):** N/A — S effort.
- **Scouts:**
  - Confirm the googleapis library error format on 401 (MCP server path uses `gmail.users.drafts.create()` from googleapis). The googleapis library throws `GaxiosError` on non-2xx responses; its `.message` typically contains the HTTP status or error description. The string `"401"` or `"Unauthorized"` will be present.
- **Edge Cases & Hardening:**
  - `invalid_grant` is the Google OAuth error code for an expired refresh token — must be included in the pattern check.
  - The `inboxApiErrorResponse` function is used for many inbox errors (not just Gmail). The auth check must only fire on the specific patterns; all other errors must fall through to the generic path.
  - The `mcpToolErrorResponse` is currently only used in the booking-email route — no other callers to check.
- **What would make this >=90%:** Reading the googleapis `GaxiosError` class to confirm the 401 message format for the MCP server path.
- **Rollout / rollback:**
  - Rollout: Normal reception app and MCP server deploy.
  - Rollback: Git revert; no state changes.
- **Documentation impact:** None.
- **Notes / references:**
  - `gmailApiRequest` 401 retry and throw: `apps/reception/src/lib/gmail-client.ts:350–363`
  - `inboxApiErrorResponse`: `apps/reception/src/lib/inbox/api-route-helpers.ts:64–74`
  - `mcpToolErrorResponse`: `apps/reception/src/app/api/mcp/booking-email/route.ts:47–57`
  - `useBookingEmail` error propagation: `useBookingEmail.ts:242–248` (error surfaced via `setMessage`)

---

## Risks & Mitigations
- **TASK-02 label application removed**: `applyDraftOutcomeLabelsStrict` applied "Brikette/Drafts/Ready-For-Review" + "Brikette/Outcome/Drafted" labels and logged `action: "drafted"`. Keeping it after a send would mislabel sent booking emails as unreviewed drafts. The call is removed entirely — booking emails are not workflow drafts.
- **TASK-03 `who` field availability**: `activitySchema` and `activityByCodeDataSchema` both require `who` as a non-optional field. Activity records missing `who` fail schema validation and are dropped before reaching `useEmailProgressData`. The "missing attribution" scenario is therefore: no activity record found for the guest's current code (not: activity found but `who` absent). The `lastActionedBy` field is `undefined` when no qualifying activity exists; display nothing in that case.
- **TASK-04 googleapis error format**: The MCP server uses googleapis library; its 401 error message format is assumed to contain "401" or "Unauthorized". Mitigation: include `invalid_grant` in pattern check; worst case a 401 from googleapis is treated as a generic error (same as today).

## Observability
- Logging: TASK-02 changes telemetry event key from `email_draft_created` to `email_sent` — visible in MCP telemetry log.
- Metrics: TASK-04 adds `GMAIL_AUTH_EXPIRED` as a distinct error code — observable in Cloudflare log drain by searching for this code.
- Alerts/Dashboards: None added — monitoring of `GMAIL_AUTH_EXPIRED` occurrence frequency is a post-build consideration.

## Acceptance Criteria (overall)
- [ ] All four IMPLEMENT tasks pass their validation contracts
- [ ] No regressions to existing email-automation page behaviour (existing rows still display, confirm still works)
- [ ] Inbox send path unaffected by TASK-04 for non-auth errors
- [ ] Booking email send path delivers to guest inbox end-to-end (TASK-02)
- [ ] CI passes after all changes pushed

## Decision Log
- 2026-03-14: TASK-01 fix is relabelling only (not adding actual send capability to the page). Operator confirmed this.
- 2026-03-14: TASK-02 approach is auto-send (not "show draft confirmation in UI"). Operator confirmed.
- 2026-03-14: TASK-03 scoped to display existing data, not add new data capture. Attribution already written by `useActivitiesMutations.addActivity()`.
- 2026-03-14: TASK-04 uses message-pattern detection (not custom error class). Simpler, no cross-package dependency.
- 2026-03-14: TASK-02 label-application contract changed from hard-fail to log-and-continue. `applyDraftOutcomeLabelsStrict` throwing after send will not prevent the email from being confirmed as sent. Existing test TC-09-03 updated to match. Labels are organisational tooling; their failure must not block delivery confirmation.
- 2026-03-14: TASK-02 blast radius confirmed wider than initial estimate: `EmailBookingButton.tsx`, `gmail.ts` (TelemetryEventKey), and `booking-email.test.ts` all require updates. Added to Affects.
- 2026-03-14: TASK-03 extended to include `lastActionedAt` (timestamp) alongside `lastActionedBy`. Both fields available in rawActivities Activity records.
- 2026-03-14: [Adjacent: delivery-rehearsal] Full audit log UI for email-automation history (who did what over time) — out of scope; could be a future plan.
- 2026-03-14: TASK-02 blast radius extended further: `gmail-shared.ts` also defines `TelemetryEventKey` and `TelemetryEventSchema` with `email_draft_created` only — must also add `email_sent` there plus update rollup logic. `EmailBookingButton.test.tsx` and `useBookingEmail.test.ts` assert draft semantics and must be updated. All added to Affects.
- 2026-03-14: TASK-04 blast radius extended: `booking-email.route.test.ts` missing `GMAIL_AUTH_EXPIRED` test case — added to Affects with explicit new test case.
- 2026-03-14: Engineering Coverage UX/states row corrected: missing attribution omits the field entirely (does not show "Unknown"). Aligns with TASK-03 acceptance criteria.
- 2026-03-14: TASK-02 critical correction: `applyDraftOutcomeLabelsStrict` applies "Brikette/Drafts/Ready-For-Review" + "Brikette/Outcome/Drafted" labels and logs `action: "drafted"` — semantically wrong for a sent booking email. Call removed entirely. TC-09-03 updated to assert it is never called.
- 2026-03-14: TASK-02 rollup blast radius: `gmail.ts:342–392` `computeDailyTelemetryRollup` also checks `email_draft_created` — must add `email_sent` there too. `gmail-audit-log.test.ts` TC-03-03 must include the new event key. Both added to Affects.
- 2026-03-14: TASK-03 edge case corrected: `activitySchema.who` is required (non-optional). Records without `who` fail schema and are dropped before reaching display. "Missing attribution" only occurs when no activity exists for the current code — not when activity exists but lacks `who`.
- 2026-03-14: TASK-04 test scope extended: `inbox-actions.route.test.ts` added to Affects with a new `GMAIL_AUTH_EXPIRED` test case for the inbox send path (the helper governs both paths).

## Rehearsal Trace
| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Relabel buttons and toasts | Yes — `EmailProgressLists.tsx` lines confirmed; `item.currentCode` is available in `handleNextButton` context via the `item` closure | None | No |
| TASK-02: Auto-send booking emails | Yes — `gmail.users.drafts.create()` call confirmed; `draftId` is returned; `drafts.send()` is a standard googleapis call. All affected files enumerated: `gmail.ts`, `gmail-shared.ts` (TelemetryEventKey + rollup in both), `gmail-audit-log.test.ts`, `booking-email.test.ts` (TC-09-03 + send mock), `EmailBookingButton.tsx`, `EmailBookingButton.test.tsx`, `useBookingEmail.test.ts`. `applyDraftOutcomeLabelsStrict` removed (applied wrong labels). | None — all rehearsal issues resolved | No |
| TASK-03: Display attribution in rows | Yes — `who` is required in `activitySchema`; records missing it are dropped before display. Missing attribution scenario is: no activity for current code. `rawActivities` path used exclusively. | None — edge case corrected in plan | No |
| TASK-04: Gmail auth error detection | Yes — error message format confirmed from `gmail-client.ts:363`; MCP server path assumes similar pattern; `booking-email.route.test.ts` and `inbox-actions.route.test.ts` both in Affects with explicit new test cases | [Minor] googleapis `GaxiosError` message format assumed to contain "401" or "Unauthorized" — not directly verified | No — `invalid_grant` fallback included; worst case is graceful degradation to generic error |

## Overall-confidence Calculation
- S=1, M=2, L=3
- TASK-01: 90% × 1 = 90
- TASK-02: 80% × 1 = 80
- TASK-03: 85% × 1 = 85
- TASK-04: 85% × 1 = 85
- Overall-confidence = (90 + 80 + 85 + 85) / 4 = **85%**

---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: Platform
Workstream: Engineering
Created: 2026-02-18
Last-updated: 2026-02-18
Feature-Slug: reception-email-activity-control-audit
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/reception-email-activity-control-audit/plan.md
Business-OS-Integration: off
Business-Unit: BRIK
Card-ID: none
---

# Reception Email ↔ Activity Code Control Audit — Fact-Find Brief

## Scope

### Summary

Audit of the bidirectional control flow between the Brikette reception system, Firebase activity codes, and the Gmail email system. The system has two email channels (outbound drafts via MCP/Gmail API; incoming email processing via MCP inbox tools) and one activity database (Firebase Realtime Database). This brief maps every path where these systems interact and identifies all control weakpoints: places where an activity code is written without an email being produced, or where an incoming email is processed without a valid activity code being written.

### Goals
- Enumerate all gaps where activity writes do not produce emails (and assess intent vs. oversight)
- Enumerate all gaps where inbound email processing does not write activity codes
- Identify data consistency bugs (e.g. missing fanout paths)
- Identify silent failure modes and error-handling gaps
- Produce a prioritised risk register ready for planning

### Non-goals
- Redesigning the email system architecture
- Implementing new email templates (tracked separately in reception-email-integration-gaps plan)
- Audit of the Prisma/PostgreSQL layer (no email or activity data lives there)

### Constraints & Assumptions
- Constraints:
  - All hotel/reception activity data is in Firebase Realtime Database, not PostgreSQL
  - Outbound emails are Gmail drafts for human review — not auto-sent
  - The MCP server communicates with Firebase via REST API (no Firebase SDK on server)
- Assumptions:
  - Codes not in `relevantCodes` that have no email are intentional for purely operational codes (9, 10, 11, 12, 13, 14, 15, 16, 23, 26)
  - Code 1 (BOOKING_CREATED) has no email because the app-link email is sent separately
  - The two-path fanout (`/activities/` + `/activitiesByCode/`) must be kept consistent for all writes

---

## Evidence Audit (Current State)

### Entry Points

**Outbound email trigger paths (activity → email):**
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:143` — `addActivity()` → `maybeSendEmailGuest()` — primary path for all UI-triggered activity writes
- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:310` — `saveActivity()` → `maybeSendEmailGuest()` — alternate path used by extension/checkout flows
- `apps/reception/src/hooks/orchestrations/emailAutomation/useEmailProgressActions.ts:113,154` — `logNextActivity()` / `logConfirmActivity()` → delegates to `addActivity()`

**Inbound email → activity write paths:**
- `packages/mcp-server/src/tools/gmail.ts:handleOrganizeInbox` → `handleCancellationCase()` → `processCancellationEmail()` — sole automated path writing activity codes from inbound email
- `packages/mcp-server/src/tools/process-cancellation-email.ts:92` — `processCancellationEmail()` — writes code 22 to Firebase via REST

**Outbound email API route:**
- `apps/reception/src/app/api/mcp/guest-email-activity/route.ts` — thin wrapper → `sendGuestEmailActivity()` in mcp-server
- `apps/reception/src/app/api/mcp/booking-email/route.ts` — thin wrapper → `sendBookingEmail()` in mcp-server

### Key Modules / Files

- `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` — single source of truth for activity writes from the reception UI; contains `relevantCodes` filter
- `apps/reception/src/constants/activities.ts` — canonical ActivityCode enum (codes 1–27)
- `apps/reception/src/constants/emailCodes.ts` — EMAIL_CODES set `{1, 2, 3, 11, 15, 17, 18, 19, 20, 24}` used for email eligibility UI
- `apps/reception/src/services/useEmailGuest.ts` — fetches guest emails from Firebase then POSTs to the MCP route
- `packages/mcp-server/src/tools/guest-email-activity.ts` — maps activity code → email template → creates Gmail draft; the `resolveTemplateSubject()` switch is the definitive code→email mapping
- `packages/mcp-server/src/tools/process-cancellation-email.ts` — processes Octorate cancellation emails, writes code 22 to Firebase
- `packages/mcp-server/src/parsers/cancellation-email-parser.ts` — extracts reservation codes from Octorate emails; hard-excludes all OTA sources
- `packages/mcp-server/src/tools/gmail.ts` — inbox organiser, `handleMarkProcessed`, `handleCancellationCase`; **zero Firebase writes except via `processCancellationEmail`**
- `packages/mcp-server/src/utils/workflow-triggers.ts` — maps prepayment steps to codes and email templates (informational only — no writes)

### Data & Contracts

**`relevantCodes` (codes that trigger email in UI path):**
```typescript
// useActivitiesMutations.ts:50
const relevantCodes = [21, 5, 6, 7, 8, 27];
```

**`resolveTemplateSubject()` (codes that have MCP email templates):**
| Code | Subject / Status |
|------|-----------------|
| 21 | "Agreement Received" |
| 5  | "Prepayment - 1st Attempt Failed (Octorate/Hostelworld)" |
| 6  | "Prepayment - 2nd Attempt Failed" |
| 7  | "Prepayment - Cancelled post 3rd Attempt" |
| 8  | "Prepayment Successful" |
| 27 | "Cancellation Confirmation" |
| 2, 3, 4 | → `deferred` (reason: `unsupported-activity-code`) |
| all others | → `deferred` (reason: `unknown-activity-code`) |

**Firebase fanout paths (canonical pattern used by `useActivitiesMutations`):**
```
/activities/{occupantId}/{activityId}           ← { code, who, timestamp }
/activitiesByCode/{code}/{occupantId}/{actId}   ← { who, timestamp }
```
Both paths are written atomically for every activity from the UI.

**Gmail → Firebase credential chain:**
```
process.env.FIREBASE_DATABASE_URL  (required)
process.env.FIREBASE_API_KEY       (optional — used as ?auth= query param)
```
Source: `packages/mcp-server/src/tools/gmail.ts:handleCancellationCase`

### Dependency & Impact Map

**Upstream dependencies:**
- Firebase Realtime Database (all activity/booking data)
- Gmail API OAuth2 (`packages/mcp-server/credentials.json` + `token.json`)
- Octorate PMS (sends NEW CANCELLATION and NEW RESERVATION emails)
- Reception app authenticated user session (required for `addActivity` / `saveActivity`)

**Downstream dependents:**
- `useEmailProgressData` — reads `/activities/` AND `/activitiesByCode/` to compute email eligibility; uses `EMAIL_CODES` filter
- `getActivityLevel()` (`apps/reception/src/components/search/Search.tsx`) — computes display status from activity history; pure function, no writes
- `useArchiveCheckedOutGuests.ts` — reads `/activities/{occupantId}` then moves to `/archive/activities/`
- Human staff reviewing Gmail drafts before sending

### Test Landscape

#### Existing Test Coverage
| Area | Test Type | Files |
|------|-----------|-------|
| `guest-email-activity.ts` | Unit | `packages/mcp-server/src/__tests__/guest-email-activity.test.ts` (inferred from imports) |
| `cancellation-email-parser.ts` | Unit | `packages/mcp-server/src/__tests__/parsers/cancellation-email-parser.test.ts` (inferred) |
| `useEmailGuest` | Unit | `apps/reception/src/services/__tests__/useEmailGuest.test.tsx` (confirmed) |
| Firebase security rules | Integration | `apps/reception/src/rules/__tests__/databaseRules.test.ts` |

#### Coverage Gaps
- No test covering `processCancellationEmail` write to `/activities/` verifying that `/activitiesByCode/` is NOT written (the bug is untested)
- No integration test covering the full chain: Octorate cancellation email → activity code 22 → email eligibility exclusion
- No test for Gmail credential failure path in `handleCancellationCase` (silent error)
- `handleMarkProcessed` with `agreement_received` action: no test asserting that code 21 is NOT written (the gap is untested and thus invisible)

---

## Control Weakpoints — Detailed Findings

### DIRECTION A: Activity code written → no email produced

#### WEAK-A1 (KNOWN TECH DEBT) — Codes 2, 3, 4 write to Firebase but NO email drafted
**Severity: HIGH**

- **What happens:** When `logNextActivity()` advances a booking through the T&C sequence (1→2→3→4), `addActivity()` is called with codes 2 (FIRST_REMINDER), 3 (SECOND_REMINDER), or 4 (AUTO_CANCEL_NO_TNC). These codes are NOT in `relevantCodes` — they were deliberately removed because MCP email templates don't exist.
- **Observed comment:** `useActivitiesMutations.ts:40-48` contains explicit TODO noting this is known tech debt.
- **Result:** Activity is logged in Firebase, the reception UI shows the code advanced, but NO email draft is created. Staff receive no indication of failure vs. intentional skip. The guest receives no communication.
- **Path:** `logNextActivity()` → `addActivity(occupantId, 2|3|4)` → `maybeSendEmailGuest()` → `relevantCodes.includes(code)` returns false → early return
- **Root cause:** Missing entries in both `relevantCodes` array AND missing templates in `email-templates.json`

#### WEAK-A2 — Code 22 (SYSTEM_GENERATED_CANCELLATION) writes to Firebase but NO outbound guest email
**Severity: HIGH**

- **What happens:** When `processCancellationEmail` runs (triggered by an Octorate "NEW CANCELLATION" email), it writes code 22 for each occupant. Code 22 is NOT in `relevantCodes` and has no template in `resolveTemplateSubject()`. No guest cancellation email is produced.
- **Current workaround:** Staff must separately log code 27 (CANCELLED) via `useCancelBooking.ts`, which DOES trigger a "Cancellation Confirmation" email (code 27 IS in `relevantCodes`).
- **Risk:** If the Octorate cancellation email is processed automatically (code 22 written) but the staff don't notice and don't manually log code 27, the guest receives no cancellation confirmation.
- **Two cancellation codes with different email behaviour:**
  - Code 22 = system-generated, written by MCP from inbound email → NO guest email
  - Code 27 = staff-triggered manual cancellation → guest email drafted
- **Path:** `handleCancellationCase()` → `processCancellationEmail()` → Firebase PATCH `/activities/{occupantId}/` with `code: 22` → nothing further

#### WEAK-A3 — Error handling asymmetry: email failure doesn't surface to UI
**Severity: MEDIUM**

- **What happens:** In `useActivitiesMutations.ts`, `maybeSendEmailGuest` errors are caught internally with `console.error()` only. `addActivity()` returns `{success: true}` even when the email step fails. The calling component sees success; no alert, no retry queue.
- **Affected codes:** 21, 5, 6, 7, 8, 27 — all codes in `relevantCodes`
- **Failure modes:** Gmail OAuth token expired, MCP server cold-start timeout, `guestsByBooking/{occupantId}` missing, `guestsDetails/{bookingRef}` empty (no email address)
- **Evidence:** `useActivitiesMutations.ts:78-98` — deferred and error branches both console-log only
- **"deferred" status:** `status: "deferred"` is returned when guest has no email address (`reason: "no-recipient-email"`) — this is silently swallowed

#### WEAK-A4 — RESEND_APP_EMAIL (code 26) writes activity but sends app-link email, not guest-email-activity
**Severity: LOW / INFORMATIONAL**

- **What happens:** `EmailBookingButton.tsx:71` calls `logActivity(occId, 26)` after triggering a booking email. The booking email goes via `useBookingEmail` → `/api/mcp/booking-email`. Code 26 IS logged to Firebase but only through `logActivity` (which calls `addActivity`). Since 26 is not in `relevantCodes`, no second email is triggered.
- **This is correct behaviour** but worth noting as the activity log and the email are initiated separately — they could drift out of sync if one fails but not the other.

---

### DIRECTION B: Email arrives → no activity code written

#### WEAK-B1 (CRITICAL) — Guest T&C agreement reply detected but code 21 NOT written automatically
**Severity: CRITICAL**

- **What happens:** When a guest replies with "I agree" to the T&C email, `isAgreementReplySignal()` can detect it. The agent tool `gmail_mark_processed` with action `agreement_received` ONLY updates Gmail labels (`Workflow/Agreement-Received`, removes queue labels). **Zero Firebase writes occur.**
- **Expected state:** Code 21 (AGREED_NONREFUNDABLE_TNC) must be logged manually by staff using the Email Automation page's "Confirm" button.
- **Risk:** If the Gmail inbox agent processes an agreement reply and marks it `agreement_received`, the Gmail label state diverges from Firebase. The email automation dashboard will still show the guest as un-confirmed (code < 21). Staff may send a second reminder unnecessarily, or the guest's booking may be auto-cancelled despite having agreed.
- **Evidence:** `handleMarkProcessed` (gmail.ts) — no Firebase calls anywhere in the function; `resolvePrepaymentWorkflow` in the response is informational metadata only
- **Gap:** No automated bridge from `agreement_received` Gmail label to code 21 Firebase write

#### WEAK-B2 — Prepayment chase workflow: codes 5/6/7 NOT written when email is marked
**Severity: HIGH**

- **What happens:** When an agent marks an email `prepayment_chase_1/2/3`, `handleMarkProcessed` applies Gmail labels and returns a `workflow` object containing the activity code and description (via `resolvePrepaymentWorkflow`). But this is **informational only** — no Firebase write occurs.
- **Intended flow per `workflow-triggers.ts`:**
  - `prepayment_chase_1` → code 5 (FAILED_ROOM_PAYMENT_1)
  - `prepayment_chase_2` → code 6 (FAILED_ROOM_PAYMENT_2)
  - `prepayment_chase_3` → code 7 (AUTO_CANCEL_NO_PAYMENT)
- **Actual flow:** The agent sees the workflow metadata in the response and must separately call the Firebase write path. If the agent doesn't act on the metadata, or the agent session ends, the activity codes are never written.
- **Counterpoint:** The `PrepaymentsContainer.tsx` component also calls `addActivity(occupantId, codeToLog)` for prepayment codes — but this is the UI path, not the email-processing path. The two paths are independent and could double-write or diverge.

#### WEAK-B3 — OTA cancellation emails (Hostelworld, Booking.com) silently ignored
**Severity: MEDIUM**

- **What happens:** `cancellation-email-parser.ts:30-33` — `isFromOctorate()` checks for `noreply@smtp.octorate.com` only. All OTA-sourced cancellations are returned as `null` and the email is not processed. No activity code is written.
- **Consequence:** When a guest cancels a Hostelworld or Booking.com booking, the reception system has no automated way to write activity codes. Staff must manually discover and process the cancellation.
- **Scope:** Only Octorate-originated cancellations are supported. Comments acknowledge this: "OTA cancellation emails (Hostelworld, Booking.com) are explicitly ignored to avoid duplicate processing."
- **Risk:** If Hostelworld/Booking.com also send cancellation emails, and the Octorate system mirrors them, there may be a delay or miss window where the guest's booking shows active in Firebase despite being cancelled.

#### WEAK-B4 — NEW RESERVATION notification → code 1 (BOOKING_CREATED) NOT written automatically
**Severity: MEDIUM**

- **What happens:** `processBookingReservationNotification()` (gmail.ts) handles new Octorate reservation emails. It parses the email, creates a Gmail app-link draft for the guest, and marks the message with labels. **No Firebase write occurs** — code 1 (BOOKING_CREATED) is not written.
- **Expected path:** Staff must manually trigger code 1 from the reception UI, or it is written when the booking first appears in the system through another path (not audited here).
- **Risk:** The email automation dashboard's eligibility check requires code 1 to be present for a booking to appear. If code 1 is missing, the booking won't show in the email sequence dashboard even if an app-link email was sent.

#### WEAK-B5 — Booking email sent (useBookingEmail) without activity code
**Severity: LOW**

- **What happens:** `sendBookingEmail()` sends the app-link email and sets UI state, but does NOT log an activity code. The `EmailBookingButton.tsx` component handles this by calling `logActivity(occId, 26)` separately after the email is sent. However, if the button call succeeds but the activity log fails (or the button is not used and the email is sent via another path), the two can diverge.

---

### DIRECTION C: Data consistency issues

#### WEAK-C1 (BUG) — `processCancellationEmail` missing `/activitiesByCode/` fanout write
**Severity: HIGH**

- **What happens:** `process-cancellation-email.ts:144-159` writes ONLY to `/activities/{occupantId}/{activityId}`. The canonical pattern (used by `useActivitiesMutations.ts:136-140`) writes to BOTH:
  - `/activities/{occupantId}/{activityId}`
  - `/activitiesByCode/{code}/{occupantId}/{activityId}`
- **The MCP server skips the second write entirely.**
- **Impact on email eligibility:** `useEmailProgressData` reads `activitiesByCodes` for codes 1–25 (code 22 is in this range). The `allActivitiesMap` merges rawActivities (from `/activities/`) and codeActivitiesMap (from `/activitiesByCode/`). The raw path DOES include code 22, so the guest SHOULD be correctly excluded from the email dashboard — but only if rawActivities is fetched. Components that rely solely on `activitiesByCode` queries for code 22 will miss it.
- **Broader risk:** Any future query that reads `/activitiesByCode/22/` to find cancelled bookings will find nothing, even for bookings that were system-cancelled.

#### WEAK-C2 — Firebase credentials missing from MCP server → silent cancellation failure
**Severity: HIGH**

- **What happens:** `handleCancellationCase()` reads `process.env.FIREBASE_DATABASE_URL` and `process.env.FIREBASE_API_KEY`. If `FIREBASE_DATABASE_URL` is empty string, `processCancellationEmail` will attempt REST calls against an invalid URL and throw. The exception is caught in `handleCancellationCase`'s try/catch (lines 1546-1551), which logs and returns `{processed: false}`.
- **Observable symptom:** Gmail label `Cancellation-Received` is applied, but none of `Cancellation-Processed`, `Cancellation-Parse-Failed`, or `Cancellation-Booking-Not-Found` are applied. The email appears processed in Gmail but Firebase has no record of the cancellation.
- **No alerting:** `console.error` only. No retry, no dead-letter queue.
- **Verification:** Check that `FIREBASE_DATABASE_URL` is set in `packages/mcp-server/.env` (or wherever the server reads env from). The `FIREBASE_API_KEY` is optional (used for REST auth).

#### WEAK-C3 — `useArchiveCheckedOutGuests` removes live activities without checking email state
**Severity: LOW / INFORMATIONAL**

- **What happens:** `useArchiveCheckedOutGuests.ts:263,265` moves activities from `/activities/{occupantId}` to `/archive/activities/{occupantId}` and nulls the live path. This is correct archival behaviour but means: if the archive runs before a deferred email draft is reviewed/sent, the guest's Firebase data is gone from the live path, and any subsequent lookup for `guestsByBooking/{occupantId}` may return missing data.
- **Not a current bug** but a sequencing dependency: archive should only run after all email drafts for that occupant are resolved.

---

## Open Questions

### Open (User Input Needed)
- Q: Is the intent for code 22 (SYSTEM_GENERATED_CANCELLATION) to ALSO trigger an outbound guest email automatically when the Octorate cancellation email arrives — bypassing the need for staff to separately log code 27?
  - Why it matters: Determines whether WEAK-A2 requires a new automated trigger or whether the dual-code design is deliberate
  - Decision owner: Product / hotel ops owner
  - Default assumption: It IS a gap — guests should be informed automatically when Octorate cancels

- Q: Should `gmail_mark_processed agreement_received` automatically write code 21 to Firebase via the MCP server's own Firebase REST call?
  - Why it matters: WEAK-B1 — this is the highest-severity gap
  - Decision owner: Engineering
  - Default assumption: Yes — the agent workflow should be self-completing, not dependent on staff manually logging the confirmation

- Q: What is `codeToLog` in `PrepaymentsContainer.tsx:287`?
  - Why it matters: Determines if prepayment failure codes (5/6/7) are correctly written from the UI independently of the email flow
  - Verification path: Read `apps/reception/src/components/prepayments/PrepaymentsContainer.tsx` lines 270–295

- Q: Is there a dev/staging equivalent of the MCP server that runs with a test Firebase URL, or does the MCP server only work with production Firebase?
  - Why it matters: Test coverage strategy for WEAK-C1 and WEAK-C2

### Resolved
- Q: Does `handleMarkProcessed` write to Firebase?
  - A: No. Confirmed by full code read — only Gmail label mutations.
  - Evidence: `packages/mcp-server/src/tools/gmail.ts:handleMarkProcessed` — no `fetch()` calls to Firebase URLs

- Q: Does `processBookingReservationNotification` write to Firebase?
  - A: No. Gmail draft + label only.
  - Evidence: `packages/mcp-server/src/tools/gmail.ts:processBookingReservationNotification` — no Firebase calls

- Q: Are there direct Firebase activity writes in the reception app that bypass `useActivitiesMutations`?
  - A: Yes, two: `useArchiveCheckedOutGuests.ts` (archive path, not active activities) and `useAddGuestToBookingMutation.ts` (cloning activities for a new guest). Neither triggers email, which is correct for both cases.
  - Evidence: Full search of all `update(ref(` calls in `apps/reception/src/`

---

## Confidence Inputs

- Implementation: 88%
  - Evidence: Full source reads of all critical files. One unknown: `codeToLog` in PrepaymentsContainer (not read). All primary paths confirmed.
  - Raises to ≥90%: Read PrepaymentsContainer.tsx:270-295 and verify codeToLog values
- Approach: 85%
  - Evidence: Root causes identified for all 9 weakpoints. Fixes are clear for 7/9. Two require policy decisions (WEAK-A2, WEAK-B1).
  - Raises to ≥90%: Resolve the two open policy questions
- Impact: 90%
  - WEAK-B1 (guest agreement not recorded) and WEAK-A2 (no guest cancellation email from Octorate) are high-impact operational gaps. Evidence is direct from code.
- Delivery-Readiness: 75%
  - Missing: Firebase credential verification for MCP server, test environment details
  - Raises to ≥80%: Confirm FIREBASE_DATABASE_URL is consistently set in MCP server env
- Testability: 80%
  - Firebase REST calls in `processCancellationEmail` are injectable (URL + key params). Gmail client is mockable. React hooks testable via existing test patterns.

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| WEAK-B1: Guest agrees to T&Cs by email, staff don't notice, booking auto-cancelled | High | Critical — guest harm | Fix: make `agreement_received` MCP action write code 21 to Firebase |
| WEAK-A2: Octorate cancels booking, guest not notified | Medium | High — guest complaint | Fix: make code 22 trigger cancellation email OR auto-log code 27 |
| WEAK-C1: Missing `/activitiesByCode/22/` fanout breaks future queries | Medium | Medium — data integrity | Fix: add fanout write to `processCancellationEmail` |
| WEAK-C2: FIREBASE_DATABASE_URL missing → cancellation silently fails | Low-Medium | High — data not written | Fix: add env validation on MCP server startup + alerting |
| WEAK-A1 (codes 2,3,4): Staff log reminder, no email, guest not chased | High | High — revenue impact (bookings not confirmed) | Fix: add email templates for codes 2, 3, 4 |
| WEAK-A3: Email draft fails silently after activity write | Medium | Medium — operational | Fix: surface email failure state in UI |
| WEAK-B2: Prepayment chase codes not written by MCP | Medium | Medium — prepayment tracking gap | Fix: MCP `prepayment_chase_*` action should also write to Firebase |
| Archive runs before email drafts reviewed | Low | Low | Operational — sequence dependency, low urgency |
| OTA cancellations missed (WEAK-B3) | Medium | Medium | Depends on OTA volume; medium urgency |

---

## Planning Constraints & Notes
- Must-follow patterns:
  - All activity writes must use the two-path fanout: `/activities/` AND `/activitiesByCode/`
  - MCP server Firebase writes use REST (not SDK) — match existing pattern in `processCancellationEmail.ts`
  - `relevantCodes` array in `useActivitiesMutations.ts` is the single gating list for email triggers
  - Gmail drafts are not auto-sent — all outbound email requires human review
- Rollout/rollback expectations:
  - Changes to `relevantCodes` are low-risk (additive only for new codes with templates)
  - Changes to `processCancellationEmail` require Firebase test environment
  - New Firebase writes from MCP tools (WEAK-B1, WEAK-B2 fixes) require env var validation
- Observability expectations:
  - Email failure states should surface to the reception UI (not just `console.error`)
  - MCP tool results should include explicit `activitiesWritten` counts for all Firebase writes

## Suggested Task Seeds (Non-binding, priority ordered)

1. **TASK-01** — Fix WEAK-B1: Make `gmail_mark_processed agreement_received` action write code 21 to Firebase via MCP REST call. Requires `bookingRef` + occupant lookup from Firebase (booking code must be derivable from the email thread/label metadata or passed as an arg).
2. **TASK-02** — Fix WEAK-C1: Add `/activitiesByCode/22/{occupantId}/{activityId}` write to `processCancellationEmail.ts`
3. **TASK-03** — Fix WEAK-A2: When code 22 is written, automatically trigger cancellation confirmation email (draft) to guest — either by wiring code 22 to `relevantCodes` + adding template, or by having `processCancellationEmail` call the guest-email-activity tool directly
4. **TASK-04** — Fix WEAK-C2: Add startup validation of `FIREBASE_DATABASE_URL` in MCP server; surface failure with clear error label on Gmail email rather than silent `{processed: false}`
5. **TASK-05** — Fix WEAK-A3: Surface email send failure status to reception UI (error toast or badge) when `maybeSendEmailGuest` returns `status: "error"` or `status: "deferred"` with `reason: "no-recipient-email"`
6. **TASK-06** — Fix WEAK-B2: Make `prepayment_chase_1/2/3` MCP actions write corresponding activity codes (5/6/7) to Firebase (requires bookingRef to be passed in or inferred)
7. **TASK-07** — Fix WEAK-A1: Create MCP email templates for codes 2 (FIRST_REMINDER), 3 (SECOND_REMINDER), 4 (AUTO_CANCEL_NO_TNC), add them to `relevantCodes`
8. **TASK-08** — Address WEAK-B4: Determine intent for code 1 (BOOKING_CREATED) — should it be written by `processBookingReservationNotification`? If yes, add the Firebase write.

---

## Evidence Gap Review

### Gaps Addressed
- All 9 weakpoints traced to specific file + line evidence
- Full `handleMarkProcessed` implementation read and confirmed: no Firebase writes
- Full `processCancellationEmail` read and confirmed: missing `/activitiesByCode/` fanout
- All callers of `addActivity`/`saveActivity`/`logActivity` in the reception app enumerated
- All `update(ref(` calls in the reception app enumerated — no undiscovered direct activity writers

### Confidence Adjustments
- Implementation confidence held at 88% (not 90%+) due to unread `PrepaymentsContainer.tsx:287` `codeToLog` value
- Delivery-Readiness held at 75% due to unknown MCP server env configuration in deployed contexts

### Remaining Assumptions
- Octorate is the only source of automated inbound cancellation emails (no other PMS)
- The `EMAIL_CODES` set in `emailCodes.ts` is used only for the email automation dashboard eligibility filter, not as the gate for email sending (confirmed — `relevantCodes` in `useActivitiesMutations.ts` is the email gate)
- Code 1 (BOOKING_CREATED) has a separate, unaudited write path (not via `logNextActivity`)

---

## Planning Readiness
- Status: Ready-for-planning
- Blocking items: None — policy questions (WEAK-A2, WEAK-B1 intent) can be captured as plan assumptions with a default
- Recommended next step: `/lp-do-plan docs/plans/reception-email-activity-control-audit/fact-find.md`

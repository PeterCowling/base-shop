---
Type: Fact-Find
Outcome: Planning
Status: Archived
Domain: Platform
Workstream: Engineering
Created: 2026-02-14
Last-updated: 2026-02-14
Feature-Slug: reception-email-integration-gaps
Deliverable-Type: code-change
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-plan
Related-Plan: docs/plans/reception-email-integration-gaps/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: (to be assigned)
---

# Reception Email Integration Gaps Fact-Find Brief

## Scope

### Summary

Review the interaction between the email MCP system and reception software to identify where actions in reception should trigger email drafts but currently do not. Analyze how cancellation emails are processed from Octorate/Hostelworld and propose a technical implementation for automated cancellation handling in the reception database.

### Goals

1. **Map current email triggers**: Document which reception actions currently generate email drafts
2. **Identify missing triggers**: Find reception workflows that should trigger emails but don't
3. **Analyze cancellation email format**: Document how cancellation emails appear in Gmail from booking providers
4. **Design cancellation automation**: Propose technical implementation for processing cancellation emails and updating reception database
5. **Review booking deletion vs archiving**: Understand current cancellation handling in reception software

### Non-goals

- Implementing the changes (planning only)
- Changing email template content (new templates only)
- Modifying Gmail label taxonomy structure (new workflow labels are in scope)
- Altering booking provider integrations

### Constraints & Assumptions

**Constraints:**
- Must use existing MCP tools and reception Firebase structure
- Cannot modify external booking provider APIs (Octorate, Hostelworld)
- Email drafts only - no automatic sending
- Must preserve booking history (archive, not delete)

**Assumptions:**
- Cancellation emails follow consistent format patterns from providers
- Reception staff will continue to manually send email drafts after review
- Firebase database structure remains stable

---

## Evidence Audit (Current State)

### Entry Points

**Reception Software:**
- `apps/reception/src/components/checkins/EmailBookingButton.tsx` — Manual email draft trigger for booking confirmation
- `apps/reception/src/services/useBookingEmail.ts` — Hook for booking app-link emails
- `apps/reception/src/services/useEmailGuest.ts` — Hook for activity-based guest emails
- `apps/reception/src/components/checkins/StatusButton.tsx` — Status change UI (doesn't trigger emails)

**MCP Email System:**
- `packages/mcp-server/src/tools/booking-email.ts` — Creates booking app-link email drafts
- `packages/mcp-server/src/tools/guest-email-activity.ts` — Creates activity-based email drafts
- `packages/mcp-server/src/tools/gmail.ts` — Gmail operations (organize, list, label)
- `packages/mcp-server/src/clients/gmail.ts` — OAuth2 Gmail client

### Key Modules / Files

**Email Integration (Reception → MCP):**

1. **Booking confirmation emails:**
   - `apps/reception/src/components/checkins/EmailBookingButton.tsx:58-77`
   - Calls `/api/mcp/booking-email` with booking ref and guest emails
   - Creates draft with app-link for each occupant
   - Logs activity code 26 (APP_EMAIL_DRAFT_CREATED)

2. **Activity-based emails:**
   - `apps/reception/src/services/useEmailGuest.ts:64-150`
   - Calls `/api/mcp/guest-email-activity` with booking ref and activity code
   - Supports prepayment workflow (codes 5, 6, 7, 8)
   - Supports agreement received (code 21)

3. **MCP Tools:**
   - `packages/mcp-server/src/tools/booking-email.ts:51-108` — Generates booking confirmation emails with app links
   - `packages/mcp-server/src/tools/guest-email-activity.ts:129-228` — Maps activity codes to email templates
   - `packages/mcp-server/src/tools/gmail.ts` — Gmail API operations including email listing and labeling

**Activity Codes (Reception):**
- `apps/reception/src/constants/activities.ts` defines 26 activity codes
- Code 25: CANCELLED (manual cancellation)
- Code 22: SYSTEM_GENERATED_CANCELLATION
- Code 26: Enum says `RESEND_APP_EMAIL` but UI labels it "App email draft created"
  - **Naming inconsistency:** EmailBookingButton logs 26 after *creating* draft, not resending
  - StatusButton.tsx:44 displays as "App email draft created"
  - Should document or clean up naming mismatch

**Booking Management:**
- `apps/reception/src/hooks/mutations/useDeleteBooking.ts` — Currently **deletes** booking and all occupants
- `apps/reception/src/hooks/mutations/useBulkBookingActions.ts` — Bulk cancellation calls deleteBooking
- `apps/reception/src/components/search/Search.tsx:41` — UI displays activity code 22 as "System generated cancellation"

### Patterns & Conventions Observed

**Current Email Trigger Pattern:**
```typescript
// Pattern: Manual button click → API call → MCP tool → Gmail draft
EmailBookingButton (UI)
  → useBookingEmail.sendBookingEmail()
  → POST /api/mcp/booking-email
  → MCP bookingEmailTools.sendBookingEmail()
  → gmail.users.drafts.create()
  → logActivity(26) // Track draft creation
```

**Activity Code to Email Mapping (Current Wiring Reality):**

**Already wired in Reception:**
- `useActivitiesMutations` hooks into activity logging
- Automatically calls `sendEmailGuest` for codes: [2, 3, 4, 21, 5, 6, 7, 8]
- Evidence: `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`

**MCP Tool Support (Mismatch):**
- Code 5: ✅ "Prepayment - 1st Attempt Failed" (Octorate or Hostelworld variant)
- Code 6: ✅ "Prepayment - 2nd Attempt Failed"
- Code 7: ✅ "Prepayment - Cancelled post 3rd Attempt"
- Code 8: ✅ "Prepayment Successful"
- Code 21: ✅ "Agreement Received"
- Code 2: ❌ Explicitly deferred as `unsupported-activity-code` in guest-email-activity.ts
- Code 3: ❌ Explicitly deferred as `unsupported-activity-code` in guest-email-activity.ts
- Code 4: ❌ Explicitly deferred as `unsupported-activity-code` in guest-email-activity.ts
- Code 25 (CANCELLED): ❌ No template or handler
- Code 22 (SYSTEM_GENERATED_CANCELLATION): ❌ No template or handler

**Current Gap/Bug:**
- Reception triggers email for codes 2, 3, 4 but MCP defers them → silent failures
- Evidence: `packages/mcp-server/src/tools/guest-email-activity.ts:112-115`
- **Codes in question:**
  - Code 2: FIRST_REMINDER (T&C reminder)
  - Code 3: SECOND_REMINDER (T&C reminder)
  - Code 4: AUTO_CANCEL_NO_TNC (auto-cancel for no T&C acceptance)
- **Recommended fix:** Remove codes 2,3,4 from `relevantCodes` in useActivitiesMutations.ts
  - Rationale: MCP explicitly defers these (intentional), no templates exist, and no business requirement identified
  - If T&C reminder emails are needed in future, they should be a separate planned feature (not a bug fix)

### Data & Contracts

**Firebase RTDB Structure (As-Built):**
```
/bookings/{reservationCode}/{occupantId}
  - firstName, lastName, email, etc.
  - NOTE: No "activities" array here (common misconception)

/guestsDetails/{reservationCode}/{occupantId}
  - email, name

/guestsByBooking/{occupantId}/
  - reservationCode (reverse lookup)

/activities/{occupantId}/{activityId}
  - code, timestamp
  - (Top-level fanout, NOT nested under booking)

/activitiesByCode/{code}/{occupantId}/{activityId}
  - code, timestamp
  - (Denormalized index for code-based queries)

/archive/...
  - Existing archive system for checked-out guests
  - Pattern: useArchiveCheckedOutGuests.ts
```

**Critical schema constraint:**
- `/bookings/{reservationCode}/*` keys are ALL occupantIds
- Adding booking-level metadata (e.g., `status`) at this level breaks enumeration logic
- `Object.keys(bookingJson)` in useBookingEmail.ts and useDeleteBooking.ts assumes all keys are occupants
- **Solution:** Use separate path `/bookingMeta/{reservationCode}/status` OR reserved `_meta` subkey + repo-wide "ignore meta" changes

**MCP Tool Contracts:**
```typescript
// Booking email
POST /api/mcp/booking-email
{
  bookingRef: string,
  recipients: string[], // guest emails
  occupantLinks: string[] // app links per guest
}

// Guest email activity
POST /api/mcp/guest-email-activity
{
  bookingRef: string,
  activityCode: number,
  recipients: string[],
  prepaymentProvider?: "octorate" | "hostelworld",
  dryRun?: boolean
}
```

**Gmail Label Structure:**
```
Brikette/
  Queue/
    Needs-Processing  <- Incoming customer emails
    In-Progress       <- Currently being handled
    Needs-Decision    <- Awaiting agreement/workflow decision
    Deferred          <- Manual follow-up needed
  Outcome/
    Drafted           <- Draft created
    Acknowledged      <- Simple acknowledgment sent
    Promotional       <- Marketing classification
    Spam              <- Spam classification
  Workflow/
    Prepayment-Chase-1
    Prepayment-Chase-2
    Prepayment-Chase-3
    Agreement-Received
```

### Dependency & Impact Map

**Upstream dependencies:**
- Gmail API (OAuth2 authentication required)
- Firebase Realtime Database (bookings, guestsDetails)
- MCP server running on local machine
- Email templates in `packages/mcp-server/data/email-templates.json`

**Downstream dependents:**
- Reception staff workflow (manual draft review and sending)
- Guest communication (pre-arrival, payment, cancellation)
- Activity logging for audit trail
- Email automation skill (`/ops-inbox`)

**Blast radius:**
- Low: Changes are additive (new email triggers)
- Medium: Cancellation processing affects booking lifecycle
- No breaking changes to existing email workflows

### Delivery & Channel Landscape

**Audience/recipient:**
- Hostel guests (booking confirmations, payment reminders, cancellations)
- Internal: Reception staff (for draft review)

**Channel constraints:**
- Gmail API rate limits (quota monitoring needed)
- OAuth2 token refresh (handled by `packages/mcp-server/src/clients/gmail.ts`)
- Email drafts only (no automatic sending)

**Existing templates/assets:**
- 20+ email templates in `packages/mcp-server/data/email-templates.json`
- Templates include: prepayment chase sequences, agreement received, payment success
- **Missing:** Activity code 25 mapping in guest-email-activity.ts (template content approved, needs wiring)

**Approvals/owners:**
- Pete (business owner) reviews all drafts before sending
- No automatic sending without human approval

**Compliance constraints:**
- GDPR: Guest data handling via Firebase
- OAuth2: Secure Gmail access
- No spam: All emails are transactional (booking-related)

**Measurement hooks:**
- Activity code 26 logged when draft created
- Gmail labels track email processing state
- No open/click tracking (transactional emails only)

### Hypothesis & Validation Landscape

#### Key Hypotheses

| # | Hypothesis | Depends on | Falsification cost | Falsification time |
|---|-----------|-----------|-------------------|-------------------|
| H1 | Cancellation emails from Octorate/Hostelworld follow consistent format patterns | Gmail access, sample emails | €0 (inspection only) | <1 hour |
| H2 | Reception staff want automated email drafts for all major booking events | Staff feedback | €0 (interview) | <1 hour |
| H3 | Cancellation email parsing can extract booking ref reliably | H1 pass, test implementation | €0 (dev time only) | 2-4 hours |
| H4 | Activity code 25 should trigger cancellation confirmation email | Staff workflow review | €0 (observation) | <1 hour |

#### Existing Signal Coverage

| Hypothesis | Evidence available | Source | Confidence in signal |
|-----------|-------------------|--------|---------------------|
| H1 | Need to inspect Gmail for patterns | Live production emails | None — untested |
| H2 | Current manual email workflow exists | Reception UI code | High — staff use email button |
| H3 | Booking refs have known formats (7763-X for HW, numeric for Octorate) | Code comments, validation | High — documented patterns |
| H4 | Code 25 exists but has no email trigger | Activity constants | High — confirmed in code |

#### Falsifiability Assessment

**Easy to test (clear signal, low cost):**
- H1: Inspect Gmail for cancellation email samples (read-only)
- H2: Ask Pete about desired email triggers
- H4: Review activity code usage in reception UI

**Hard to test (noisy signal, high cost, long feedback loop):**
- None — all hypotheses are validation-ready

**Validation seams needed:**
- MCP tool to parse cancellation emails (text pattern matching)
- Reception activity listener for code 25 → email trigger
- Archive status field in booking record (instead of deletion)

#### Recommended Validation Approach

**Quick probes for:** H1 (Gmail inspection), H2 (staff interview), H4 (code review) — all <1 hour each

**Structured tests for:** H3 (prototype cancellation parser with sample emails, dry-run mode)

**Deferred validation for:** None — all hypotheses can be validated before implementation

### Test Landscape

#### Test Infrastructure

**Frameworks:** Jest (unit tests), no E2E for email integration currently

**Commands:**
- `pnpm --filter reception test` (reception UI tests)
- `pnpm --filter mcp-server test` (MCP tool tests)

**CI integration:** GitHub Actions runs tests on PR

**Coverage tools:** None currently enforced

#### Existing Test Coverage

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| `useBookingEmail.ts` | unit | `apps/reception/src/services/__tests__/useBookingEmail.test.ts` | Mocks API calls |
| `booking-email.ts` | unit | `packages/mcp-server/src/__tests__/booking-email.test.ts` | Mocks Gmail client |
| `guest-email-activity.ts` | integration | `packages/mcp-server/src/__tests__/pipeline-integration.test.ts` | Tests activity code mapping |
| Gmail tools | unit | `packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts` | Tests email classification patterns |

#### Test Patterns & Conventions

**Unit tests:**
- Mock Firebase with jest.fn()
- Mock Gmail API with test client
- Test template selection logic in isolation

**Integration tests:**
- Test MCP tool chains (interpret → generate → draft)
- Test activity code → email template mapping
- Use `dryRun: true` for safe testing

**Test data:**
- Sample booking refs: "7763-569729918" (Hostelworld), "12345" (Octorate)
- Sample emails in `packages/mcp-server/src/__tests__/email-examples.test.ts`

#### Coverage Gaps (Planning Inputs)

**Untested paths:**
- No tests for cancellation email processing
- No tests for activity code 25 → email trigger
- No tests for booking archival (vs deletion)
- No E2E test for reception → MCP → Gmail flow

**Extinct tests:**
- None identified (existing tests are current)

#### Testability Assessment

**Easy to test:**
- MCP tool functions (pure functions, mockable APIs)
- Template selection logic
- Email format parsing

**Hard to test:**
- Gmail API integration (requires OAuth token)
- Firebase integration (requires test database)
- Full E2E flow (multiple systems)

**Test seams needed:**
- Mock cancellation email samples for parser testing
- Test mode for reception activity logging
- Dry-run mode for email draft creation (already exists)

#### Recommended Test Approach

**Unit tests for:**
- Cancellation email parser (extract booking ref, provider, reason)
- Activity code 25 email template selection
- Booking archive mutation (new status field)

**Integration tests for:**
- Reception → MCP cancellation flow
- Gmail cancellation email detection and processing

**E2E tests for:**
- Not recommended (manual testing with dry-run mode)

**Contract tests for:**
- MCP tool API contracts (already covered by integration tests)

---

## Current Email Triggers (What Works Today)

### 1. Booking Confirmation (Manual)

**Trigger:** Staff clicks email button in reception checkins table

**Flow:**
```
User clicks EmailBookingButton
  → useBookingEmail.sendBookingEmail(bookingRef, emailMap)
  → POST /api/mcp/booking-email
  → MCP: sendBookingEmail()
  → Gmail: create draft with app links
  → Log activity code 26 for each occupant
```

**When it happens:** After booking is created in reception system

**Email content:** "Your booking details" with personalized app links for each guest

**Evidence:** `apps/reception/src/components/checkins/EmailBookingButton.tsx:58-77`

### 2. Prepayment Chase Sequence (Automated)

**Trigger:** Automatically triggered when activity codes are logged

**Flow:**
```
Staff logs activity code (5, 6, or 7)
  → useActivitiesMutations auto-triggers useEmailGuest.sendEmailGuest()
  → POST /api/mcp/guest-email-activity
  → MCP: sendGuestEmailActivity()
  → Gmail: create draft with prepayment template
```

**When it happens:**
- Code 5: First payment attempt failed
- Code 6: Second payment attempt failed
- Code 7: Third attempt failed, booking cancelled

**Email templates:**
- "Prepayment - 1st Attempt Failed (Hostelworld)" or "(Octorate)"
- "Prepayment - 2nd Attempt Failed"
- "Prepayment - Cancelled post 3rd Attempt"

**Evidence:**
- Wiring: `apps/reception/src/hooks/mutations/useActivitiesMutations.ts` (auto-triggers for codes 5,6,7,8,21)
- Templates: `packages/mcp-server/src/tools/guest-email-activity.ts:96-118`

### 3. Agreement Received (Activity Code 21)

**Trigger:** Staff logs code 21 when guest agrees to terms

**Flow:** Same as prepayment chase

**Email template:** "Agreement Received"

---

## Missing Email Triggers (Gaps Identified)

### Gap 1: Cancellation Confirmation Email - APPROVED

**Current state:** No email draft triggered when staff cancels a booking

**Expected behavior:** When staff manually cancels booking, should trigger "Booking Cancellation Confirmation" email draft

**Impact:** Guests don't receive confirmation when their booking is cancelled manually

**Approved email template content:**
```
Subject: Booking Cancellation Confirmation
Category: cancellation

Dear Guest,

We have processed your cancellation in full. We are sorry you are unable to stay this time, and hope to see you in the future.
```

**Activity code decision: APPROVED**
- **Use new code 27 (CANCELLED)** for cancellation confirmation emails
- Code 25 (OCCUPANT_DELETED) remains for deletion tracking
- See "Open Questions" section for full decision rationale

**Additional implementation complexity (even after code decision):**

Adding case mapping in MCP `guest-email-activity.ts` is **not sufficient** to trigger emails because:

1. **Code not in auto-trigger list:**
   - `useActivitiesMutations.relevantCodes = [2,3,4,21,5,6,7,8]` (no 25 or potential new code)
   - Adding cancellation code to this array is necessary but not sufficient

2. **Deletion flow breaks email lookup:**
   - `useDeleteGuestFromBooking.ts:112` deletes `guestsByBooking/{occupantId}` first
   - `useDeleteGuestFromBooking.ts:193` logs activity code 25 second
   - `useActivitiesMutations.maybeSendEmailGuest` reads `guestsByBooking/{occupantId}/reservationCode` (line 45)
   - Lookup fails because data is already deleted → no email sent even if code is in `relevantCodes`

**Implementation decisions: APPROVED**

**Activity code:** Use new code 27 (CANCELLED) for cancellation emails

**Mutation approach:** Dedicated `useCancelBooking` hook (distinct from `useDeleteBooking`)
- Workflow:
  1. Write `/bookingMeta/{ref}/status = "cancelled"`
  2. Log activity code 27 (CANCELLED) for each occupant
  3. Keep `guestsByBooking/{occupantId}` intact (required for email lookup)
  4. Auto-trigger email via useActivitiesMutations (code 27 in `relevantCodes`)
- Benefits:
  - Email lookup succeeds because data not deleted
  - Clear separation of cancellation vs deletion operations
  - Automatic email draft generation via existing activity mutation flow
- Evidence: Pete approval

**Why deletion flow won't work for cancellation:**
- `useDeleteGuestFromBooking.ts:112` deletes `guestsByBooking/{occupantId}` first
- `useActivitiesMutations.maybeSendEmailGuest` (line 45-50) needs this data for bookingRef lookup
- Deletion + activity logging = email lookup fails (data already gone)
- Solution: Dedicated cancellation mutation that preserves lookup data

**Evidence:**
- Deletion flow: `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts:112,193`
- Email lookup: `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:45-50`
- Auto-trigger list: `apps/reception/src/hooks/mutations/useActivitiesMutations.ts:34`
- Template content approved: Pete confirmation

### Gap 2: Automated Cancellation Processing (Inbound)

**Current state:** Cancellation emails from Octorate/Hostelworld arrive in Gmail but are **actively routed away** from processing

**Current classification logic:**
- Subject pattern: `/new cancellation/i` in `NON_CUSTOMER_SUBJECT_PATTERNS` (gmail.ts:166)
- From addresses: `noreply@smtp.octorate.com` and `noreply@hostelworld.com` in `NON_CUSTOMER_FROM_PATTERNS` (gmail.ts:124, 141)
- **Strong non-customer signals route to `promotional` label (not processing queue)**
- Result: Cancellation emails are **explicitly excluded** from customer inbox workflow

**Expected behavior:**
1. MCP tool detects cancellation email pattern **before** non-customer classification
2. Apply explicit "provider cancellation workflow" exception path **for Octorate only**
3. **Filter:** Only process cancellations from `noreply@smtp.octorate.com` (ignore OTA duplicates)
4. Extract booking reference from email body (first number from compound ID)
5. Write activity code 22 to Firebase via RTDB REST API
6. Archive booking metadata (separate path from occupants)
7. Optionally draft acknowledgment email to guest

**Impact:** Staff must manually update reception system when provider cancels booking

**Implementation need:**
1. **Reclassification exception:** Detect provider cancellation pattern before non-customer classification
2. **Parser:** Extract booking ref from email body (handle Octorate compound IDs)
3. **MCP tool:** Write to Firebase RTDB via REST (`firebaseGet/firebasePatch` pattern from `outbound-drafts.ts`)
4. **Activity fanout:** Write to both `/activities/{occupantId}/{activityId}` and `/activitiesByCode/22/{occupantId}/{activityId}`
5. **Booking metadata:** Write status to `/bookingMeta/{reservationCode}/status` (separate from occupants)

**Evidence:**
- Classification logic: `packages/mcp-server/src/tools/gmail.ts:124,141,166`
- Firebase REST pattern: `packages/mcp-server/src/tools/outbound-drafts.ts` (uses `firebaseGet/firebasePatch`)
- **No existing "POST /api/reception/bookings/{ref}/activities" endpoint** — Reception writes directly to RTDB from client

### Out of Scope (No Current Business Requirement)

The following gaps were identified but marked as out of scope due to lack of business need:

**Check-In/Check-Out Notification Emails (codes 12, 14)**
- Low impact — guests don't typically need these confirmations
- No staff request for this feature

**Room Extension/Change Notifications (codes 17, 18, 20, 24)**
- Medium impact — could be useful for booking modifications
- No templates exist, no current workflow
- If needed in future, treat as separate feature request

---

## Cancellation Email Analysis

### How Cancellation Emails Look in Gmail

**Booking Provider Emails:**

**From:** `noreply@smtp.octorate.com` or `noreply@hostelworld.com`

**Subject patterns:**
- "New cancellation" (Octorate)
- "Hostelworld Booking Cancelled" (Hostelworld)
- May include booking reference in subject

**Body content (typical):**
```
Booking Reference: 7763-569729918 (or numeric for Octorate)
Guest Name: [Name]
Check-in Date: [Date]
Check-out Date: [Date]
Cancellation Date: [Date]
Cancellation Reason: [Guest initiated / Payment failure / etc.]
```

**Gmail classification:**
- Currently matched by: `/new cancellation/i` in `NON_CUSTOMER_SUBJECT_PATTERNS`
- Classified as non-customer (not added to processing queue)
- Needs reclassification as actionable workflow trigger

**Evidence:**
- Pattern exists: `packages/mcp-server/src/tools/gmail.ts:166`
- Sample emails needed from production Gmail

### Proposed Cancellation Email Processing Flow

**Trigger mechanism:** Cancellation processing piggybacks on existing Gmail organize workflow, invoked via `/ops-inbox` skill (manual invocation by staff). No new cron job or push notification required.

```
Cancellation email arrives
  ↓
(Staff runs /ops-inbox, which triggers gmail-organize-inbox)
  ↓
1. Gmail organize tool detects pattern
   (/new cancellation/i from noreply@smtp.octorate.com ONLY)
  ↓
2. Apply label: Brikette/Workflow/Cancellation-Received
  ↓
3. MCP tool: process_cancellation_email
   - Parse email body
   - Extract booking reference (first number from compound ID)
   - Extract cancellation reason
  ↓
4. Validate booking exists in Firebase:
   - Read /bookings/{reservationCode}
   - If PARSE FAILED (no booking ref extracted):
     * Log warning with email ID and body snippet
     * Apply label: Brikette/Workflow/Cancellation-Parse-Failed
     * Keep Cancellation-Received label (manual review)
     * Stop processing
   - If BOOKING NOT FOUND (ref extracted but not in Firebase):
     * Log warning with email ID and extracted ref
     * Apply label: Brikette/Workflow/Cancellation-Booking-Not-Found
     * Keep Cancellation-Received label (manual review)
     * Stop processing (do not write status or activities)
   - If FOUND: continue to step 5
  ↓
5. MCP writes directly to Firebase RTDB via REST:
   - Enumerate all occupants from /bookings/{reservationCode}
   - Write activity code 22 for EACH occupant to fanout paths:
     * /activities/{occupantId}/{activityId}
     * /activitiesByCode/22/{occupantId}/{activityId}
     * (Parallel to manual cancellation: logged per occupant via useActivitiesMutations)
   - Write booking metadata:
     * /bookingMeta/{reservationCode}/status = "cancelled"
     * /bookingMeta/{reservationCode}/cancelledAt = timestamp
     * /bookingMeta/{reservationCode}/cancellationSource = "provider"

**Multi-occupant behavior:**
- Activity code is written per occupant (not per booking)
- Manual cancellation follows same pattern: staff log cancellation code for each occupant
- Evidence: `useActivitiesMutations.addActivity(occupantId, code)` takes single occupantId (line 92)

**Activity data shape (must match existing pattern):**
```typescript
// Each activity record must include:
{
  code: 22,
  timestamp: "2026-02-14T10:30:00.000+01:00", // ISO string in Italy timezone
  who: "Octorate"  // Or "System" - string identifier of who created the activity
}
```
- Evidence: `useActivitiesMutations.ts:113-117` (newActivity shape)
- Note: `/activitiesByCode/{code}/{occupantId}/{activityId}` stores only `{who, timestamp}` (no code field, line 122-124)

**ActivityId generation (collision-safe for batch writes):**
- Existing pattern: `act_${Date.now()}` (line 20)
- For multiple occupants, add suffix: `act_${Date.now()}_${index}` or `act_${Date.now()}_${occupantId.slice(0,6)}`
- Avoid collisions when writing multiple activities in rapid succession
  ↓
6. (Optional) Draft acknowledgment email to guest
   "We've processed your cancellation"
```

**Failure modes specification:**

| Failure | Label applied | Processing behavior | Manual intervention |
|---------|--------------|---------------------|-------------------|
| Parse failure (regex no match) | Cancellation-Parse-Failed | Stop; log email ID + body snippet | Staff inspect email, manually process |
| Compound ID present but wrong format | Cancellation-Parse-Failed | Stop; log for pattern analysis | Update regex if new format identified |
| Booking ref not found in Firebase | Cancellation-Booking-Not-Found | Stop; do not write status/activities | Staff manually cancel in reception UI |
| Firebase write failure | Cancellation-Received (unchanged) | Retry once, then stop | MCP retry or manual processing |

**Rationale for separate labels:**
- **Cancellation-Parse-Failed**: Email format issue (needs regex/template fix)
- **Cancellation-Booking-Not-Found**: Data mismatch issue (booking already deleted, wrong ref, or timing issue)
- Separate labels enable faster ops triage (parse issues → dev, not-found issues → ops data check)

### Booking Reference Extraction Patterns (RESOLVED)

**Octorate (Compound ID Format - FIRST NUMBER ONLY):**

Octorate emails contain compound IDs in format: `XXXXXXXXXX_YYYYYYYYYY`

**Reception's `reservationCode` = FIRST number (before underscore)**

**Evidence from NEW RESERVATION processing:**
```typescript
// packages/mcp-server/src/__tests__/gmail-organize-inbox.test.ts:459
Subject: "NEW RESERVATION 6355834117_6080280211 Booking 2026-07-11"

// Line 476-477: HTML body contains
<tr><td><b>reservation code</b></td><td>6355834117_6080280211</td></tr>

// Line 513: Extracted reservation code
Reservation Code: 6355834117  // First number only
```

**Extraction logic (Octorate cancellations only):**
```typescript
// Subject pattern
const subjectMatch = subject.match(/NEW (?:CANCELLATION)\s+(\d+)_\d+/i);
if (subjectMatch) {
  const reservationCode = subjectMatch[1]; // First number
}

// OR HTML body pattern (more reliable)
const htmlMatch = body.match(/<b>reservation code<\/b>.*?(\d+)_\d+/i);
if (htmlMatch) {
  const reservationCode = htmlMatch[1]; // First number
}
```

**Cancellation source filtering:**
- **ONLY process cancellations from:** `noreply@smtp.octorate.com`
- **IGNORE cancellations from OTAs** (Hostelworld, Booking.com, etc.)
- Reason: OTA cancellation notifications are always duplicates of Octorate notifications
- Evidence: User confirmation

**Note on Hostelworld pattern:**
- Hostelworld booking refs use format `7763-XXXXXX`
- **Not used in Phase 3** (Octorate-only policy)
- Reserved for future expansion if policy changes to include OTA cancellations

**Validation:**
- Check if booking exists in Firebase before processing
- Log warning if booking ref not found
- Manual review queue for unparseable emails

---

## Cancelled Booking Handling (Soft-Delete vs Hard-Delete)

**Terminology note:** This section uses "soft-delete" (status-based filtering) rather than "archive" to distinguish from the existing `useArchiveCheckedOutGuests` pattern, which physically moves data to `/archive/`. Soft-delete leaves data in place with a status flag.

### Current Implementation (Hard-Delete)

**Code:** `apps/reception/src/hooks/mutations/useDeleteBooking.ts`

**Behavior:**
```typescript
// Deletes booking and all occupants from Firebase
const deleteBooking = async (bookingRef: string) => {
  const occupants = await getOccupants(bookingRef);
  for (const occupantId of occupants) {
    await deleteGuest({ bookingRef, occupantId });
  }
};
```

**Problem:**
- Booking history is lost
- Cannot audit past cancellations
- Cannot analyze cancellation patterns
- Cannot recover from accidental cancellation

**Used by:**
- `useBulkBookingActions.ts:113-145` — Bulk cancellation
- Reception UI delete/cancel buttons

### Recommended Implementation (Soft-Delete via Status Flag) - APPROVED

**Database schema change:**
```typescript
/bookingMeta/{reservationCode}/
  status: "active" | "checked-in" | "checked-out" | "cancelled"
  cancelledAt?: timestamp
  cancellationReason?: string
  cancellationSource?: "staff" | "guest" | "system" | "provider"
```

**Why `/bookingMeta/` path:**
- `/bookings/{reservationCode}/*` keys are ALL occupantIds (enumeration constraint)
- Adding status field at booking level breaks `Object.keys(bookingJson)` in useBookingEmail.ts and useDeleteBooking.ts
- Separate metadata path preserves existing enumeration logic

**Read amplification tradeoff (design decision for planner):**

Option A: **Separate `/bookingMeta/` path** (proposed above)
- Pro: Clean separation, no code changes to enumeration logic
- Con: N+1 read pattern — checkins table must read `/bookingMeta/{ref}/status` for each booking
- Con: For 100 active bookings = 101 reads (1 for /bookings + 100 for metadata)
- Mitigation: Client-side caching, Firebase listener on `/bookingMeta/` path with local join

Option B: **Denormalized `_meta` key within `/bookings/{reservationCode}/_meta`**
- Pro: Single read for booking + metadata
- Con: Requires repo-wide "skip _meta key" changes in every place that enumerates occupants
- Con: Higher upfront implementation cost (audit all enumeration sites)
- Evidence: useBookingEmail.ts, useDeleteBooking.ts, and potentially others

Option C: **Denormalized status in each occupant record**
- Pro: No additional reads, status available during occupant enumeration
- Con: Must keep status synchronized across all occupants (multi-write on status change)
- Con: Risk of inconsistent state if writes partially fail

**Recommendation:** Start with Option A (separate path) for correctness, then optimize to Option B if read amplification becomes a measured performance issue. Option C adds complexity without clear benefit.

**New behavior:**
```typescript
const archiveBooking = async (bookingRef: string, reason?: string, source: string = "staff") => {
  // Write to /bookingMeta/{reservationCode}/ (separate from occupant enumeration)
  await updateBookingMeta(bookingRef, {
    status: "cancelled",
    cancelledAt: Date.now(),
    cancellationReason: reason,
    cancellationSource: source
  });
  // Activities remain intact in /activities/{occupantId}/{activityId}
  // Occupant data remains intact in /bookings/{reservationCode}/{occupantId}
};
```

**Benefits:**
- Booking history preserved
- Can filter out cancelled bookings in UI
- Can analyze cancellation patterns
- Can restore mistakenly cancelled bookings
- Activity log remains complete

**UI changes needed (approved):**
- **Filter cancelled bookings from checkins table by default**
  - Read status from `/bookingMeta/{reservationCode}/status`
  - Default filter: `status != "cancelled"`
- **Add "Show cancelled" toggle to reveal archived bookings**
- Show visual indicator (badge) for cancelled status when visible
- Update bulk actions to archive instead of delete (write to `/bookingMeta/`)

**Migration (approved approach):**
- No recovery of historically deleted bookings (acceptable loss)
- Existing bookings with no status field default to "active" on first read
- Optional: One-time status backfill based on activity codes:
  - Has code 14 (CHECKOUT_COMPLETE) → "checked-out"
  - Has code 12 (CHECKIN_COMPLETE) → "checked-in"
  - Has code 25 (CANCELLED) or 22 (SYSTEM_GENERATED_CANCELLATION) → "cancelled"
  - Otherwise → "active"
- Migration is low priority; system works without it (lazy migration on read acceptable)

---

## Questions

### Resolved

**Q: How are booking references formatted for different providers?**
- A: Hostelworld uses "7763-" prefix, Octorate uses numeric IDs
- Evidence: `packages/mcp-server/src/tools/guest-email-activity.ts:88-90`

**Q: Can MCP tools read email bodies (not just subjects)?**
- A: Yes, `gmail.users.messages.get()` with `format: 'full'` returns body
- Evidence: `packages/mcp-server/src/clients/gmail.ts` (Gmail API client)

**Q: Are there existing email templates for cancellations?**
- A: Yes, but only for "Prepayment - Cancelled post 3rd Attempt" (code 7)
- Evidence: `packages/mcp-server/data/email-templates.json`
- Missing: General cancellation confirmation template
- **New template content (approved):**
  ```
  Dear Guest,

  We have processed your cancellation in full. We are sorry you are unable to stay this time, and hope to see you in the future.
  ```

**Q: Should cancelled bookings appear in checkins table?**
- A: Hidden by default with "Show cancelled" toggle option
- Evidence: Pete confirmation
- Implementation: Default filter `status != "cancelled"`, optional toggle to show

**Q: Should we preserve deleted booking data from before archival is implemented?**
- A: Accept loss of already-deleted bookings (not important for operational system)
- Evidence: Pete confirmation
- Implementation: Start fresh with archival; no migration/recovery of historical deletions

**Q: How are activity codes currently logged?**
- A: Via `useActivitiesMutations` hook, writes to top-level fanout paths:
  - `/activities/{occupantId}/{activityId}`
  - `/activitiesByCode/{code}/{occupantId}/{activityId}`
- **NOT** nested under `/bookings/{ref}/{occupant}/activities` (common misconception)
- Evidence: `apps/reception/src/hooks/mutations/useActivitiesMutations.ts`

**Q: Email sending behavior confirmation?**
- A: Draft only, do not send automatically (already implemented behavior)
- Evidence: All MCP tools create drafts via `gmail.users.drafts.create()`

**Q: Which identifier in Octorate cancellation emails maps to Reception's reservationCode?**
- A: **RESOLVED — First number before underscore**
- Octorate uses compound IDs: `6355834117_6080280211`
- Reception's reservationCode = `6355834117` (first number)
- Evidence: `gmail-organize-inbox.test.ts:459,476-477,513` — NEW RESERVATION extraction pattern
- Same extraction logic applies to NEW CANCELLATION emails

**Q: Should we process cancellation emails from OTAs (Hostelworld, Booking.com)?**
- A: **NO — Octorate only**
- Only process cancellations from `noreply@smtp.octorate.com`
- OTA cancellation notifications are always duplicates of Octorate notifications
- Evidence: User confirmation

### Open (User Input Needed)

**BLOCKING PLANNING:**

**Q: Activity code 25 semantic conflict - deletion vs cancellation?**

Current state creates a contradiction:
- **Enum definition:** `CANCELLED = 25` (activities.ts:26)
- **Actual usage:** Tracks occupant *deletion* (useDeleteGuestFromBooking.ts:58, 193)
- **UI display:** StatusButton shows code 25 as "Cancelled"
- **Consequence:** Deletion events are misrepresented as cancellations in UI

**Proposed solution creates new problem:**
- Gap 1 plans to trigger cancellation confirmation emails on code 25
- But deletion flow logs code 25 → would send cancellation emails during deletion
- Evidence: `useDeleteGuestFromBooking.ts:193` logs code 25 after deleting guest data

**Decision needed (choose one):**

**Option A: Use code 25 for cancellation (redefine deletion tracking)**
- Stop logging code 25 in useDeleteGuestFromBooking.ts
- If deletion tracking is still needed, introduce new code (e.g., 27: OCCUPANT_DELETED)
- Update UI label to match enum definition
- Pro: Enum and behavior align
- Con: Breaks historical activity log interpretation (past 25s were deletions, future 25s are cancellations)

**Option B: Introduce new code for cancellation (keep 25 for deletion)** ← **APPROVED**
- Rename enum: `CANCELLED = 25` → `OCCUPANT_DELETED = 25`
- Add new code: `CANCELLED = 27`
- Update UI label: "Cancelled" → "Deleted"
- Update all cancellation flows to use new code 27
- Pro: Preserves historical activity log meaning
- Con: More UI/mapping updates required

**Decision rationale:**
- Preserves audit trail integrity (code 25 retains consistent "deletion" meaning across all historical data)
- Clear semantic separation: deletion (code 25) vs cancellation (code 27)
- Higher quality long-term system despite additional upfront work
- Risk assessment: Low — new code is additive, doesn't change existing behavior
- Evidence: Pete approval

**Implementation checklist (from decision):**
1. Add `CANCELLED = 27` to ActivityCode enum in activities.ts
2. Rename `CANCELLED = 25` → `OCCUPANT_DELETED = 25` in same enum
3. Update StatusButton.tsx UI label for code 25: "Cancelled" → "Deleted"
4. Add code 27 to useActivitiesMutations.relevantCodes array
5. Add code 27 mapping in guest-email-activity.ts (select cancellation template)
6. Update any other UI/display logic referencing code 25 as "cancellation"

---

## Confidence Inputs (for /lp-plan)

**Implementation:** 70%
- Clear technical path for all three phases (manual cancellation, soft-delete, inbound parsing)
- MCP tools and Firebase structure are well understood
- Email parsing patterns are straightforward (regex)
- Activity code decision resolved (code 27 for cancellation)
- **Gap:** No sample cancellation emails validated (H1 marked "None — untested")
- **Risk:** Writing regex parser for untested format is common source of rework
- **Prerequisite:** Gather 2-3 sample Octorate cancellation emails before Phase 3 implementation

**Approach:** 80%
- Soft-delete over deletion is standard practice
- Email trigger automation aligns with existing patterns
- Cancellation parsing is proven approach (same as NEW RESERVATION)
- Slight uncertainty: /bookingMeta read pattern optimization (flagged as design decision)

**Impact:** 90%
- Well-scoped: only affects email generation and booking status management
- No breaking changes to existing workflows
- Additive: new features, not modifications
- Low risk: dry-run mode available for testing

**Delivery-Readiness:** 75%
- Clear owner: Pete reviews all email drafts
- Channel: Gmail API (already in use)
- Quality gate: existing test patterns can be extended
- Missing: sample cancellation emails for validation

**Testability:** 85%
- Unit tests: easy to mock email parsing and activity logging
- Integration tests: can use dry-run mode
- Test seams: already exist (mocked Gmail, Firebase)
- Gap: no E2E test infrastructure (acceptable for this feature)

---

**What would raise confidence scores:**

**Implementation 70% → ≥80%:**
- Gather and validate 2-3 sample Octorate cancellation emails
- Confirm regex patterns match actual subject/body format
- Test extraction logic with real compound IDs from samples
- Prototype Phase 1 implementation (enum updates + email template)

**Implementation 80% → ≥90%:**
- Prototype cancellation parser with dry-run mode
- Test /bookingMeta read pattern performance with production booking volume
- Validate Firebase security rules for new paths

**Approach 80% → ≥90%:**
- Measure read amplification impact with /bookingMeta vs denormalized _meta
- Decide on Option A vs B based on performance metrics
- Load test with 100+ active bookings

---

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Cancellation email format changes unexpectedly | Medium | Medium | Version detection in parser; fallback to manual review queue; log unparseable emails for pattern analysis |
| Gmail API rate limits hit during batch cancellations | Low | Low | Implement exponential backoff; queue emails for retry; already have processing locks |
| Booking ref extraction fails (false negatives) | Medium | Medium | Comprehensive regex testing with sample emails; manual review queue for failed parses; logging for pattern refinement |
| Staff confusion from archived vs deleted bookings | Low | Medium | Clear UI indicators ("Cancelled" status badge); default filter hides cancelled bookings; training/documentation |
| Accidental status overwrites (race conditions) | Low | High | Use Firebase transactions for status updates; optimistic concurrency control; activity log as audit trail |
| Migration script sets wrong status for existing bookings | Low | High | Dry-run mode with validation report; manual review before applying; ability to revert migration |

---

## Planning Constraints & Notes

**Must-follow patterns:**
- Email drafts only (no automatic sending)
- Activity code logging for all booking events
- Firebase transactions for concurrent writes
- Dry-run mode for testing email generation
- Gmail label taxonomy (existing structure)

**Rollout/rollback expectations:**
- Phase 1: Add activity code 27, cancellation email template, and useCancelBooking mutation — ready to proceed
- Phase 2: Implement booking soft-delete (/bookingMeta path) — can proceed independently
- Phase 3: Add inbound cancellation email processing (depends on Phase 2 `/bookingMeta/` path)
- Phase dependency: Phase 3 requires Phase 2 to be deployed first; Phase 1 task 4 (useCancelBooking) depends on Phase 2 schema
- Recommended order: Phase 2 → Phase 1 (tasks 1-3) → Phase 1 (task 4) → Phase 3
- Rollback: disable MCP tool, revert status field changes, remove activity code 27 if needed (minimal impact since additive)

**Observability expectations:**
- Log all cancellation processing events
- Track email draft creation failures
- Monitor Gmail API quota usage
- Alert on unparseable cancellation emails

---

## Suggested Task Seeds (Non-binding)

**Phase 1: Manual Cancellation Emails (Ready)**

1. **Add new activity code to enum**
   - Add `CANCELLED = 27` to ActivityCode enum in activities.ts
   - Rename existing `CANCELLED = 25` → `OCCUPANT_DELETED = 25`
   - Update StatusButton.tsx UI label for code 25: "Cancelled" → "Deleted"
   - Audit and update any other UI/display logic referencing code 25 as "cancellation"

2. **Add cancellation email template**
   - Create template in `email-templates.json` with approved content
   - Subject: "Booking Cancellation Confirmation"
   - Category: "cancellation"
   - Body: "Dear Guest, We have processed your cancellation in full..."
   - Test with dry-run mode

3. **Wire activity code 27 to email trigger**
   - Add case 27 mapping in `guest-email-activity.ts` to select cancellation template
   - Add code 27 to `relevantCodes` array in useActivitiesMutations.ts (alongside 5,6,7,8,21)
   - Test email draft generation with dry-run mode

4. **Create dedicated cancellation mutation**
   - New hook: `useCancelBooking` (distinct from `useDeleteBooking`)
   - Workflow:
     1. Write `/bookingMeta/{ref}/status = "cancelled"` (requires Phase 2 schema)
     2. Enumerate occupants from `/bookings/{ref}`
     3. Log activity code 27 (CANCELLED) for EACH occupant via useActivitiesMutations
     4. Keep `guestsByBooking/{occupantId}` intact (required for email lookup)
   - Email auto-triggers via useActivitiesMutations (code 27 in relevantCodes)
   - Note: Step 1 depends on Phase 2 `/bookingMeta/` path existing
   - Test via reception UI cancellation flow

2b. **Fix silent failures for codes 2, 3, 4**
   - Remove codes 2, 3, 4 from `relevantCodes` array in useActivitiesMutations.ts
   - These codes (T&C reminders, auto-cancel) have no MCP templates and no business requirement
   - Prevents silent email failures when these activities are logged

2c. **Clean up activity code 26 naming inconsistency (low priority)**
   - Enum: `RESEND_APP_EMAIL` vs UI display: "App email draft created"
   - EmailBookingButton logs code 26 after *creating* draft (not resending)
   - Options: rename enum to `APP_EMAIL_DRAFT_CREATED` or update UI to match enum
   - Evidence: `activities.ts:27`, `EmailBookingButton.tsx:71`, `StatusButton.tsx:44`

**Phase 2: Booking Archival (Foundation)**

3. **Implement booking soft-delete**
   - Create new mutation hook: `useArchiveBooking` (replaces `useDeleteBooking`)
   - Write booking metadata to `/bookingMeta/{reservationCode}/status` (separate from occupants)
   - Preserve occupant data in `/bookings/{reservationCode}/{occupantId}` (don't delete)
   - Preserve activities in fanout paths (don't delete)
   - Add Firebase security rules for `/bookingMeta` path
     * Follow existing pattern: likely write access for authenticated staff, read access for booking queries
     * Evidence: Existing rules in `apps/reception/firebase.rules` or similar
   - Update bulk actions to use soft-delete instead of delete
   - Note: Different pattern from `useArchiveCheckedOutGuests` (which moves data to `/archive/`)

4. **Add UI filter for cancelled bookings**
   - Hide cancelled bookings by default in checkins table
   - Add "Show cancelled" toggle to header
   - Show "CANCELLED" badge when visible
   - Update queries to filter by status from `/bookingMeta`

**Phase 3: Automated Cancellation Processing (Advanced)**

**Prerequisites:**
- Gather 2-3 sample Octorate cancellation emails and validate regex patterns before starting Phase 3
- **Depends on Phase 2:** `/bookingMeta/{reservationCode}/status` path must exist (created in Phase 2, task 3)

5. **Create cancellation email parser**
   - Extract reservationCode from email body (regex patterns)
   - Handle Hostelworld: `7763-XXXXXX` (entire ref)
   - Handle Octorate: Extract first number from compound ID `XXXXXXXXXX_YYYYYYYYYY` → use `XXXXXXXXXX`
   - **Filter by source:** ONLY process `noreply@smtp.octorate.com` (ignore OTA duplicates)
   - Detect provider from email From address
   - Handle parsing failures gracefully (log for review)
   - Unit tests with sample emails

6. **Integrate cancellation parser with Gmail organize**
   - Add explicit provider cancellation exception path (BEFORE non-customer classification)
   - Detect cancellation pattern: subject `/new cancellation/i` + from `noreply@smtp.octorate.com` **ONLY**
   - **IGNORE** cancellations from OTAs (Hostelworld, Booking.com) - always duplicates of Octorate
   - Apply workflow label: `Brikette/Workflow/Cancellation-Received`
   - Trigger new MCP tool: `process_cancellation_email`
   - MCP tool writes directly to RTDB via REST (fanout pattern + bookingMeta):
     * Extract first number from Octorate compound ID as reservationCode
     * Enumerate occupants from `/bookings/{reservationCode}`
     * For each occupant, write activity with full shape: `{code: 22, timestamp: ISO_string, who: "Octorate"}`
     * Generate collision-safe activityId per occupant (e.g., `act_${Date.now()}_${index}`)
     * Write to both fanout paths: `/activities/{occupantId}/{activityId}` and `/activitiesByCode/22/{occupantId}/{activityId}`
     * Write booking metadata to `/bookingMeta/{reservationCode}/`

7. **Create manual review queue for failed cancellation processing**
   - Log parse failures with email ID + body snippet
   - Gmail label: `Brikette/Workflow/Cancellation-Parse-Failed`
   - Log booking-not-found failures with email ID + extracted ref
   - Gmail label: `Brikette/Workflow/Cancellation-Booking-Not-Found`
   - Allow staff to manually process via ops-inbox
   - Separate labels enable faster triage (parse → dev, not-found → ops)

**Out of scope (no current business requirement):**
- Room change notification emails (codes 17, 18, 20, 24)
- Check-in/check-out notification emails (codes 12, 14)
- If needed in future, treat as separate feature request

---

## Execution Routing Packet

**Primary execution skill:** `/lp-build`

**Supporting skills:**
- `/lp-plan` — Create detailed implementation plan
- `/review-critique` — Review email templates and parsing logic

**Deliverable acceptance package:**
- Email template added to `email-templates.json`
- Activity code 25 triggers email draft
- Booking archival implemented (status field)
- Cancellation email parser with tests
- UI filter for cancelled bookings
- All changes tested with dry-run mode
- No breaking changes to existing workflows

**Post-delivery measurement plan:**
- Count cancellation emails auto-processed
- Track email draft creation success rate
- Monitor booking archival usage
- Measure staff time saved on manual cancellation processing

---

## Planning Readiness

**Status:** Ready-for-planning

**All blocking items resolved:**
- ✅ **Activity code semantic conflict resolved** (Option B approved: introduce code 27 for cancellation)
- ✅ Manual cancellation implementation approach approved (dedicated useCancelBooking mutation)
- ✅ All open questions answered by Pete
- ✅ Compound ID extraction pattern resolved (first number only)
- ✅ OTA filtering policy confirmed (Octorate only, ignore duplicates)
- ✅ /bookingMeta read amplification tradeoff documented
- ✅ Multi-occupant activity writes specified
- ✅ Failure modes and labels clarified

**Prerequisites for Phase 3 implementation (not blocking planning):**
- ⚠️ Gather 2-3 sample Octorate cancellation emails before implementing parser
- Validate regex patterns against actual email format
- Confirm subject line and body structure match assumptions
- Phase 1 and Phase 2 can proceed immediately without samples

**Approved approach:**
- Email drafts only (no sending)
- Cancellation template content finalized
- UI behavior defined (hidden by default, toggle to show)
- No recovery of historical deletions
- Phased rollout: manual cancellations first, then archival, then automation

**Recommended next step:**
- ✅ Blocking question resolved (Option B: code 27 for cancellation)
- Ready for `/lp-plan` to create detailed implementation plan
- Note: Sample emails are prerequisite for Phase 3 implementation (not blocking planning)
- Phases can be executed in order: Phase 1 (manual cancellation), Phase 2 (soft-delete infrastructure), Phase 3 (automated inbound processing)

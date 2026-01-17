---
Type: Plan
Status: Superseded
Domain: Prime
Last-reviewed: 2026-01-13
Relates-to charter: TBD (Prime charter not yet defined)
Relates-to plan: docs/plans/prime-improvement-plan.md (completed)
Last-updated: 2026-01-17
Last-updated-by: Codex
---

# Prime - Pre-Arrival & Check-In Experience Plan

Superseded by `docs/plans/prime-guest-portal-gap-plan.md`. This plan remains as
historical context, but all open work has been rolled forward into the newer
plan with an updated gap audit.

Transform Prime from a post-arrival utility into a complete guest journey that
begins at booking confirmation and guides guests through arrival readiness,
check-in, and their stay.

## Background

The completed `prime-improvement-plan.md` focused on post-arrival engagement:
quests, badges, social features, and local content. This plan addresses the
**pre-arrival gap** identified in the spec comparison analysis.

### Current State (Post prime-improvement-plan)

- Guest auth via UUID + PIN in URL
- Post-arrival onboarding (profile, social opt-in)
- Quest system with 3 tiers (settle-in, social-night, positano-explorer)
- Activity chat and social features
- Positano guidebook linking to Brikette content
- Badge collection and XP tracking

### Implementation audit (code truth, 2026-01-17)

Source of truth: Prime app code and CF Pages Functions. No code was found in
`apps/reception/src` to confirm booking data schema; Prime functions reference
`bookings` data directly.
Guest UUID format from operations: `occ_<13-digit-number>` (example:
`occ_1747615362152`).

- Partial: Find-my-stay UI + API exist and redirect to a tokenized guest link,
  but the portal is still a placeholder:
  `apps/prime/src/app/find-my-stay/page.tsx`,
  `apps/prime/functions/api/find-booking.ts`,
  `apps/prime/src/app/g/page.tsx`,
  `apps/prime/src/app/portal/page.tsx`.
- Partial: Check-in code generation exists via CF Pages Functions and is tied to
  booking IDs (no UUID mapping), with no atomic counter:
  `apps/prime/functions/api/check-in-code.ts`,
  `apps/prime/functions/api/find-booking.ts`.
- Partial: Guest token validation and last-name verification exist (not part of
  this original plan scope): `apps/prime/functions/api/guest-session.ts`.
- Partial: Staff lookup UI exists but uses localStorage PIN stub and has no
  server-side auth guard:
  `apps/prime/src/app/staff-lookup/page.tsx`,
  `apps/prime/src/contexts/messaging/PinAuthProvider.tsx`,
  `apps/prime/functions/api/check-in-lookup.ts`.
- Missing: Pre-arrival data model, readiness dashboard, route planner, ETA
  capture, cash prep UI, arrival mode, keycard status, messaging hooks, offline
  support, i18n updates (no code present under `apps/prime/src`).

### Gap Summary

| Area | Current | Target |
|------|---------|--------|
| Pre-arrival access | Requires PIN | Authenticated readiness dashboard |
| Route planning | Not in Prime | Integrated from Brikette |
| ETA confirmation | None | Guest-submitted arrival time |
| Cash prep reminders | Post-arrival only | Pre-arrival prominent |
| Check-in QR/code | None | Show-at-reception screen |
| "Find my stay" fallback | None | Booking code + name lookup |
| Messaging hooks | None | Email sequence triggers |
| Offline support | None | Service worker + cache |

## North-star outcome

- Guests feel prepared and confident before arriving.
- Check-in takes <2 minutes with "show this screen" QR.
- Guests without their personal link can still access their portal.
- Staff can scan or type a code to look up any guest.

## Constraints

- **Allowed backend:** Next.js API routes (already in Prime) and existing
  Firebase Cloud Functions. "No new backend services" means no new
  infrastructure beyond what already exists.
- No push notifications; rely on email/WhatsApp orchestration.
- No in-app payments; city tax and deposit remain cash-only.
- Keep mobile-first responsive design.
- Leverage existing Brikette route content where possible.
- **All guest data access requires authentication** (UUID + PIN or staff role).

## Non-goals

- Building a staff check-in app (separate project).
- Implementing push notifications or native app.
- Adding payment processing for city tax/deposit.
- Full offline-first architecture (basic caching only).
- Public unauthenticated access to any guest PII.

---

## Security architecture

### Authentication model

All pre-arrival features require authentication. There is **no public guest
data access**.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Authentication Tiers                        │
├─────────────────────────────────────────────────────────────────┤
│ Tier 1: Guest (UUID + PIN)                                      │
│   - Read/write own preArrival/{uuid}                            │
│   - Read own booking data                                       │
│   - View own check-in code and QR                               │
│                                                                 │
│ Tier 2: Staff (Firebase Auth + staff/admin claim)               │
│   - Read any guest's check-in summary (via code lookup)         │
│   - Cannot modify guest data                                    │
│   - Audit logged                                                │
│                                                                 │
│ Tier 3: Find-My-Stay (rate-limited, returns minimal data)       │
│   - Input: booking code + last name (case-insensitive)          │
│   - Output: redirect URL only (no PII in response)              │
│   - Rate limited: 5 attempts per IP per 15 minutes              │
│   - Failed attempts logged for security monitoring              │
└─────────────────────────────────────────────────────────────────┘
```

### Firebase Realtime Database rules

New rules to add (in addition to existing rules):

```javascript
{
  "rules": {
    // Pre-arrival data: only authenticated guest can read/write own data
    "preArrival": {
      "$uuid": {
        ".read": "auth != null && (
          auth.uid === $uuid ||
          root.child('messagingUsers').child(auth.uid).child('role').val() === 'staff' ||
          root.child('messagingUsers').child(auth.uid).child('role').val() === 'admin' ||
          root.child('messagingUsers').child(auth.uid).child('role').val() === 'owner'
        )",
        ".write": "auth != null && auth.uid === $uuid"
      }
    },

    // Check-in codes: bidirectional index
    "checkInCodes": {
      // Code → UUID lookup (staff only)
      "byCode": {
        "$code": {
          ".read": "auth != null && (
            root.child('messagingUsers').child(auth.uid).child('role').val() === 'staff' ||
            root.child('messagingUsers').child(auth.uid).child('role').val() === 'admin' ||
            root.child('messagingUsers').child(auth.uid).child('role').val() === 'owner'
          )",
          ".write": false  // Only server can write
        }
      },
      // UUID → Code lookup (guest reads own)
      "byUuid": {
        "$uuid": {
          ".read": "auth != null && auth.uid === $uuid",
          ".write": false  // Only server can write
        }
      }
    },

    // Code generation counter (atomic increment, server only)
    "checkInCodeCounter": {
      ".read": false,
      ".write": false  // Cloud Function only via Admin SDK
    }
  }
}
```

### Check-in code lookup (staff view)

The `/checkin/[code]` route returns **minimal data** for staff use:

```typescript
// Staff sees only what's needed for check-in
interface StaffCheckInView {
  guestName: string;           // First name + last initial
  roomAssignment: string;      // Room number or "Not assigned"
  checkInDate: string;         // ISO date
  checkOutDate: string;        // ISO date
  nights: number;
  cityTaxDue: number;          // Amount in EUR
  depositDue: number;          // Amount in EUR
  etaWindow: string | null;    // e.g., "18:00-18:30"
  etaMethod: string | null;    // e.g., "ferry"
  // NO: full name, email, phone, passport, address
}
```

### Find-my-stay security

The `/api/find-booking` endpoint does NOT return PII:

```typescript
// Request
interface FindBookingRequest {
  bookingCode: string;    // e.g., "BRK123456"
  lastName: string;       // Case-insensitive match
}

// Response (success) - NO PII, just redirect
interface FindBookingResponse {
  success: true;
  redirectUrl: string;    // e.g., "/g/abc123?pin=..."
}

// Response (failure) - generic error
interface FindBookingErrorResponse {
  success: false;
  error: "not_found" | "rate_limited";
  // NO details about what didn't match
}
```

Rate limiting implementation:
- Use `@upstash/ratelimit` or in-memory store
- 5 requests per IP per 15-minute window
- Log all attempts with IP, timestamp, booking code (not last name)

---

## Data model additions

### New Firebase paths

```
preArrival/{uuid}/
  etaWindow: string | null       # e.g., "18:00" (HH:MM format, not free-form)
  etaMethod: string | null       # enum: ferry|bus|taxi|private|train|other
  etaNote: string                # free-text note (max 200 chars)
  etaConfirmedAt: number | null  # timestamp (ms)
  cashReadyCityTax: boolean      # self-attestation
  cashReadyDeposit: boolean      # self-attestation
  routeSaved: string | null      # saved route slug
  checklistProgress: {
    routePlanned: boolean
    etaConfirmed: boolean
    cashPrepared: boolean
    rulesReviewed: boolean
    locationSaved: boolean
  }
  updatedAt: number

checkInCodes/
  byCode/{code}/                 # Code → UUID index
    uuid: string
    createdAt: number
    expiresAt: number            # checkOutDate + 48h, in booking timezone
  byUuid/{uuid}/                 # UUID → Code index
    code: string
    createdAt: number
    expiresAt: number

checkInCodeCounter/
  lastCode: number               # Atomic counter for uniqueness
```

### Timezone and date handling

All date comparisons use the **booking's local timezone** (Europe/Rome for
Positano). This prevents edge cases around midnight UTC.

```typescript
// Date comparison helper
import { isToday, isFuture, isPast } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const BOOKING_TIMEZONE = 'Europe/Rome';

export function getGuestArrivalState(
  checkInDate: string,  // ISO date: "2026-01-15"
  checkOutDate: string,
  isCheckedIn: boolean,
): 'pre-arrival' | 'arrival-day' | 'checked-in' | 'checked-out' {
  const now = toZonedTime(new Date(), BOOKING_TIMEZONE);
  const checkIn = toZonedTime(new Date(checkInDate), BOOKING_TIMEZONE);
  const checkOut = toZonedTime(new Date(checkOutDate), BOOKING_TIMEZONE);

  if (isCheckedIn) return 'checked-in';
  if (isPast(checkOut)) return 'checked-out';
  if (isToday(checkIn)) return 'arrival-day';
  if (isFuture(checkIn)) return 'pre-arrival';
  return 'checked-in'; // Past check-in but not marked = assume checked in
}
```

### Check-in code expiry

Code expires at **check-out date + 48 hours** in booking timezone:

```typescript
export function calculateCodeExpiry(checkOutDate: string): number {
  const checkOut = toZonedTime(new Date(checkOutDate), BOOKING_TIMEZONE);
  const expiry = addHours(checkOut, 48);
  return expiry.getTime();
}
```

### ETA window format

ETA is stored as structured data, not free-form string:

```typescript
export interface EtaData {
  time: string;        // HH:MM format, e.g., "18:00"
  method: EtaMethod;
  note: string;        // Max 200 chars
}

export type EtaMethod = 'ferry' | 'bus' | 'taxi' | 'private' | 'train' | 'other';

// UI presents 30-min windows, stored as start time
// "18:00" displayed as "18:00-18:30"
```

### New TypeScript types

Location: `apps/prime/src/types/preArrival.ts`

```typescript
export type EtaMethod = 'ferry' | 'bus' | 'taxi' | 'private' | 'train' | 'other';

export interface ChecklistProgress {
  routePlanned: boolean;
  etaConfirmed: boolean;
  cashPrepared: boolean;
  rulesReviewed: boolean;
  locationSaved: boolean;
}

export interface PreArrivalData {
  etaWindow: string | null;      // HH:MM format
  etaMethod: EtaMethod | null;
  etaNote: string;
  etaConfirmedAt: number | null;
  cashReadyCityTax: boolean;
  cashReadyDeposit: boolean;
  routeSaved: string | null;
  checklistProgress: ChecklistProgress;
  updatedAt: number;
}

export const DEFAULT_PRE_ARRIVAL: PreArrivalData = {
  etaWindow: null,
  etaMethod: null,
  etaNote: '',
  etaConfirmedAt: null,
  cashReadyCityTax: false,
  cashReadyDeposit: false,
  routeSaved: null,
  checklistProgress: {
    routePlanned: false,
    etaConfirmed: false,
    cashPrepared: false,
    rulesReviewed: false,
    locationSaved: false,
  },
  updatedAt: 0,
};
```

Location: `apps/prime/src/types/checkInCode.ts`

```typescript
export interface CheckInCodeRecord {
  code: string;        // Format: "BRK-XXXXX" (8 chars total)
  uuid: string;
  createdAt: number;
  expiresAt: number;
}
```

### Readiness score computation

Readiness score is **computed on read**, not stored. This ensures consistency
and avoids drift.

```typescript
// Pure function - no async, no storage
export function computeReadinessScore(
  checklist: ChecklistProgress,
): number {
  const weights: Record<keyof ChecklistProgress, number> = {
    routePlanned: 25,
    etaConfirmed: 20,
    cashPrepared: 25,
    rulesReviewed: 15,
    locationSaved: 15,
  };

  return Object.entries(checklist).reduce((score, [key, completed]) => {
    return score + (completed ? weights[key as keyof ChecklistProgress] : 0);
  }, 0);
}
```

### Booking data source

City tax and deposit amounts come from **existing booking data**:

```typescript
// From UnifiedOccupantData (already exists)
interface BookingFinancials {
  cityTax: {
    totalDue: number;
    totalPaid: number;
    balance: number;
  };
  // Deposit: check if this exists in current schema
  // If not, use config-based default
}

// Config fallback for deposit (if not in booking)
const DEPOSIT_CONFIG = {
  keycardDeposit: 10,  // EUR per keycard
  currency: 'EUR',
};
```

---

## Active tasks

### Phase 0 - Security foundation

- [ ] PRIME-SEC-01: Firebase RTDB rules for pre-arrival data
  - Scope:
    - Add rules for `preArrival/{uuid}` path (guest read/write own).
    - Add rules for `checkInCodes/byCode` (staff read only).
    - Add rules for `checkInCodes/byUuid` (guest read own).
    - Test rules with Firebase emulator.
  - Dependencies: None.
  - Definition of done:
    - Rules deployed and tested.
    - Guests can only access own data.
    - Staff can lookup codes but not modify.
    - Unauthenticated access blocked.

- [ ] PRIME-SEC-02: Rate limiting for find-booking API
  - Scope:
    - Add `@upstash/ratelimit` or equivalent to project.
    - Implement rate limiter middleware for `/api/find-booking`.
    - Limit: 5 requests per IP per 15 minutes.
    - Log failed attempts with IP and timestamp.
  - Dependencies: None.
  - Definition of done:
    - Rate limiting works in production.
    - Exceeding limit returns 429 error.
    - Attempts logged for monitoring.

### Phase 1 - Pre-arrival foundation

- [ ] PRIME-PREARRIVAL-01: Pre-arrival data types and hooks
  - Scope:
    - Create `apps/prime/src/types/preArrival.ts` with types as specified.
    - Create `apps/prime/src/types/checkInCode.ts` with code types.
    - Add `useFetchPreArrival` hook for reading `preArrival/{uuid}`.
    - Add `usePreArrivalMutator` hook for writing pre-arrival data.
    - Add `computeReadinessScore` pure function (compute on read).
    - Add `getGuestArrivalState` helper with timezone handling.
  - Dependencies: PRIME-SEC-01.
  - Definition of done:
    - Types compile without errors.
    - Hooks can read/write pre-arrival data to Firebase.
    - Readiness score computed correctly from checklist state.
    - Arrival state correctly handles timezone edge cases.

- [ ] PRIME-PREARRIVAL-02: Check-in code generation (server-side)
  - Scope:
    - Create Cloud Function `generateCheckInCode`:
      - Uses atomic counter for uniqueness (transaction on counter).
      - Format: "BRK-XXXXX" (prefix + 5 alphanumeric).
      - Writes to both `byCode/{code}` and `byUuid/{uuid}` atomically.
      - Called when guest first accesses pre-arrival or arrival mode.
    - Create `useCheckInCode` hook that:
      - Reads from `checkInCodes/byUuid/{uuid}`.
      - Triggers generation if missing or expired.
      - Returns code and loading state.
    - Expiry: checkOutDate + 48h in booking timezone.
  - Dependencies: PRIME-PREARRIVAL-01.
  - Definition of done:
    - Codes are unique (no collisions).
    - Bidirectional index maintained atomically.
    - Expired codes filtered out on read.
    - Generation is idempotent (calling twice returns same code).

- [ ] PRIME-PREARRIVAL-03: QR code generation component
  - Scope:
    - Create `apps/prime/src/components/check-in/CheckInQR.tsx`:
      - Generates QR code encoding check-in URL.
      - Shows human-readable code below QR.
      - Uses `qrcode` library (lightweight, no external service).
    - QR encodes: `https://prime.hostelbrikette.com/checkin/{code}`.
    - Display both QR and typeable code prominently.
  - Dependencies: PRIME-PREARRIVAL-02.
  - Definition of done:
    - QR renders correctly on mobile screens.
    - Code is large, readable, and copyable.
    - Staff can scan QR or type code to look up guest.

### Phase 2 - Readiness dashboard

- [ ] PRIME-READY-01: Pre-arrival home variant
  - Scope:
    - Use `getGuestArrivalState()` to detect state.
    - Create `apps/prime/src/components/pre-arrival/ReadinessDashboard.tsx`:
      - Readiness score display (computed, not stored).
      - Checklist items with completion state.
      - Next-best-action card (single prominent CTA).
    - Replace standard home with readiness dashboard when `pre-arrival`.
    - After check-in date, show arrival mode or standard home.
  - Dependencies: PRIME-PREARRIVAL-01.
  - Definition of done:
    - Pre-arrival guests see readiness dashboard.
    - Arrival-day guests see arrival mode.
    - Checked-in guests see standard home.
    - Transition is automatic based on date + timezone.

- [ ] PRIME-READY-02: Pre-arrival checklist items
  - Scope:
    - Implement 5 checklist items as interactive cards:
      1. **Plan your route** - Links to route planner, marks `routePlanned`.
      2. **Confirm arrival time** - Opens ETA picker, marks `etaConfirmed`.
      3. **Prepare cash** - Shows amounts, toggles mark `cashPrepared`.
      4. **Review house rules** - Links to rules, marks `rulesReviewed`.
      5. **Save hostel location** - Copy/maps action, marks `locationSaved`.
    - Each item updates `checklistProgress` on completion.
    - Readiness score recomputes on each render (not stored).
  - Dependencies: PRIME-READY-01.
  - Definition of done:
    - All 5 items are interactive and trackable.
    - Completing items visually updates the checklist.
    - Readiness score reflects completion state.

- [ ] PRIME-READY-03: Next-best-action card
  - Scope:
    - Create `apps/prime/src/components/pre-arrival/NextActionCard.tsx`.
    - Logic to determine highest-priority incomplete action:
      1. No route planned → "Plan your route from [origin]"
      2. No ETA → "Tell us when you'll arrive"
      3. Cash not ready → "Prepare €X city tax + €Y deposit"
      4. Rules not reviewed → "Quick look at house rules"
      5. All complete → "You're ready! See you soon"
    - Single prominent button with contextual copy.
  - Dependencies: PRIME-READY-02.
  - Definition of done:
    - Card shows exactly one action at a time.
    - Action priority is logical and helpful.
    - Completing action advances to next priority.

### Phase 3 - Route planning

- [ ] PRIME-ROUTE-01: Route data integration from Brikette
  - Scope:
    - Import route definitions from Brikette:
      - `apps/brikette/src/data/how-to-get-here/routes.json`
      - Route schema and types.
    - Create shared route types in `apps/prime/src/types/routes.ts`.
    - Create `useRoutes` hook to load route data.
    - Filter routes relevant to Positano destination.
  - Dependencies: None.
  - Definition of done:
    - Route data loads in Prime app.
    - Types match Brikette schema.
    - Routes filtered to Positano-relevant options.

- [ ] PRIME-ROUTE-02: Route planner UI
  - Scope:
    - Create `apps/prime/src/components/routes/RoutePlanner.tsx`:
      - Origin selector (airports, train stations, ports).
      - Mode filter (ferry, bus, taxi, private transfer).
      - Route list with segments, times, warnings.
    - Create route at `/how-to-get-here`.
    - Mark `routePlanned: true` when user views any route detail.
  - Dependencies: PRIME-ROUTE-01.
  - Definition of done:
    - Users can select origin and see route options.
    - Route details show segments and timing.
    - Viewing a route updates checklist progress.

- [ ] PRIME-ROUTE-03: Route actions and save
  - Scope:
    - Add action buttons to route cards:
      - "Open in Maps" - deep link to Google/Apple Maps.
      - "Copy address" - hostel address in Italian.
      - "Save to my trip" - stores route slug in `preArrival.routeSaved`.
    - Show saved route on readiness dashboard.
    - Add "last departure" warnings for time-sensitive routes.
  - Dependencies: PRIME-ROUTE-02.
  - Definition of done:
    - Map links open correctly on mobile.
    - Address copies to clipboard.
    - Saved route persists and displays on dashboard.

### Phase 4 - ETA and cash prep

- [ ] PRIME-ETA-01: ETA confirmation flow
  - Scope:
    - Create `apps/prime/src/components/pre-arrival/EtaConfirmation.tsx`:
      - Time picker with 30-min increments (06:00-24:00).
      - Stored as HH:MM string (e.g., "18:00").
      - Travel method selector (enum, not free-form).
      - Optional note field (max 200 chars).
    - Save to `preArrival/{uuid}` on confirmation.
    - Show late check-in info if time >= 22:00.
    - Mark `checklistProgress.etaConfirmed: true`.
  - Dependencies: PRIME-PREARRIVAL-01.
  - Definition of done:
    - ETA can be selected and saved.
    - Late arrivals see special instructions.
    - ETA displays on readiness dashboard.
    - Format is consistent (HH:MM).

- [ ] PRIME-CASH-01: Cash preparedness display
  - Scope:
    - Create `apps/prime/src/components/pre-arrival/CashPrep.tsx`:
      - Show city tax amount from `occupantData.cityTax.totalDue`.
      - Show keycard deposit from config (or booking if available).
      - Calculate totals for booking party size.
      - "I have cash ready" toggles for each.
    - Toggles update `cashReadyCityTax` and `cashReadyDeposit`.
    - When both true, mark `checklistProgress.cashPrepared: true`.
  - Dependencies: PRIME-PREARRIVAL-01.
  - Definition of done:
    - Amounts display correctly for booking.
    - Toggles persist to Firebase.
    - Total is calculated for multi-guest bookings.

- [ ] PRIME-CASH-02: Cash reminder on arrival mode
  - Scope:
    - On arrival day, show prominent cash reminder:
      - "Bring €X city tax + €Y deposit in cash"
      - Show on arrival mode home and check-in QR screen.
    - If `cashPrepared === false`, show warning styling.
  - Dependencies: PRIME-CASH-01, PRIME-READY-01.
  - Definition of done:
    - Cash amounts visible on check-in day.
    - Warning if guest hasn't confirmed cash ready.

### Phase 5 - Check-in experience

- [ ] PRIME-CHECKIN-01: Arrival mode home
  - Scope:
    - When `getGuestArrivalState() === 'arrival-day'`:
    - Create `apps/prime/src/components/arrival/ArrivalHome.tsx`:
      - "Show this at reception" section (QR + code).
      - Cash reminder (prominent).
      - ID reminder ("Have passport/ID ready").
      - "What happens next" bullets.
    - Transition: pre-arrival → arrival → checked-in.
  - Dependencies: PRIME-PREARRIVAL-03, PRIME-CASH-02.
  - Definition of done:
    - Arrival day shows dedicated arrival mode.
    - QR and code are prominent and scannable.
    - Clear guidance on check-in process.

- [ ] PRIME-CHECKIN-02: Check-in code lookup route (staff only)
  - Scope:
    - Create `/checkin/[code]` route.
    - **Require staff authentication** (redirect non-staff to home).
    - Lookup `checkInCodes/byCode/{code}` → get UUID.
    - Fetch minimal booking summary (StaffCheckInView interface).
    - Display:
      - Guest name (first + last initial only).
      - Room, nights, dates.
      - City tax and deposit amounts.
      - ETA if provided.
    - Invalid/expired codes show error (no details).
    - Log all lookups for audit trail.
  - Dependencies: PRIME-PREARRIVAL-02, PRIME-SEC-01.
  - Definition of done:
    - Only staff can access this route.
    - Lookup returns minimal data (no full PII).
    - Invalid codes show generic error.
    - All lookups logged.

- [ ] PRIME-CHECKIN-03: Post-check-in transition
  - Scope:
    - Detect checked-in state from booking data (`isCheckedIn`).
    - Transition from arrival mode to standard home.
    - Show "Welcome!" toast/banner on first post-check-in visit.
    - Quest system activates (settle-in tier available).
  - Dependencies: PRIME-CHECKIN-01.
  - Definition of done:
    - Checked-in guests see standard home with quests.
    - Transition is automatic and seamless.
    - Welcome moment is celebratory but brief.

### Phase 6 - Find my stay fallback

- [ ] PRIME-FIND-01: Booking lookup UI
  - Scope:
    - Create `apps/prime/src/components/auth/FindMyStay.tsx`:
      - Booking code input field.
      - Last name input field.
      - "Find my stay" button.
    - Route at `/find-my-stay` (public page, but no data exposed).
    - On success: redirect to personal link (no PII in response).
    - On failure: generic "not found" (no detail about what failed).
  - Dependencies: PRIME-SEC-02.
  - Definition of done:
    - Guests can look up booking by code + name.
    - Successful lookup redirects to authenticated portal.
    - Failed lookup shows generic error (no enumeration info).

- [ ] PRIME-FIND-02: Booking lookup API
  - Scope:
    - Create `/api/find-booking` Next.js API route:
      - Input: booking code, last name (case-insensitive).
      - Validate against booking database.
      - On match: return redirect URL only (no PII).
      - On fail: return generic error.
    - Apply rate limiting (PRIME-SEC-02).
    - Log all attempts (IP, timestamp, booking code - NOT last name).
  - Dependencies: PRIME-FIND-01, PRIME-SEC-02.
  - Definition of done:
    - API validates booking code + name match.
    - Response contains NO PII (redirect URL only).
    - Rate limiting active.
    - Attempts logged for security.

- [ ] PRIME-FIND-03: Universal entry QR
  - Scope:
    - Create static QR code for hostel signage:
      - Points to `/find-my-stay`.
      - "Scan to access your portal" messaging.
    - Generate as PNG for printing.
    - Not guest-specific (universal entry point).
  - Dependencies: PRIME-FIND-01.
  - Definition of done:
    - QR generates and displays correctly.
    - Scanning opens find-my-stay page.
    - Works on all devices.

### Phase 7 - Messaging hooks

- [ ] PRIME-MSG-01: Pre-arrival event triggers
  - Scope:
    - Define messaging trigger events:
      - `booking.confirmed` - immediate welcome email.
      - `arrival.7days` - week-before reminder.
      - `arrival.48hours` - cash + ETA reminder.
      - `arrival.morning` - day-of check-in QR.
    - Create `apps/prime/src/lib/messaging/triggers.ts`:
      - Event type definitions.
      - Payload schemas for each event.
    - Events processed by existing Cloud Function infrastructure.
    - Trigger via Firebase write to `messagingQueue/{eventId}`.
  - Dependencies: PRIME-PREARRIVAL-01.
  - Definition of done:
    - Event types are well-defined with Zod schemas.
    - Events can be written to queue.
    - Payloads contain all necessary data.

- [ ] PRIME-MSG-02: Email template data
  - Scope:
    - Create data helpers for email templates:
      - `getPreArrivalEmailData(uuid)` - readiness state, amounts.
      - `getArrivalDayEmailData(uuid)` - check-in code (not full QR).
    - Integrate with `@acme/email` package.
    - Templates consume data from these helpers.
    - QR code generated client-side, not embedded in email.
  - Dependencies: PRIME-MSG-01.
  - Definition of done:
    - Email data helpers return correct payloads.
    - Integration with email package works.
    - Templates can be rendered with guest data.

- [ ] PRIME-MSG-03: Calendar invite generation
  - Scope:
    - Create `apps/prime/src/lib/calendar/generateIcs.ts`:
      - Generate .ics file for check-in date.
      - Include hostel address, check-in time, contact.
      - Use booking timezone (Europe/Rome).
    - Add "Add to calendar" button on readiness dashboard.
    - Download or open in default calendar app.
  - Dependencies: None.
  - Definition of done:
    - ICS file generates correctly.
    - Calendar events appear in user's calendar.
    - Works on iOS and Android.

### Phase 8 - Offline and PWA

- [ ] PRIME-PWA-01: Service worker setup
  - Scope:
    - Create `apps/prime/public/sw.js` service worker.
    - Cache strategy:
      - Static assets: cache-first.
      - API calls: network-first with fallback.
      - Images: cache with expiry.
    - Register service worker in app entry.
  - Dependencies: None.
  - Definition of done:
    - Service worker registers on first visit.
    - Static assets load from cache on repeat visits.
    - App shell renders offline.

- [ ] PRIME-PWA-02: Offline data caching (non-sensitive only)
  - Scope:
    - Cache **non-sensitive** guest data only:
      - Check-in code (string, not linked to PII).
      - Hostel address and contact (public info).
      - House rules summary (public info).
      - Guest first name only (for personalization).
    - Use IndexedDB with encryption at rest.
    - **Clear cache on logout/session end**.
    - Set TTL: cache expires after checkout date.
  - Dependencies: PRIME-PWA-01.
  - Definition of done:
    - Critical screens work offline.
    - Check-in code available without network.
    - Cache clears on logout.
    - No sensitive PII cached.

- [ ] PRIME-PWA-03: Offline indicator and cache management
  - Scope:
    - Detect offline state via `navigator.onLine`.
    - Show subtle indicator when offline.
    - Disable actions that require network.
    - Add "Clear cached data" option in settings.
    - Auto-clear cache on session end.
  - Dependencies: PRIME-PWA-02.
  - Definition of done:
    - Users know when they're offline.
    - Offline-safe features remain usable.
    - Users can manually clear cache.
    - Cache auto-clears appropriately.

### Phase 9 - Copy and polish

- [ ] PRIME-COPY-01: Pre-arrival i18n
  - Scope:
    - Create `PreArrival` i18n namespace with keys for:
      - Readiness dashboard headings and labels.
      - Checklist item titles and descriptions.
      - ETA confirmation flow copy.
      - Cash prep amounts and instructions.
    - Support all existing Prime languages.
  - Dependencies: PRIME-READY-01, PRIME-ETA-01, PRIME-CASH-01.
  - Definition of done:
    - All pre-arrival UI renders without missing keys.
    - English copy is polished and friendly.

- [ ] PRIME-COPY-02: Arrival mode i18n
  - Scope:
    - Create `Arrival` i18n namespace with keys for:
      - Check-in QR screen headings.
      - "Show at reception" instructions.
      - "What happens next" bullets.
      - Post-check-in welcome message.
  - Dependencies: PRIME-CHECKIN-01.
  - Definition of done:
    - Arrival mode UI renders without missing keys.
    - Copy is clear and reassuring.

- [ ] PRIME-COPY-03: Routes i18n
  - Scope:
    - Create `Routes` i18n namespace with keys for:
      - Origin names (airports, stations, ports).
      - Transport mode labels.
      - Route warnings and tips.
      - Action button labels.
    - Leverage existing Brikette route translations where possible.
  - Dependencies: PRIME-ROUTE-02.
  - Definition of done:
    - Route planner renders without missing keys.
    - Transport terminology is accurate.

---

## Implementation sequence

```
Phase 0: Security (PRIME-SEC-01 → 02)
    ↓
Phase 1: Foundation (PRIME-PREARRIVAL-01 → 03)
    ↓
Phase 2: Readiness Dashboard (PRIME-READY-01 → 03)
    ↓
Phase 3: Routes (PRIME-ROUTE-01 → 03)  ←──┐
    ↓                                      │
Phase 4: ETA + Cash (PRIME-ETA-01, PRIME-CASH-01 → 02)
    ↓                                      │
Phase 5: Check-in (PRIME-CHECKIN-01 → 03)  │
    ↓                                      │
Phase 6: Find My Stay (PRIME-FIND-01 → 03) │
    ↓                                      │ (parallel OK)
Phase 7: Messaging (PRIME-MSG-01 → 03) ────┘
    ↓
Phase 8: PWA (PRIME-PWA-01 → 03)
    ↓
Phase 9: Copy (PRIME-COPY-01 → 03)
```

Phase 0 (Security) must complete first. Phases 3, 6, 7, and 8 can run in
parallel after Phase 2 completes.

---

## Success metrics

| Metric | Target | Measurement | Implementation |
|--------|--------|-------------|----------------|
| Readiness score avg | >70% | Compute from `checklistProgress` | Query `preArrival` on checkout |
| ETA confirmation rate | >50% | `etaConfirmedAt !== null` | Count in pre-arrival data |
| Cash attestation rate | >60% | `cashPrepared === true` | Count in checklist progress |
| Route planner usage | >30% | `routePlanned === true` | Count in checklist progress |
| Check-in code scanned | >40% | Log staff lookups | Add logging in PRIME-CHECKIN-02 |
| Find-my-stay usage | <10% | API call count | Log in PRIME-FIND-02 |

Note: Metrics are measured from `checklistProgress` booleans, not derived
fields, ensuring consistent tracking.

---

## Risks and mitigations

### Pre-arrival data loss
- **Risk:** Guest clears browser, loses pre-arrival progress.
- **Mitigation:** Data stored in Firebase, survives browser clear.
  Personal link in email allows re-access.

### QR scanning reliability
- **Risk:** Reception lighting or phone quality causes scan failures.
- **Mitigation:** Always show human-readable code as backup.
  Code format (BRK-XXXXX) is easy to type.

### Late booking edge case
- **Risk:** Guest books day-of, no pre-arrival time.
- **Mitigation:** Skip readiness dashboard, go directly to arrival mode.
  Checklist items still available but not required.

### Route data staleness
- **Risk:** Transport schedules change, Brikette data outdated.
- **Mitigation:** Routes link to external providers (Trenitalia, ferry sites).
  Add "verify times before travel" disclaimers.

### Offline check-in
- **Risk:** Guest arrives with no network, can't show QR.
- **Mitigation:** PWA caches code locally (code string only, minimal PII).
  Guest can show cached screen to staff.

### Check-in code collision
- **Risk:** Two guests get same code.
- **Mitigation:** Server-side atomic counter ensures uniqueness.
  Code generation is transactional.

### Enumeration attacks on find-my-stay
- **Risk:** Attacker tries many booking code + name combinations.
- **Mitigation:** Rate limiting (5/15min), generic errors, logging.
  No PII in error responses.

### Shared device PII leakage
- **Risk:** Guest uses shared device, next user sees cached data.
- **Mitigation:** Cache only non-sensitive data, clear on logout,
  TTL expires after checkout, manual clear option.

---

## Resolved questions

1. **City tax / deposit amounts** - City tax from `occupantData.cityTax`.
   Deposit from config (€10 keycard deposit) unless booking-level override.

2. **Staff check-in integration** - Staff marks checked-in in existing PMS.
   Prime reads `isCheckedIn` from booking data (no new write path).

3. **Multi-language routes** - Import translations that exist in Brikette.
   Missing translations fall back to English with "(English)" indicator.

4. **Email service** - Use existing `@acme/email` package with SendGrid.
   Configure Prime-specific sender/templates.

5. **Backend services** - Next.js API routes (already exist in Prime) plus
   existing Firebase Cloud Functions. No new infrastructure.

---

## Open questions

1. **Booking update propagation** - If guest extends stay or changes room,
   how does this propagate to pre-arrival data?
   - Current assumption: Read booking data fresh each time.
   - Check-in code expiry recalculates on each access.

2. **Staff authentication** - Is Firebase Auth with custom claims already
   configured for staff roles?
   - Need to verify `messagingUsers/{uid}/role` structure.
   - May need to add claims-based auth check.

3. **Keycard deposit source** - Is deposit amount stored per-booking or
   is it a fixed config value?
   - Check `UnifiedOccupantData` schema for deposit field.
   - Default to config if not present.

---

## Changelog

- **2026-01-13**: Revised plan based on security review.
  - Added Phase 0 (Security) with RTDB rules and rate limiting.
  - Added Security Architecture section with auth tiers.
  - Changed check-in code to server-side generation with atomic counter.
  - Added bidirectional index for codes (byCode + byUuid).
  - Specified minimal data for staff check-in view.
  - Added rate limiting and logging for find-my-stay.
  - Changed readiness score to compute-on-read (not stored).
  - Added timezone handling with `date-fns-tz`.
  - Specified ETA as HH:MM format (not free-form).
  - Added cache security: non-sensitive only, clear on logout, TTL.
  - Updated metrics to use explicit boolean fields.
  - Added resolved questions section.
- **2026-01-13**: Initial plan created based on gap analysis.

---
Type: Plan
Status: Active
Domain: Prime
Last-reviewed: 2026-01-17
Relates-to charter: none
---

# Prime Guest Portal - Gap Review and Bridge Plan

## Summary
Prime currently ships a minimal shell with staff lookup and placeholder pages, but it does not implement the UUID-based guest portal or the pre-arrival/arrival flow in the updated feature set. This plan records the current state (code truth), maps gaps against the new spec, and defines a staged bridge plan that preserves the no-payments, keycard-only, mobile web constraints.

## Constraints (from updated spec)
- Mobile-only web app (link-based, no account creation).
- One guest = one UUID-based session (tokenized deep link).
- No digital keys; keycards only.
- No in-app payments (city tax + deposit handled offline).
- Pre-arrival engagement depends on messaging (email/WhatsApp/SMS), not push.

## Current State (code truth)
- Landing page only links to find-my-stay and staff lookup: `apps/prime/src/app/page.tsx`.
- Find-my-stay collects surname + booking reference and redirects to the guest portal link: `apps/prime/src/app/find-my-stay/page.tsx`, `apps/prime/functions/api/find-booking.ts`.
- Tokenized guest entry exists via `/g/<token>` redirect and `/api/guest-session` verification gate: `apps/prime/functions/g/[token].ts`, `apps/prime/functions/api/guest-session.ts`, `apps/prime/src/app/g/page.tsx`.
- Guest portal placeholder exists after verification: `apps/prime/src/app/portal/page.tsx`.
- Staff lookup exists, but is protected only by a localStorage PIN stub and the API has no auth gating: `apps/prime/src/app/staff-lookup/page.tsx`, `apps/prime/src/contexts/messaging/PinAuthProvider.tsx`, `apps/prime/functions/api/check-in-lookup.ts`.
- Check-in code generation + lookup endpoints exist in CF Pages Functions: `apps/prime/functions/api/check-in-code.ts`, `apps/prime/functions/api/check-in-lookup.ts`.
- Signage QR page is a static placeholder: `apps/prime/src/app/signage/find-my-stay-qr/page.tsx`.
- Offline page exists but no service worker or cached content: `apps/prime/src/app/offline/page.tsx`.
- Pre-arrival, readiness, route planning, ETA capture, cash preparedness, arrival mode, and keycard status are not implemented.

## Booking data sources (code truth)
- `bookings` table is read directly by CF Pages Functions in Prime:
  `apps/prime/functions/api/find-booking.ts`,
  `apps/prime/functions/api/check-in-lookup.ts`,
  `apps/prime/functions/api/firebase/bookings.ts`.
- Booking records include `bookingRef`, `guestName`, and `occupants` (UUIDs) per the
  Prime functions' type hints; no reception app source files are present under
  `apps/reception/src` to confirm additional schema.
- Guest UUID format from operations: `occ_<13-digit-number>` (example: `occ_1747615362152`).
- A per-guest UUID lookup endpoint exists in Prime (`/api/firebase/bookings`),
  but is unused by the current UI.

## Gap Map (spec vs current)
| Feature area | Spec expectation | Current status | Gap summary |
| --- | --- | --- | --- |
| UUID portal | Tokenized guest link (`/g/<token>`), light verification gate | Missing | Build token issuance, verification, and guest session data model |
| Readiness dashboard | Checklist, readiness score, next action, micro-rewards | Missing | New pre-arrival UI + data model |
| Route planner | Choose origin/mode, step plan, map links, risk flags | Missing | Reuse Brikette how-to-get-here content + planner UI |
| ETA confirmation | 30-min window + method + late flow | Missing | New capture UI + staff surfacing |
| Cash preparedness | City tax + deposit amounts + toggles + reminders | Missing | Use booking data; add pre-arrival cash UI |
| Pre-check-in data | Basic ID info + optional doc upload | Missing | Add intake flow and storage (if compliant) |
| Arrival mode | Show QR + code, cash/ID reminders | Missing | Build arrival home screen + QR generation |
| Keycard status | Issued/replaced/returned info | Missing | Add staff-editable status field |
| Find-my-stay fallback | Booking code + last name -> personal link | Partial | Flow exists but redirects to staff lookup instead of guest portal |
| Staff lookup | Typeable code + QR scan | Partial | UI exists; needs real staff auth + tighter API access |
| Messaging orchestration | Email/WhatsApp/SMS sequences + reminders | Missing | Define triggers + channel integrations |
| Offline essentials | Cache arrival info + key screens | Missing | Add service worker + cached assets |
| No payments / keycards | No in-app payment + no digital keys | Mostly OK | Remove any implied door access flows |

## Plan alignment with prime-pre-arrival-plan
All tasks in `docs/plans/prime-pre-arrival-plan.md` are unimplemented in code,
with the exceptions noted below as partials. The task list is rolled forward
here as the canonical work breakdown, alongside the updated UUID-token portal
requirements that are not covered in the older plan.

## Rolled-forward tasks (from prime-pre-arrival-plan)

| Task | Status (code truth) | Evidence |
| --- | --- | --- |
| PRIME-SEC-01 | Not started | No RTDB rules checked into Prime |
| PRIME-SEC-02 | Partial | KV rate limiting in `apps/prime/functions/api/find-booking.ts` (window/implementation differs) |
| PRIME-PREARRIVAL-01 | Not started | No `apps/prime/src/types/preArrival.ts` or hooks |
| PRIME-PREARRIVAL-02 | Partial | `apps/prime/functions/api/check-in-code.ts` uses booking IDs and random codes |
| PRIME-PREARRIVAL-03 | Not started | No check-in QR component |
| PRIME-READY-01 | Not started | No readiness dashboard UI |
| PRIME-READY-02 | Not started | No checklist UI or data |
| PRIME-READY-03 | Not started | No next-action card |
| PRIME-ROUTE-01 | Not started | No Brikette route imports in Prime |
| PRIME-ROUTE-02 | Not started | No route planner route |
| PRIME-ROUTE-03 | Not started | No route save/actions UI |
| PRIME-ETA-01 | Not started | No ETA capture UI or storage |
| PRIME-CASH-01 | Not started | No cash prep UI |
| PRIME-CASH-02 | Not started | No arrival cash reminder |
| PRIME-CHECKIN-01 | Not started | No arrival mode UI |
| PRIME-CHECKIN-02 | Partial | Staff lookup exists but is not `/checkin/[code]` and lacks auth guard |
| PRIME-CHECKIN-03 | Not started | No post-check-in transition |
| PRIME-FIND-01 | Partial | Find-my-stay UI exists but is not yet a dedicated component |
| PRIME-FIND-02 | Partial | `/api/find-booking` returns redirect URL, but rate limits/logging differ |
| PRIME-FIND-03 | Partial | Signage QR page exists but is placeholder, not QR asset |
| PRIME-MSG-01 | Not started | No messaging triggers |
| PRIME-MSG-02 | Not started | No email helpers |
| PRIME-MSG-03 | Not started | No calendar invite generation |
| PRIME-PWA-01 | Not started | No service worker |
| PRIME-PWA-02 | Not started | No offline caching |
| PRIME-PWA-03 | Not started | No offline indicator/settings |
| PRIME-COPY-01 | Not started | No pre-arrival i18n keys |
| PRIME-COPY-02 | Not started | No arrival-mode i18n keys |
| PRIME-COPY-03 | Not started | No route planner i18n keys |

## Bridge Plan (Epics)
- [ ] PRIME-GAP-01: Guest session tokens and verification
  - Scope: Define guest session model (UUID + token), `/g/<token>` entry route, lightweight verification gate (last name or DOB month), and token issuance from booking ingest or find-my-stay.
  - Dependencies: Booking data source, Firebase RTDB schema updates, security review for token storage.
  - Definition of done: Tokenized link opens a guest portal; sensitive data gated by verification step; tokens can be revoked/expired.
  - Status (code truth): Partial - token issuance and last-name verification exist, but revocation, staff gating, and pre-arrival data wiring remain.

- [ ] PRIME-GAP-02: Readiness dashboard foundation
  - Scope: Add readiness checklist data model, readiness score computation, and a single-screen dashboard with next-best-action card.
  - Dependencies: Guest session foundation, baseline booking data (check-in date, party size).
  - Definition of done: Guests see checklist + score + one action card; state persists per UUID.

- [ ] PRIME-GAP-03: Route planner and saved travel plan
  - Scope: Integrate Brikette how-to-get-here content, build origin/mode picker, map links, and save/share summary.
  - Dependencies: Content reuse decision, localization strategy for Prime.
  - Definition of done: At least 3 common routes work end-to-end; saved plan shows in readiness dashboard.

- [ ] PRIME-GAP-04: ETA confirmation and late arrival handling
  - Scope: ETA window input, travel method, free-text notes, and late check-in instructions.
  - Dependencies: Staff workflow requirements for ETA, storage in booking/pre-arrival data.
  - Definition of done: ETA captured, surfaced in staff lookup, and included in messaging triggers.

- [ ] PRIME-GAP-05: Cash preparedness and policy clarity
  - Scope: City tax + deposit amounts per guest, cash-only copy, readiness toggles, and reminders.
  - Dependencies: Accurate per-booking amounts and party size rules.
  - Definition of done: Cash totals appear on readiness + arrival screens; toggles persist; reminders defined.

- [ ] PRIME-GAP-06: Pre-check-in data capture (optional)
  - Scope: Basic identity fields, optional document upload, and fast-desk confirmation output.
  - Dependencies: Compliance approval for document capture, storage policy.
  - Definition of done: Guest can submit details; staff lookup shows readiness flag (no PII beyond agreed fields).

- [ ] PRIME-GAP-07: Arrival mode + check-in QR/code
  - Scope: Arrival home screen with QR + typeable code, cash/ID reminders, and “what happens next” steps.
  - Dependencies: Check-in code service alignment with guest session tokens.
  - Definition of done: Arrival mode auto-activates on day-of; QR + code resolve to staff lookup.

- [ ] PRIME-GAP-08: Keycard status tracking (info only)
  - Scope: Staff-set keycard status (issued/replaced/returned) and lost card guidance for guest.
  - Dependencies: Staff workflow agreement, data field storage.
  - Definition of done: Guest view shows status + policy; staff lookup can update status.

- [ ] PRIME-GAP-09: Messaging orchestration hooks
  - Scope: Define message triggers (booking, 7d, 48h, day-of), payloads, and channel preferences.
  - Dependencies: Messaging provider integration (email/WhatsApp/SMS).
  - Definition of done: Trigger definitions exist and can be invoked by the booking system.

- [ ] PRIME-GAP-10: Offline essentials and PWA groundwork
  - Scope: Service worker, cached arrival info, and offline fallback for QR/code and address.
  - Dependencies: Asset list and cache policy.
  - Definition of done: Key arrival screen loads without network; offline page links to cached essentials.

## PRIME-GAP-01 Technical Design (v0)
- Token storage: `guestSessionsByToken/{token}` → `{ bookingId, guestUuid, createdAt, expiresAt }`.
- Token issuance: `/api/find-booking` creates/reuses `guestPortalToken` in `bookings/{bookingId}` and writes token record.
- Token expiry: `checkOutDate` + 48h when available, otherwise 30 days from issuance.
- Entry flow: `/g/<token>` redirects to `/g?token=<token>` for static export compatibility.
- Verification: `/api/guest-session` GET validates token; POST checks last name against `bookings/{bookingId}.guestName` before returning minimal session data.
- Client session: `/g` stores token + booking ID + UUID (format `occ_<13-digit-number>`) in localStorage and hands off to `/portal` placeholder.

## Acceptance Criteria
- Guest receives a tokenized link that opens a personal portal without account creation.
- Readiness dashboard, route planner, ETA, and cash prep are functional end-to-end.
- Arrival mode shows QR + typeable code with cash/ID reminders; staff lookup reads the same code.
- No in-app payments and no digital keys; keycard policies are informational only.
- Messaging triggers can be called by the booking system for pre-arrival reminders.

## Risks and Open Questions
- Booking data source and schema (per-guest vs per-booking UUIDs) must be confirmed.
- Staff auth model for lookup endpoints needs a real auth mechanism (current stub is unsafe).
- Document capture legality and data retention policy must be validated before implementation.
- Reusing Brikette route content may require localization or brand adaptation for Prime.

## Out of Scope (for now)
- In-app payments or city tax collection.
- Digital keys or smart locks.
- Full staff app (beyond lightweight lookup).

## Active tasks

See "Bridge Plan (Epics)" section above for the full task list (PRIME-GAP-01 through PRIME-GAP-10).

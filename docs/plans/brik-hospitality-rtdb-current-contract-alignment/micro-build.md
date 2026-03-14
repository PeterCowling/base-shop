---
Type: Micro-Build
Status: Complete
Created: 2026-03-13
Last-updated: 2026-03-13
Feature-Slug: brik-hospitality-rtdb-current-contract-alignment
Execution-Track: mixed
Deliverable-Type: multi-deliverable
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260313131601-0001
Related-Plan: none
---

# Brik Hospitality RTDB Current Contract Alignment Micro-Build

## Scope
- Change: standardize how Prime, Reception, booking email, and inbox guest matching handle the live Firebase RTDB contract without changing the underlying data shape before the 2026 operating season.
- Non-goals: any root-level RTDB reshape, any backfill or migration, any stay-model redesign, or any work that depends on the hostel being closed.

## Execution Contract
- Affects:
  - `packages/lib/src/hospitality/index.ts`
  - `packages/lib/package.json`
  - `apps/prime/src/hooks/dataOrchestrator/useUnifiedBookingData.ts`
  - `apps/prime/src/hooks/dataOrchestrator/useOccupantDataSources.ts`
  - `apps/prime/src/hooks/pureData/useFetchLoans.ts`
  - `apps/prime/src/lib/preArrival/keycardStatus.ts`
  - `apps/prime/src/hooks/dataOrchestrator/useGuestBookingSnapshot.ts`
  - `apps/prime/functions/api/guest-booking.ts`
  - `apps/prime/src/app/(guarded)/late-checkin/page.tsx`
  - `apps/prime/src/app/(guarded)/main-door-access/page.tsx`
  - `apps/prime/src/app/(guarded)/overnight-issues/page.tsx`
  - `apps/reception/package.json`
  - `apps/reception/src/hooks/mutations/useAddGuestToBookingMutation.ts`
  - `apps/reception/src/hooks/mutations/useLoansMutations.ts`
  - `apps/reception/src/hooks/mutations/useDeleteGuestFromBooking.ts`
  - `apps/reception/src/hooks/mutations/useArchiveCheckedOutGuests.ts`
  - `apps/reception/src/services/useBookingEmail.ts`
  - `apps/reception/src/lib/inbox/guest-matcher.server.ts`
  - queue follow-on reference: `docs/plans/brik-hospitality-rtdb-post-season-restructure/fact-find.md`
- Acceptance checks:
  - A single documented current-shape RTDB contract exists for the live hospitality roots consumed by Prime, Reception, booking email, and inbox guest matching.
  - Known live contract drifts are removed or explicitly normalized, starting with `loans` path usage and `roomsByDate` naming.
  - Prime guest-critical reads favor the existing server snapshot path where that surface already exists, rather than adding more direct RTDB fan-out.
  - Launch-season work remains additive and low-risk: no root data migration, no backfill, no schema cutover.
- Validation commands:
  - `pnpm --filter @apps/prime typecheck`
  - `pnpm --filter @apps/prime lint`
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note: if alignment introduces regressions or expands into schema change territory, revert the bounded code/doc changes and keep the current live RTDB handling in place until the post-season redesign window.

## Outcome Contract
- **Why:** The hostel is close to opening, so a root-level Firebase data migration is too risky. We still need Prime, Reception, booking email, and inbox guest matching to consume the live RTDB shape in the same way, remove known contract drifts, and reduce operational risk during launch season.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Prime, Reception, booking email, and inbox guest matching use one agreed current-shape RTDB contract; the known live path drifts are removed; and Prime guest-critical flows rely on the server snapshot pattern wherever that path already exists.
- **Source:** operator

## Current-Shape RTDB Contract
- `occupantIndex/{occupantId}`: Prime reverse lookup from guest token/session identity to booking reference.
- `bookings/{bookingRef}/{occupantId}`: canonical active occupant booking record.
- `guestsDetails/{bookingRef}/{occupantId}`: contact and profile details tied to the active booking.
- `guestByRoom/{occupantId}`: allocated room snapshot for the occupant.
- `financialsRoom/{bookingRef}`: booking-level financial state.
- `preorder/{occupantId}`: meal-order selections keyed by occupant.
- `cityTax/{bookingRef}/{occupantId}`: occupant city-tax state within a booking.
- `bagStorage/{occupantId}`: bag-drop state for the occupant.
- `completedTasks/{occupantId}`: Prime quest/checklist completion state.
- `loans/{bookingRef}/{occupantId}/txns/{transactionId}`: live loan transactions. Reception is the source of truth for the shape and Prime must read this nested path, not `loans/{occupantId}`.
- `activities/{occupantId}` and `activitiesByCode/{code}/{occupantId}/{activityId}`: occupant activity logs and code indexes.
- `checkins/{date}/{occupantId}` and `checkouts/{date}/{occupantId}`: date-indexed stay state.
- `guestsByBooking/{occupantId}`: occupant-to-booking lookup used operationally by Reception.
- `primeRequests/byGuest/{occupantId}` and `primeRequests/byId/{requestId}`: guest request indexes consumed by Prime server snapshots.
- `roomsByDate/{date}/index_{roomNumber}/{roomNumber}/guestIds`: canonical room-occupancy index. `roomByDate/*` is legacy drift and should not be used for launch-season writes or cleanup.

## Build Evidence
- Shared helper added at `packages/lib/src/hospitality/index.ts` and exported via `@acme/lib/hospitality`, so Prime and Reception now consume the same current-shape RTDB path builders and loan-type normalizer.
- Prime now reads loans from `loans/{bookingRef}/{occupantId}` and normalizes live Reception transaction types (`Loan`, `Refund`, `No_Card`) instead of assuming a legacy lowercase-only shape.
- Reception add/delete/archive guest flows now use `roomsByDate/*` as the canonical occupancy root for cleanup and guest-ID updates, removing the live `roomByDate/*` drift from active mutation paths.
- Reception booking email and inbox guest matching now build Firebase paths from the shared current-shape contract instead of ad hoc strings.
- Prime guarded pages that only need booking snapshot fields now use `useGuestBookingSnapshot()` rather than the wider direct RTDB fan-out path: `late-checkin`, `main-door-access`, and `overnight-issues`.
- Validation:
  - `pnpm --filter @acme/lib build`
  - `pnpm --filter @acme/lib lint`
  - `pnpm --filter @apps/prime typecheck`
  - `pnpm --filter @apps/prime lint` passed with 4 existing `ds/no-hardcoded-copy` warnings in `apps/prime/functions/api/guest-booking.ts`
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint` passed with 14 existing warnings in unrelated Reception files
- Tests were not run locally because repo policy keeps Jest/e2e execution in CI only.

---
Type: Build-Record
Status: Complete
Feature-Slug: reception-sort-utils-dedup
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Sort Utils Dedup

## Outcome Contract

- **Why:** Verbatim copied sort helpers create silent maintenance drift between check-in and check-out flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `parseAllocatedRoomNumber` and `getBookingMinAllocatedRoom` exist once and are imported by both sort files.
- **Source:** operator

## What Was Built

No code change was required in this cycle. Repo audit confirmed the shared extraction already exists in `apps/reception/src/utils/sortHelpers.ts`, and both `sortCheckins.ts` and `sortCheckouts.ts` already import `parseAllocatedRoomNumber` and `getBookingMinAllocatedRoom` from that module. This cycle completed the ideas-loop closure for the already-implemented micro-build.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Batch validation run during micro-build closure cycle |
| `pnpm --filter @apps/reception lint` | Pass with warnings | Existing unrelated warnings only; no errors |

## Validation Evidence

- Shared sort helpers already present in `apps/reception/src/utils/sortHelpers.ts`
- `sortCheckins.ts` imports both helpers from the shared module
- `sortCheckouts.ts` imports both helpers from the shared module

## Scope Deviations

None.

---
Type: Build-Record
Status: Complete
Feature-Slug: reception-keycard-icon-dedup
Completed-date: 2026-03-09
artifact: build-record
---

# Build Record: Reception Keycard Icon Dedup

## Outcome Contract

- **Why:** Duplicated icon mapping means new deposit types or icon tweaks must be applied in multiple places and can drift.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `getKeycardIcon` exists once in a shared utility and is imported by both CheckoutTable and BookingRow.
- **Source:** operator

## What Was Built

No code change was required in this cycle. Repo audit confirmed the shared utility already exists at `apps/reception/src/utils/keycardIcon.ts`, and both `CheckoutTable.tsx` and `BookingRow.tsx` already import `getKeycardIcon` from that shared module. This cycle completed the loop bookkeeping for the already-implemented micro-build.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/reception typecheck` | Pass | Batch validation run during micro-build closure cycle |
| `pnpm --filter @apps/reception lint` | Pass with warnings | Existing unrelated warnings only; no errors |

## Validation Evidence

- Shared `getKeycardIcon` already present in `apps/reception/src/utils/keycardIcon.ts`
- `CheckoutTable.tsx` imports the shared utility
- `BookingRow.tsx` imports the shared utility

## Scope Deviations

None.

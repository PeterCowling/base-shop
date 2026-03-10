---
Type: Micro-Build
Status: Archived
Created: 2026-03-09
Last-updated: 2026-03-09
Feature-Slug: reception-sort-utils-dedup
Execution-Track: code
Deliverable-Type: code-change
artifact: micro-build
Dispatch-ID: IDEA-DISPATCH-20260309100000-0005
Related-Plan: none
---

# Reception Sort Utils Dedup Micro-Build

## Scope
- Change:
  - Extract `parseAllocatedRoomNumber` and `getBookingMinAllocatedRoom` into a shared sorting utility and import them from both current sort modules.
  - Only extract a broader generic helper if it stays obviously additive.
- Non-goals:
  - Resorting bookings differently.
  - Reworking the full check-in/check-out sorting pipeline.

## Execution Contract
- Affects:
  - `apps/reception/src/utils/sortCheckins.ts`
  - `apps/reception/src/utils/sortCheckouts.ts`
  - One new shared sort utility module under `apps/reception/src/utils/`
- Acceptance checks:
  - `parseAllocatedRoomNumber` exists once.
  - `getBookingMinAllocatedRoom` exists once.
  - Both sort modules import the shared helpers.
- Validation commands:
  - `pnpm --filter @apps/reception typecheck`
  - `pnpm --filter @apps/reception lint`
- Rollback note:
  - Revert the helper extraction and restore the local copies.

## Outcome Contract
- **Why:** Verbatim copied sort helpers create silent maintenance drift between check-in and check-out flows.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** `parseAllocatedRoomNumber` and `getBookingMinAllocatedRoom` exist once and are imported by both sort files.
- **Source:** operator

---
Type: Build-Record
Status: Complete
Feature-Slug: brikette-funnel-test-hardening
Completed-date: 2026-03-02
artifact: build-record
---

# Build Record: Brikette Funnel Test Hardening

## Outcome Contract
- **Why:** Funnel breakage risk was concentrated in shared booking controls and handoff/resilience paths with no direct tests.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** Add missing direct tests for shared booking controls, recovery fallback behavior, apartment and sticky CTA URL wiring, and booking resilience journeys, then pass scoped `typecheck` and `lint` gates.
- **Source:** operator

## What Was Built
Implemented five dispatch-targeted testing artifacts: direct unit contracts for `BookingCalendarPanel`, direct hook coverage for `useRecoveryResumeFallback`, apartment handoff URL matrix tests, room-detail sticky CTA URL matrix tests, and a new resilience Playwright spec covering sold-out, API-failure, and homepage-widget funnel traversal. During validation, fixed two blockers (`import/first` placement in new apartment test and translation default literal lint issue in `SocialProofSection`) plus a selector mismatch and one e2e locator syntax issue introduced in newly added tests.

## Tests Run
| Command | Result | Notes |
|---|---|---|
| `pnpm --filter @apps/brikette typecheck` | Pass | No errors |
| `pnpm --filter @apps/brikette lint` | Pass | 0 errors, warnings only (pre-existing) |
| `pnpm --filter @apps/brikette exec eslint e2e/availability-resilience.spec.ts` | Pass | File-level lint clean |

## Validation Evidence
### TASK-01
- TC-01/02/03: `apps/brikette/src/test/components/booking-calendar-panel.test.tsx` covers clamp, callbacks, and render contracts.

### TASK-02
- TC-01/02/03: `apps/brikette/src/hooks/useRecoveryResumeFallback.test.ts` covers expired, valid, and prompt-return branches.

### TASK-03
- TC-01/02/03: `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx` asserts all NR/Flex x 2/3 pax mappings.

### TASK-04
- TC-01/02: `apps/brikette/src/test/components/room-detail-sticky-url-matrix.test.tsx` asserts multi-room sticky URL mappings.

### TASK-05
- TC-01/02/03: scoped gates passed and `apps/brikette/e2e/availability-resilience.spec.ts` linted clean after syntax fix.

## Scope Deviations
- Included small lint/test-hardening edits in touched files to clear validation blockers:
  - `apps/brikette/src/components/landing/SocialProofSection.tsx`
  - `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx`
  - `apps/brikette/src/test/components/booking-calendar-panel.test.tsx`
  - `apps/brikette/e2e/availability-resilience.spec.ts`

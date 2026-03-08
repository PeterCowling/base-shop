---
Type: Plan
Status: Complete
Domain: Brikette/UX
Last-reviewed: 2026-03-02
Feature-Slug: brikette-calendar-hydration-contrast-fixes
Relates-to charter: docs/business-os/business-os-charter.md
---

# Plan: Brikette Calendar Hydration + Dorm Contrast

## Task 01 — IMPLEMENT
- ID: BCHC-01
- Status: Complete (2026-03-02)
- Confidence: 90
- Execution-Skill: lp-do-build
- Affects:
  - apps/brikette/src/components/booking/DateRangePicker.tsx
  - apps/brikette/src/components/booking/BookingCalendarPanel.tsx
- Acceptance:
  - No hydration mismatch repro on `/en/book` from calendar selected/min/summary branch divergence.
  - Shared calendar/pax layout shows increased spacing beneath calendar on mobile.
- Build Evidence:
  - `DateRangePicker` now gates selected-range rendering until mount (`stableSelected`) to keep SSR/first client render aligned.
  - `BookingCalendarPanel` spacing increased from `space-y-3` to `space-y-6` on mobile.
  - Playwright browser verification reports `HYDRATION_ERRORS=0` for:
    - `http://localhost:3012/en/book`
    - `http://localhost:3012/en/book?checkin=2026-03-25&checkout=2026-03-27&pax=1`

## Task 02 — IMPLEMENT
- ID: BCHC-02
- Status: Complete (2026-03-02)
- Confidence: 90
- Execution-Skill: lp-do-build
- Depends-On: BCHC-01
- Affects:
  - packages/ui/src/molecules/RoomFilters.tsx
  - packages/ui/src/organisms/StickyBookNow.tsx
  - packages/ui/src/organisms/DealsPage.tsx
  - apps/brikette/src/components/rooms/RoomFilters.tsx
  - apps/brikette/src/components/booking/RecoveryQuoteCapture.tsx
  - apps/brikette/src/components/header/NotificationBanner.tsx
  - apps/brikette/src/components/rooms/detail/RoomDetailSections.tsx
- Acceptance:
  - Contrast-related token updates are present in source and picked up by runtime (no stale dist classes).
- Build Evidence:
  - Rebuilt `@acme/ui` (`pnpm --filter @acme/ui build`) so Brikette consumes fresh `dist` outputs for token-class changes.
  - Existing token updates in `packages/ui/src/*` and `apps/brikette/src/*` are now reflected in rebuilt Brikette output.

## Task 03 — IMPLEMENT
- ID: BCHC-03
- Status: Complete (2026-03-02)
- Confidence: 90
- Execution-Skill: lp-do-build
- Depends-On: BCHC-02
- Affects:
  - docs/audits/contrast-sweeps/2026-03-02-brikette-dorms-routes-stabilized-clean/contrast-uniformity-report.md
  - docs/audits/contrast-sweeps/2026-03-02-brikette-dorms-routes-stabilized-clean/sweep-summary.json
- Acceptance:
  - `@acme/ui` build then Brikette build succeeds.
  - `@acme/ui` + `@apps/brikette` typecheck/lint pass.
  - Stabilized rerun for `/en/dorms` routes reports zero color-contrast failures.
- Build Evidence:
  - Validation passed with warnings-only:
    - `pnpm --filter @acme/ui typecheck`
    - `pnpm --filter @acme/ui lint`
    - `pnpm --filter @apps/brikette typecheck`
    - `pnpm --filter @apps/brikette lint`
  - Production build succeeded:
    - `pnpm --filter @apps/brikette build`
  - Stabilized deterministic rerun artifact:
    - `docs/audits/contrast-sweeps/2026-03-02-brikette-dorms-routes-stabilized-clean/sweep-summary.json` with `testedEntries=120`, `failuresCount=0`.

---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Brikette/UX
Last-reviewed: 2026-03-02
Feature-Slug: brikette-calendar-hydration-contrast-fixes
Execution-Track: code
Deliverable-Type: code-change
Primary-Execution-Skill: lp-do-build
Relates-to charter: docs/business-os/business-os-charter.md
---

# Fact-Find: Brikette Calendar Hydration + Dorm Contrast

## Access Declarations
- None

## Routing Header
```yaml
Outcome: planning
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
```

## Evidence
- Hydration mismatch reported on `/en/book` points to [`apps/brikette/src/components/booking/DateRangePicker.tsx`](../../../apps/brikette/src/components/booking/DateRangePicker.tsx) where SSR/client can diverge for selected range-derived attributes (`min`, summary branch, DayPicker selected state).
- Shared calendar component already exists and is consumed across booking routes via [`apps/brikette/src/components/booking/BookingCalendarPanel.tsx`](../../../apps/brikette/src/components/booking/BookingCalendarPanel.tsx), used by:
  - [`apps/brikette/src/components/booking/BookPageSections.tsx`](../../../apps/brikette/src/components/booking/BookPageSections.tsx)
  - [`apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx`](../../../apps/brikette/src/components/rooms/detail/RoomDetailBookingSections.tsx)
  - [`apps/brikette/src/components/landing/BookingWidget.tsx`](../../../apps/brikette/src/components/landing/BookingWidget.tsx)
  - [`apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`](../../../apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx)
  - [`apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`](../../../apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx)
- Spacing request is between calendar and next controls in shared panel; this belongs in `BookingCalendarPanel` layout classes.
- Contrast residue is tied to stale `@acme/ui` dist consumption and token usage on selected filter/CTA text classes changed in source under `packages/ui/src/*`; must rebuild `@acme/ui` then Brikette before re-audit.

## Simulation Trace
| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| `/en/book` hydration path | Yes | SSR/client selected-range divergence | Yes |
| Shared calendar layout reuse | Yes | Mobile vertical spacing too tight | Yes |
| Dorm routes contrast verification | Yes | Prior sweeps include noisy false positives; need stabilized rerun | Yes |

## Evidence Gap Review
### Gaps Addressed
- Confirmed single reusable booking calendar panel is already centralized.
- Confirmed hydration-risk surface and exact component.
- Confirmed required build order to avoid stale `@acme/ui` output.

### Confidence Adjustments
- Implementation confidence: 90 (targeted component fixes, shared usage, reproducible checks).

### Remaining Assumptions
- Stabilized rerun uses deterministic accessibility checks (`axe` color-contrast) and excludes known noisy heuristics from earlier sweep artifacts.

## Task Proposal
1. Harden `DateRangePicker` hydration determinism by making first SSR/client render state-aligned.
2. Increase shared panel vertical spacing below calendar on mobile.
3. Rebuild `@acme/ui` then Brikette; rerun lint/typecheck for changed packages.
4. Run stabilized dorm-route contrast rerun and persist a clean report artifact.

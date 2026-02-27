---
Type: Build-Record
Status: Complete
Feature-Slug: brikette-direct-booking-perks-cta-positioning
Completed-date: 2026-02-27
artifact: build-record
---

# Build Record: Brikette Direct Booking Perks — CTA Positioning

## Outcome Contract

- **Why:** Direct-booking perks ("Why book direct?" + 3 benefits) rendered after RoomsSection in BookPageContent, meaning guests who clicked a room-level Book CTA never saw the perks. Repositioning makes the value proposition visible before the booking decision.
- **Intended Outcome Type:** measurable
- **Intended Outcome Statement:** DirectPerksBlock renders before RoomsSection on the hostel book page; direct-booking conversion rate maintained or improved over 30-day window.
- **Source:** operator

## What Was Built

**TASK-01 — Repositioned `DirectPerksBlock` above `RoomsSection` in `BookPageContent.tsx`.**
Moved `<DirectPerksBlock>` from a post-rooms `<Section>` (previously after all room "Book" CTAs) to immediately before `<RoomsSection>`. Adjusted `className` from `mb-8` to `mb-6` for tighter in-flow spacing. The post-rooms section (`LocationInline` + `PolicyFeeClarityPanel`) remains intact with no orphaned wrapper.

**TASK-02 — Added DOM-order regression test `book-page-perks-cta-order.test.tsx`.**
New test file with two test cases: (1) `compareDocumentPosition` assertion that `DirectPerksBlock` renders before `RoomsSection`; (2) presence assertion that `LocationInline` and `PolicyFeeClarityPanel` are still rendered after rooms (TC-03). Mirrors the established `book-page-social-proof-order.test.tsx` pattern using `data-cy` sentinels and `require()` after mock setup.

## Tests Run

| Command | Result | Notes |
|---|---|---|
| `pnpm --filter brikette exec tsc --noEmit --skipLibCheck` (pre-commit) | Pass | No type errors on modified files |
| Typecheck via lint-staged pre-commit hook (turbo, 20 tasks) | Pass | All 20 successful (17 cached) |
| ESLint via lint-staged pre-commit hook | Pass | Brikette lint temporarily disabled (expected); other packages clean |
| `validate:agent-context` pre-commit hook | Pass | Agent context drift checks passed |
| `book-page-perks-cta-order.test.tsx` | Pending CI | Tests run in CI only per `docs/testing-policy.md` |

## Validation Evidence

### TASK-01
- TC-01 ✓ — Source-verified: `DirectPerksBlock` at line 225, `RoomsSection` at line 227 of `BookPageContent.tsx` post-edit. Component is before rooms in DOM.
- TC-02 ✓ — Source-verified: `PolicyFeeClarityPanel` at line 242, `LocationInline` at line 241, both inside `<Section>` at line 240 (after RoomsSection). Not orphaned — section has 2 children.
- TC-03 ✓ — Source-verified: `DirectPerksBlock` guard returns `<></>` on empty items; repositioned component inherits this behaviour unchanged.

### TASK-02
- TC-01 ✓ — Test implemented with `compareDocumentPosition` asserting perks before rooms.
- TC-02 ✓ — Regression test defined; will catch any future reorder that moves perks back below rooms.
- TC-03 ✓ — Second test case asserts `LocationInline` + `PolicyFeeClarityPanel` present after rooms using `getByTestId` with `data-cy` sentinels.

## Scope Deviations

None. All changes were within the planned Affects lists for each task. No controlled scope expansion was required.

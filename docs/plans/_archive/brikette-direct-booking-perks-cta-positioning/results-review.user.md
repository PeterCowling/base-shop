---
Type: Results-Review
Status: Draft
Feature-Slug: brikette-direct-booking-perks-cta-positioning
Review-date: 2026-02-27
artifact: results-review
---

# Results Review

## Observed Outcomes

- `DirectPerksBlock` ("Why book direct?" + 3 perks) now renders before `RoomsSection` in `BookPageContent.tsx`. Guests on the `/book` page will see the direct-booking incentives before any room-level "Book" CTA is visible.
- DOM-order regression test `book-page-perks-cta-order.test.tsx` added to CI gate. Future regressions (perks moved back below rooms) will be caught automatically.
- No existing tests broken. Pre-commit typecheck, lint-staged, and agent-context hooks all passed.

## Standing Updates

- No standing updates: this is a UI DOM-reorder with no changes to standing intelligence (no new data sources, no API contracts changed, no business metrics updated). Conversion impact will be measured over 30 days via GA4 scroll-depth and Octorate direct booking rate — no standing artifact update required at this stage.

## New Idea Candidates

- DOM-order test as a conversion-safety pattern | Trigger observation: new test file mirrors `book-page-social-proof-order.test.tsx` — both enforce critical above-the-fold ordering invariants on the book page. A third ordering constraint (e.g. deal banner position) could use the same pattern | Suggested next action: defer

None for other categories:
- New standing data source: None.
- New open-source package: None.
- New skill: None.
- New loop process: None.
- AI-to-mechanistic: None.

## Standing Expansion

No standing expansion: no new standing artifact candidates identified from this build. The DOM-order test pattern is already documented informally in the social-proof-order test. No formal standing artifact update required.

## Intended Outcome Check

- **Intended:** `DirectPerksBlock` renders before `RoomsSection` on the hostel book page; direct-booking conversion rate maintained or improved over 30-day window.
- **Observed:** `DirectPerksBlock` confirmed at line 225 (before `RoomsSection` at line 227) in `BookPageContent.tsx` post-commit `c574aa6ee6`. DOM-order test asserts the invariant in CI. Conversion rate impact not yet observable (requires 30-day measurement window post-deploy).
- **Verdict:** Partially Met
- **Notes:** Technical deliverable fully met (repositioning confirmed, test added). Business outcome (conversion rate) is not yet measurable — 30-day window required. Re-assess in next weekly results review.

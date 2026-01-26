---
Type: Plan
Status: Active
Domain: UI
Relates-to charter: Brikette UX
Created: 2026-01-26
Last-reviewed: 2026-01-26
Last-updated: 2026-01-26
Overall-confidence: 91%
---

# How To Get Here UX Improvement Plan

## Summary

Improve the user experience of the `/[lang]/how-to-get-here` page in the Brikette app. The page helps visitors find transportation options to reach a hostel in Positano. Current issues include a non-functional RoutePicker wizard, duplicated filter controls, buried critical information, and unclear mobile UX patterns.

## Success Signals (What “Good” Looks Like)

- First-time visitors can answer 2 questions and land on a recommended route in under 10 seconds.
- The page has one obvious “edit filters” entry point (toolbar), and one obvious “jump to” entry point (toolbar).
- Critical “don’t get stuck” warnings are visible before the route list on mobile.
- Jump-to and RoutePicker scrolling never lands content under the sticky toolbar.
- Empty results are recoverable without opening the filters dialog.
- Changes are accessible (keyboard, focus, touch targets) and shareable (URL reflects state).

## Audit Updates (2026-01-26)

Concrete repo findings that reduce implementation risk:

- `HowToGetHereIndexContent.tsx` stores `selection` but doesn’t use it yet; it already contains `pickBestLink()` + scoring helpers ready to be called.
- `RouteCardGroup.tsx` already supports highlighting via `highlightedRouteSlug` and renders anchor targets with `id="route-${route.href}"` for scroll targeting.
- `DestinationSections.tsx` already supports `suggestedFixes` in the empty state; `HowToGetHereIndexContent.tsx` currently always passes `highlightedRouteSlug={null}` and never passes `suggestedFixes`.
- `useDestinationFilters.ts` already validates and persists `mode`, `direction`, and `place` in the URL via Next router `replace()`.
- `BeforeYouTravel.tsx` contains the key warning content (stairs, ferries/cancellations, late arrivals), but it currently has no stable page anchor for “jump to tips”.

## Milestones

| Milestone | Focus | Tasks | Effort | CI |
|-----------|-------|-------|--------|-----|
| 1 | RoutePicker actually scrolls + highlights (and never hides under sticky toolbar) | TASK-01 | M | **92%** |
| 2 | De-duplicate filter affordances + actionable empty-state suggestions | TASK-02, TASK-06 | S | **91%** |
| 3 | Surface "Before you travel" warnings earlier + connect late-night selection to recommendations | TASK-03 | S | **90%** |
| 4 | Direction toggle discoverability + jump-to grouping/separators | TASK-05, TASK-07 | S | **90%** |
| 5 | Mobile toolbar height reduction (collapse jump-to behind disclosure) | TASK-04 | M | **90%** |

**Effort key:** S = ~1-2 hours, M = ~2-4 hours

## Fact-Find Reference

UX assessment conducted on 2026-01-26. Key findings:

1. **RoutePicker is non-functional**: Selection state is captured but never used to scroll or highlight routes
2. **Filter controls duplicated** in 4 places (RoutePicker, header button, toolbar button, chips)
3. **Critical travel info buried** at page bottom (BeforeYouTravel section)
4. **Sticky toolbar** consumes significant mobile viewport space
5. **Direction toggles** on route cards are subtle and easily missed
6. **Empty state** doesn't provide suggested fixes despite prop support existing

## Tasks

### TASK-01: Wire up RoutePicker to scroll + highlight best route (and keep scroll offset correct)

- **Affects:** `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`
- **CI:** 92%
  - Implementation: 92% — `pickBestLink()` and `highlightedRouteSlug` plumbing already exist; work is mainly wiring + scroll correctness.
  - Approach: 92% — aligns with the RoutePicker promise: “jump you to the best match and highlight it”.
  - Impact: 92% — contained to this page; improves the primary “I’m arriving from X” flow.
- **Acceptance:**
  - When user submits RoutePicker form, page scrolls to the best matching route card
  - Best route card receives highlight styling (ring)
  - Scroll lands with the route card fully visible (never hidden under sticky header/toolbar)
  - URL remains shareable (existing filter params preserved; optional: add selection params as follow-up if desired)
  - Works for all arrival times and preferences
- **Implementation Notes (to remove common edge-case failures):**
  - Use the existing anchor IDs in `RouteCardGroup` (`route-${route.href}`) as the scroll target.
  - **Scroll offset strategy (locked):** Compute offset in JS using the toolbar's measured height from `useHeaderStickyOffset`, then call `element.scrollIntoView({ behavior: 'smooth', block: 'start' })` followed by `window.scrollBy(0, -offset)`. This avoids needing to touch CSS across multiple files and reuses the existing offset hook.
  - Ensure focus management after scroll (e.g., move focus to the highlighted card header for keyboard users, without stealing focus on mobile).
- **Tests:**
  - Unit test `pickBestLink()` with various inputs (arrival times, preferences) to verify scoring logic.
  - Integration test (Cypress or Playwright): submit RoutePicker → verify scroll position and highlight class applied.

### TASK-02: Remove duplicate "Edit filters" button from HeaderSection

- **Affects:** `apps/brikette/src/routes/how-to-get-here/components/HeaderSection.tsx`
- **CI:** 91%
  - Implementation: 95% — remove redundant controls; ensure no layout regressions.
  - Approach: 90% — toolbar already provides filter access; duplication increases cognitive load.
  - Impact: 90% — isolated change, clearer hierarchy.
- **Acceptance:**
  - "Edit filters" button and hint text removed from header
  - RoutePicker remains as the primary interaction in header
  - Toolbar retains filter access
  - URL share hint copy appears in only one place (pick: RoutePicker OR toolbar/dialog copy)
- **Tests:**
  - Update existing `HeaderSection.test.tsx` to remove assertions for the deleted button.
  - Visual regression snapshot if available.

### TASK-03: Add key travel warnings to IntroHighlights + late-night taxi emphasis

- **Affects:** `apps/brikette/src/routes/how-to-get-here/components/IntroHighlights.tsx`, `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`
- **CI:** 90%
  - Implementation: 90% — add a 4th card + responsive grid update + conditional emphasis styling.
  - Approach: 90% — the warnings already exist in `BeforeYouTravel`; this is "surface earlier, link deeper". Late-night emphasis connects RoutePicker selection to actionable recommendation.
  - Impact: 90% — improves "don't get stuck" comprehension on mobile without changing route content.
- **Acceptance:**
  - New "Travel tips" highlight card added with key warnings (stairs, ferry cancellations)
  - Card links to full BeforeYouTravel section via stable anchor (`#before-you-travel`)
  - Add `id="before-you-travel"` to `BeforeYouTravel` section wrapper
  - Layout remains balanced across breakpoints (e.g., `md:grid-cols-2 lg:grid-cols-4`)
  - Card copy is concise (2 bullets max) and does not introduce new factual claims
  - When user selects "late-night" in RoutePicker, taxi card receives visual emphasis (ring or background highlight)
  - Pass `isLateNight` prop from `HowToGetHereIndexContent` to `IntroHighlights` based on selection state
- **Tests:**
  - Unit test `IntroHighlights` renders 4 cards (or 3 + conditional 4th).
  - Unit test taxi card receives emphasis class when `isLateNight={true}`.

### TASK-04: Collapse toolbar jump-to nav on mobile by default

- **Affects:** `apps/brikette/src/routes/how-to-get-here/components/HowToToolbar.tsx`
- **CI:** 90%
  - Implementation: 90% — contained, mostly UI state + responsive rendering.
  - Approach: 90% — choose a single, accessible pattern that reduces default height without removing functionality.
  - Impact: 90% — significant mobile UX win; low risk to desktop behavior.
- **Decision (locked):** Use a disclosure pattern on mobile (`<button aria-expanded>` toggles a collapsible "Jump to" row). Keep the current always-visible horizontal nav on `lg+`.
- **Acceptance:**
  - Mobile: jump-to nav collapsed by default, expandable on demand
  - Desktop: remains visible as horizontal scroll
  - Filter chips and count always visible
  - Opening "Jump to" does not push content under the sticky toolbar (use the same offset strategy as TASK-01)
- **Hydration note:** Initialize disclosure state based on viewport width in a `useEffect` to avoid SSR mismatch. Server renders expanded; client collapses on mobile after hydration.
- **Tests:**
  - Unit test disclosure toggle updates `aria-expanded` correctly.
  - Visual regression test at mobile and desktop breakpoints.

### TASK-05: Make route card direction toggle more prominent

- **Affects:** `apps/brikette/src/routes/how-to-get-here/components/RouteCardGroup.tsx`
- **CI:** 90%
  - Implementation: 90% — adjust classes and layout; no data-model changes.
  - Approach: 90% — current toggles look like secondary chips; they need clearer affordance + bigger targets.
  - Impact: 90% — contained; improves discoverability for "from hostel" content.
- **Acceptance:**
  - Direction toggle buttons have larger touch targets (min 44px)
  - Visual distinction between active/inactive states improved
  - Toggle positioned more prominently (e.g., as a segmented control aligned with the title row)
  - Keyboard focus is obvious; `aria-pressed` remains correct
- **Tests:**
  - Unit test toggle buttons have `min-h-11 min-w-11` (44px) classes.
  - Accessibility test `aria-pressed` toggles correctly on click.

### TASK-06: Implement suggested fixes in empty state

- **Affects:** `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`
- **CI:** 91%
  - Implementation: 92% — `DestinationSections` already supports `suggestedFixes`; we only need to compute and pass them.
  - Approach: 90% — prioritize predictable, reversible suggestions over "smart" guesses.
  - Impact: 90% — reduces dead-ends and support burden.
- **Acceptance:**
  - When filters produce no results, suggest removing specific filters
  - Suggestions are actionable buttons that modify filter state
  - At least 2-3 relevant suggestions shown
  - Suggestions are ordered by highest-likelihood fix (remove the most specific filter first)
- **Tests:**
  - Unit test `computeSuggestedFixes()` helper returns correct suggestions for various filter combinations.
  - Integration test: apply filters that yield 0 results → verify suggestion buttons appear and clicking one clears the appropriate filter.

### TASK-07: Add visual separators to jump-to navigation

- **Affects:** `apps/brikette/src/routes/how-to-get-here/components/HowToToolbar.tsx`
- **CI:** 90%
  - Implementation: 92% — add separators + (optional) headings; no business logic changes.
  - Approach: 90% — reduces scanning cost when the jump-to list is long.
  - Impact: 90% — low risk, high clarity.
- **Acceptance:**
  - Destinations grouped visually (Amalfi, Naples, Sorrento, etc.)
  - Utility sections (Rome, Experiences) visually separated
  - Separators are subtle (small dot or increased gap)
- **Tests:**
  - Snapshot test jump-to nav renders separator elements between groups.
  - Accessibility: separators are `aria-hidden` or use `role="separator"`.

## Additional Ideas (Backlog / Optional)

Ideas worth considering if we want more UX lift without expanding scope unpredictably:

- Add a persistent “Your selection” summary chip row (e.g., “From Naples · Evening · Cheapest”) that can be cleared with one tap.
- Add per-section counts to Jump-to items (e.g., “Naples (6)”) using existing data already computed for filtering.
- Add a “Skip to routes” link for keyboard/screen-reader users after the header.
- Add a lightweight analytics event for RoutePicker submit + whether a route card was clicked afterward (to validate that the wizard is helping).

## Patterns to Follow

- Existing filter state management via `useDestinationFilters` hook and URL params
- `RouteCardGroup` highlight pattern with `highlightedRouteSlug` prop
- Design system button styles via `getFilterButtonClass`
- Responsive patterns: `md:` and `lg:` breakpoints in Tailwind

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| RoutePicker scroll may conflict with sticky toolbar offset | Use JS-calculated offset from `useHeaderStickyOffset` + `scrollBy` adjustment |
| Mobile toolbar changes may break existing layouts | Test on multiple viewport sizes; use feature flag if needed |
| Translation keys may be missing for new text | Add fallback defaults; follow existing i18n patterns. Notify localization team of new keys before merge. |
| i18n regression: New UI copy not translated for all 20 locales | Use `defaultValue` fallbacks for all new `t()` calls; translations can be added post-merge without blocking |
| Hydration mismatch: TASK-04 disclosure state differs SSR vs client | Initialize expanded on server; collapse in `useEffect` on mobile. Accept brief layout shift on hydration. |
| Analytics impact: Changing primary CTA flow may affect funnel metrics | Document changes for analytics team; consider adding RoutePicker submit event (see backlog) to measure new flow |

## Acceptance Criteria (overall)

- [ ] RoutePicker form submission scrolls to and highlights best matching route
- [ ] Single clear entry point for filter editing (toolbar button)
- [ ] Critical travel warnings visible without scrolling on mobile
- [ ] Mobile toolbar is not excessively tall
- [ ] Direction toggles discoverable and easy to tap
- [ ] Empty filter state provides actionable suggestions
- [ ] All changes pass existing tests; new tests added where appropriate

## Task Ordering

```
TASK-01 (RoutePicker scroll)──┐
TASK-02 (Remove dup button)───┼─► Core UX fixes (can be parallel)
TASK-06 (Empty state fixes)───┘
        │
        ▼
TASK-03 (Travel tips + late-night emphasis) ─► Content improvements
        │
        ▼
TASK-05 (Direction toggle)────┬─► Polish (can be parallel)
TASK-07 (Jump-to separators)──┘
        │
        ▼
TASK-04 (Mobile toolbar collapse) ─► Requires TASK-07 complete (same component)
```

**Note:** TASK-03 now includes late-night taxi emphasis (previously TASK-07). Total tasks reduced from 8 to 7.

## Recommendations

**Ready to build (≥90% CI):** TASK-01 through TASK-07 (7 tasks total). Remaining risk is mainly visual QA on real devices, not architectural uncertainty.

**Suggested build order:**
1. Milestone 1 (TASK-01) — highest user impact, unlocks the primary RoutePicker flow
2. Milestone 2 (TASK-02, TASK-06) — quick wins, can be parallel
3. Milestone 3 (TASK-03) — content improvement, independent
4. Milestone 4 (TASK-05, TASK-07) — polish, can be parallel
5. Milestone 5 (TASK-04) — depends on TASK-07 (same file)

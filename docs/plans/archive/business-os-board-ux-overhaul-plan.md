---
Type: Plan
Status: Active
Domain: Platform
Created: 2026-01-29
Last-updated: 2026-01-29
Feature-Slug: business-os-board-ux-overhaul
Overall-confidence: 88%
Confidence-Method: min(Implementation,Approach,Impact); Overall weighted by Effort (S=1, M=2, L=3)
---

# Business OS Board UX Overhaul Plan

## Summary

Transform Business OS from functional MVP to production-ready Kanban board by implementing Universal Capture workflow, navigation infrastructure, search/filtering, and card scannability improvements. This is a capture-first redesign optimized for mobile (Read mode) and laptop (Board mode) with responsive intent patterns.

Phase 1 delivers 10 interconnected features: persistent navigation header, breadcrumbs, toast notifications, Universal Capture (FAB + modal), CompactCard redesign, blocked state visual treatment, search + filter chips, board view switcher tabs, empty states, and keyboard shortcuts.

## Goals

1. **Universal Capture** - User can submit new Idea in 10-15 seconds from any page, any device
2. **Findability** - User can find any card in <5 seconds via search + filter chips
3. **Scannability** - User can identify Priority/Owner/Due/Title in <2 seconds per card
4. **Orientation** - Persistent nav + breadcrumbs eliminate "where am I" confusion
5. **Consistency** - Uniform loading/empty/error/success patterns across all pages

## Non-goals

- Mobile responsive layout (vertical stacking, single-lane picker) → Phase 2
- Advanced filtering (multi-select, date range, saved presets) → Phase 3
- Server-side/full-text search → Phase 3
- Removing "Blocked" from Lane type (breaking change) → Phase 3
- Archive system for Done cards → Phase 3
- Keyboard power features (arrow navigation, bulk actions) → Phase 3

## Constraints & Assumptions

**Constraints:**
- Must maintain Pete-only Phase 0 security model (no multi-user auth yet)
- No breaking changes to Card/Lane types in Phase 1
- Client-side only (no new backend APIs in Phase 1)
- Must work on localhost:3020 development environment

**Assumptions:**
- react-hot-toast is acceptable dependency (battle-tested, <10KB)
- FAB pattern is acceptable for mobile (industry standard for capture actions)
- Keyboard shortcuts (`/` `N` `Esc`) don't conflict with browser/OS shortcuts

## Fact-Find Reference

- Related brief: `docs/plans/business-os-card-presentation-fact-find.md` (Revised 2026-01-29)
- Key findings:
  - Original user requirements: card info hierarchy, lane visibility, blocked state, lane header colors
  - UX audit identified critical gaps: no search, no persistent nav, no breadcrumbs, no feedback toasts
  - Capture workflow is #1 success lever for adoption
  - Board view switcher (tabs) solves lane visibility without "lane surgery"
  - Due date exists in Card type but not displayed (shows Updated instead)
  - All 11 requirements have high clarity (95% requirements confidence)

## Existing System Notes

**Key modules/files:**
- `apps/business-os/src/components/board/` — BoardView.tsx (99-114), BoardLane.tsx (14-60), CompactCard.tsx (13-52)
- `apps/business-os/src/lib/types.ts` — Card type (40-61), Lane type (28-36), Priority type (38)
- `apps/business-os/src/lib/board-logic.ts` — filterCardsForBoard, orderCards (validated with 199 passing tests)
- `apps/business-os/src/app/layout.tsx` — Root layout (nav/toast insertion point)
- `apps/business-os/src/components/change-request/ChangeRequestButton.tsx` — Modal pattern reference (uses SimpleModal from @acme/ui/molecules)

**Patterns to follow:**
- **Modal pattern:** `ChangeRequestButton.tsx` uses `<SimpleModal>` from `@acme/ui/molecules` with `isOpen` state
- **i18n:** `useTranslations()` from `@acme/i18n` (see `ChangeRequestButton.tsx:32`)
- **Design system:** Import from `@acme/design-system/atoms` (Button, Input, Textarea)
- **Form submission:** `fetch("/api/...")` with JSON body (see `ChangeRequestButton.tsx:94-99`)
- **Test pattern:** Jest with `@jest/globals`, `describe/it/expect` (see `board-logic.test.ts`)

## Proposed Approach

### Architecture Overview

**1. Layout-level infrastructure (persistent across all pages):**
- Top navigation header with business selector dropdown, links (Home, Boards, People, Plans)
- Toast notification provider (react-hot-toast) wrapping children
- Global keyboard shortcut handler (listening for `/` `N` `Esc` keys)
- Universal Capture trigger (mobile: FAB, laptop: header CTA)

**2. Component hierarchy:**
```
RootLayout
├── ToastProvider (react-hot-toast)
├── KeyboardShortcutProvider
├── NavigationHeader
│   ├── BusinessSelector (dropdown)
│   ├── NavLinks (Home, Boards, People, Plans)
│   └── CaptureButton (laptop only)
└── children (pages)
    └── CaptureFAB (mobile only, sticky bottom-right)

QuickCaptureModal (shared between FAB + CTA)
├── IdeaForm (simplified: Title required, Business/Priority optional)
├── Post-submit actions (View, Add another)
└── Toast on success/error
```

**3. Board-level changes:**
```
BoardView
├── BoardHeader
│   ├── Breadcrumb (Home > Board Name)
│   ├── SearchBar (filter cards client-side)
│   └── BoardViewSwitcher (tabs: All/Planning/Active/Complete)
├── FilterChipsRow (My items, Overdue, P0/P1, Blocked)
└── BoardLanes (filtered by switcher + search + chips)
    └── BoardLane
        ├── LaneHeader (sticky, semantic color, stats)
        └── CompactCard (redesigned)
            ├── Priority badge (clickable → filter)
            ├── Owner chip (clickable → filter)
            ├── Due date (color-coded: overdue=red, due soon=amber)
            ├── Title (bold, 2 lines)
            └── Blocked badge (if Blocked: true)
```

**4. Data flow:**
- All state changes client-side (no new APIs)
- Board view switcher filters cards by lane groupings:
  - Planning: Inbox + Fact-finding + Planned
  - Active: In progress (blocked cards show with badge)
  - Complete: Done + Reflected
  - All: everything
- Search filters cards by Title, ID, Owner (case-insensitive substring match)
- Filter chips AND together with search (e.g., "My items" + search "BRIK" shows only my BRIK items)

### Alternative Approaches Considered

**Toast library:**
- Option A: react-hot-toast (chosen) — battle-tested, <10KB, simple API
- Option B: sonner — newer, more features, but less mature
- Chosen: react-hot-toast for stability and maturity

**Board view switcher:**
- Option A: Tabs (chosen) — discoverable, standard pattern, mobile-friendly
- Option B: Dropdown lane selector — less discoverable, worse UX
- Chosen: Tabs for discoverability and consistency with mobile/laptop intent

**Capture trigger placement:**
- Option A: FAB + header CTA (chosen) — device-appropriate, always visible
- Option B: Inline per page — inconsistent, harder to discover
- Chosen: FAB/CTA for consistency and discoverability

## Task Summary

| Task ID | Type | Description | Confidence | Effort | Status | Depends on |
|---|---|---|---:|---:|---|---|
| BOS-UX-01 | IMPLEMENT | Install react-hot-toast dependency | 95% | S | Pending | - |
| BOS-UX-02 | IMPLEMENT | Create ToastProvider layout wrapper | 92% | S | Pending | BOS-UX-01 |
| BOS-UX-03 | IMPLEMENT | Create Breadcrumb component | 95% | S | Pending | - |
| BOS-UX-04 | IMPLEMENT | Create NavigationHeader component | 88% | M | Pending | - |
| BOS-UX-05 | IMPLEMENT | Create SearchBar component | 90% | M | Pending | - |
| BOS-UX-06 | IMPLEMENT | Create BoardViewSwitcher component | 85% | M | Pending | - |
| BOS-UX-07 | IMPLEMENT | Update CompactCard (Due date, owner chip, due coloring) | 92% | M | Pending | - |
| BOS-UX-08 | IMPLEMENT | Add Blocked field to Card type and CompactCard visual | 90% | S | Pending | - |
| BOS-UX-09 | IMPLEMENT | Create FilterChips component | 88% | M | Pending | BOS-UX-05 |
| BOS-UX-10 | IMPLEMENT | Update BoardView with switcher + search + chips | 85% | M | Pending | BOS-UX-05, BOS-UX-06, BOS-UX-09 |
| BOS-UX-11 | IMPLEMENT | Update BoardLane (sticky header, semantic colors, stats) | 88% | M | Pending | - |
| BOS-UX-12 | IMPLEMENT | Create EmptyLaneState component | 92% | S | Pending | - |
| BOS-UX-13 | IMPLEMENT | Create QuickCaptureModal component | 85% | L | Pending | BOS-UX-02 |
| BOS-UX-14 | IMPLEMENT | Create CaptureFAB component (mobile) | 88% | M | Pending | BOS-UX-13 |
| BOS-UX-15 | IMPLEMENT | Add CaptureButton to NavigationHeader (laptop) | 90% | S | Pending | BOS-UX-04, BOS-UX-13 |
| BOS-UX-16 | IMPLEMENT | Create KeyboardShortcutProvider (/, N, Esc) | 90% | M | Pending | BOS-UX-05, BOS-UX-13 |
| BOS-UX-17 | IMPLEMENT | Update Layout with all providers + nav | 90% | M | Pending | BOS-UX-02, BOS-UX-04, BOS-UX-14, BOS-UX-16 |
| BOS-UX-18 | IMPLEMENT | Add breadcrumbs to detail pages (card/idea/plan/people) | 90% | M | Pending | BOS-UX-03 |
| BOS-UX-19 | IMPLEMENT | Update date-utils for due date color logic | 92% | S | Pending | - |
| BOS-UX-20 | IMPLEMENT | Configure toast positioning (top-right) | 92% | S | Pending | BOS-UX-02 |

> Effort scale: S=1, M=2, L=3 (used for Overall-confidence weighting)
>
> **Overall-confidence calculation:**
> - Tasks with ≥90%: 12 tasks (S=6, M=6, L=0) = weight 18
> - Tasks 80-89%: 8 tasks (S=0, M=7, L=1) = weight 17
> - Tasks <80%: 0 tasks
> - Weighted average: (12×92% + 8×85%) / 35 = 88%

## Tasks

### BOS-UX-01: Install react-hot-toast dependency
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/package.json`
- **Depends on:** -
- **Confidence:** 95%
  - Implementation: 98% — `pnpm add react-hot-toast` is straightforward
  - Approach: 95% — battle-tested library, widely used in Next.js apps
  - Impact: 92% — dependency addition only, no code changes yet
- **Acceptance:**
  - react-hot-toast appears in package.json dependencies
  - `pnpm install` completes without errors
  - Can import `toast` from 'react-hot-toast' in any component
- **Test plan:**
  - Run: `pnpm install` after adding dependency
  - Verify: No peer dependency conflicts
  - Verify: TypeScript types available (@types/react-hot-toast bundled)
- **Planning validation:**
  - Tests run: N/A (dependency install, no tests needed)
  - Test stubs written: N/A
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Install via pnpm, commit package.json + pnpm-lock.yaml
  - Rollback: Remove from package.json, run `pnpm install`
- **Documentation impact:** None
- **Notes / references:**
  - Library: https://react-hot-toast.com/
  - Size: ~8KB gzipped
  - No peer dependency issues with React 19

---

### BOS-UX-02: Create ToastProvider layout wrapper
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/layout.tsx`, `apps/business-os/src/components/toast/ToastProvider.tsx` (new)
- **Depends on:** BOS-UX-01
- **Confidence:** 92%
  - Implementation: 95% — `<Toaster />` component from react-hot-toast wraps children
  - Approach: 90% — standard Next.js provider pattern
  - Impact: 90% — affects all pages but non-breaking (additive only)
- **Acceptance:**
  - ToastProvider wraps children in root layout
  - Toast container renders with correct positioning (see BOS-UX-20 for decision)
  - Can call `toast.success()` / `toast.error()` from any page
  - Toast animations work correctly
- **Test plan:**
  - Manual: Call `toast.success("Test")` from a page, verify toast appears
  - Manual: Verify toast auto-dismisses after 3-5 seconds
  - No unit tests needed (library integration)
- **Planning validation:**
  - Tests run: `npm test` — all 199 tests pass (baseline)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Add provider to layout, no feature flag needed
  - Rollback: Remove provider from layout, remove component file
- **Documentation impact:** None (internal infrastructure)
- **Notes / references:**
  - Pattern: https://react-hot-toast.com/docs/toaster
  - Example setup in Next.js 15 App Router: wrap children with `<Toaster />`

---

### BOS-UX-03: Create Breadcrumb component
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/navigation/Breadcrumb.tsx` (new)
- **Depends on:** -
- **Confidence:** 95%
  - Implementation: 98% — simple component, maps over items array, renders links
  - Approach: 95% — standard breadcrumb pattern with ARIA labels
  - Impact: 95% — isolated component, no dependencies
- **Acceptance:**
  - Breadcrumb component accepts `items: { label: string, href?: string }[]` prop
  - Renders clickable links for items with href, plain text for current page
  - Includes proper ARIA labels (aria-label="breadcrumb", aria-current="page")
  - Visual separator (e.g., " > " or chevron icon) between items
  - Responsive: truncates gracefully on mobile
- **Test plan:**
  - Unit test: Renders correct number of items
  - Unit test: Last item has aria-current="page"
  - Unit test: Links have correct href attributes
  - Manual: Visual check for separator and styling
- **Planning validation:**
  - Tests run: `npm test src/components/navigation/Breadcrumb.test.tsx` (after creation)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Create component, no breaking changes
  - Rollback: Delete component file
- **Documentation impact:** None
- **Notes / references:**
  - ARIA pattern: https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/
  - Tailwind separator: `before:content-['/'] before:mx-2`

---

### BOS-UX-04: Create NavigationHeader component
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/navigation/NavigationHeader.tsx` (new)
  - `apps/business-os/src/components/navigation/BusinessSelector.tsx` (new)
- **Depends on:** -
- **Confidence:** 88%
  - Implementation: 90% — standard header with links + dropdown, well-understood patterns
  - Approach: 88% — responsive design (hamburger on mobile) adds complexity
  - Impact: 85% — global header affects all pages, needs careful z-index management
- **Acceptance:**
  - Header fixed at top of viewport (sticky positioning)
  - Business selector dropdown shows all businesses from businesses.json
  - Current business highlighted in dropdown
  - Links to Home, Boards, People, Plans render correctly
  - Responsive: collapses to hamburger menu on mobile (<768px)
  - Header has higher z-index than page content but lower than modals
  - Current page/route highlighted in navigation
- **Test plan:**
  - Unit test: Renders all navigation links
  - Unit test: Business selector shows correct businesses
  - Unit test: Current route highlighted correctly
  - Manual: Test responsive behavior on mobile viewport
  - Manual: Verify z-index layering (header > content < modal)
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort, but straightforward UI component)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Write test stubs for responsive behavior and dropdown interactions
  - Validate z-index stacking context with modal overlay
- **Rollout / rollback:**
  - Rollout: Create components, add to layout in BOS-UX-17
  - Rollback: Remove from layout, delete component files
- **Documentation impact:** None
- **Notes / references:**
  - z-index: Use Tailwind `z-40` for header (modals use `z-50`)
  - Responsive: Use `@acme/design-system` breakpoint tokens if available
  - Dropdown: Use headlessui `Menu` component or native `<select>` with styling

---

### BOS-UX-05: Create SearchBar component
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/SearchBar.tsx` (new)
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — input field with onChange handler, debounce for performance
  - Approach: 90% — client-side filtering is correct for Phase 1 scope
  - Impact: 88% — filters board cards, needs to coordinate with BoardView state
- **Acceptance:**
  - Search input field with placeholder "Search cards..."
  - Debounced input (300ms) to avoid excessive re-renders
  - Filters cards by: Title (substring match), ID (substring match), Owner (exact or substring)
  - Case-insensitive matching
  - Clear button (X) to reset search
  - Keyboard shortcut `/` focuses search input (handled by BOS-UX-16)
  - `Esc` clears search and blurs input
- **Test plan:**
  - Unit test: onChange handler called with debounced value
  - Unit test: Clear button resets search value
  - Integration test: Search filters cards correctly (Title, ID, Owner)
  - Manual: Verify keyboard shortcuts (`/` focus, `Esc` clear)
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort, standard UI component)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Create component, integrate in BOS-UX-10
  - Rollback: Remove component, remove from BoardView
- **Documentation impact:** None
- **Notes / references:**
  - Debounce: Use `useMemo` + `setTimeout` or library like `use-debounce`
  - Pattern: Similar to GitHub search bar UX

---

### BOS-UX-06: Create BoardViewSwitcher component
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/BoardViewSwitcher.tsx` (new)
- **Depends on:** -
- **Confidence:** 85%
  - Implementation: 88% — tab UI + filter logic straightforward
  - Approach: 85% — lane grouping mapping needs validation (All/Planning/Active/Complete)
  - Impact: 82% — changes board filtering logic, needs to coordinate with existing orderCards/filterCardsForBoard
- **Acceptance:**
  - Tabs render: All, Planning, Active, Complete
  - Active tab highlighted visually
  - Tab selection persisted in URL param (?view=planning) or localStorage
  - Lane mapping:
    - All: all lanes
    - Planning: Inbox + Fact-finding + Planned
    - Active: In progress (blocked cards show with badge)
    - Complete: Done + Reflected
  - Blocked cards remain in their assigned Lane (not separated)
  - Tab change filters board immediately (no page reload)
- **Test plan:**
  - Unit test: Clicking tab changes active tab
  - Unit test: Lane mapping filters correct lanes for each view
  - Integration test: Tab selection persisted in URL/localStorage
  - Manual: Verify visual styling and transitions
- **Planning validation:**
  - Tests run: `npm test src/lib/board-logic.test.ts` — 199 tests pass
  - Test stubs written: N/A (M effort)
  - Unexpected findings: Existing board-logic.ts filters by business/global, not by lane group (this is additive)
- **What would make this ≥90%:**
  - Write test stubs for lane grouping logic
  - Validate that blocked cards in "Active" view have correct badge styling
- **Rollout / rollback:**
  - Rollout: Create component, integrate in BOS-UX-10
  - Rollback: Remove component, revert BoardView to show all lanes
- **Documentation impact:** None
- **Notes / references:**
  - Tab UI: Use headlessui `Tab` component or custom styled buttons
  - URL param: Use Next.js `useSearchParams` + `usePathname` + `useRouter`

---

### BOS-UX-07: Update CompactCard (Due date, owner chip, due coloring)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/board/CompactCard.tsx`
  - `apps/business-os/src/components/board/date-utils.ts` (update formatDate)
- **Depends on:** -
- **Confidence:** 92%
  - Implementation: 95% — replace `Updated` with `Due-Date`, add color logic, add owner chip
  - Approach: 92% — Due date priority over Updated is correct UX decision
  - Impact: 90% — changes CompactCard display but backwards compatible (cards without Due-Date degrade gracefully)
- **Acceptance:**
  - CompactCard displays Due-Date instead of Updated
  - Due date color coding:
    - Overdue (past today): text-red-600
    - Due soon (within 7 days): text-amber-600
    - No due date: text-gray-500
  - Owner displayed as chip with initials (e.g., "PC" for Pete Cowling)
  - Metadata row format: `P1 • PC • Due Jan 31` (priority • owner • due)
  - Business pill only shown on Global board (hidden on single-business boards)
  - Title remains bold, 2-line clamp
- **Test plan:**
  - Unit test: CompactCard renders Due-Date when present
  - Unit test: Overdue date shows red color
  - Unit test: Due soon date shows amber color
  - Unit test: No due date shows gray "No due date" or empty
  - Unit test: Owner chip renders with initials
  - Unit test: Business pill hidden on single-business board
  - Manual: Visual check for spacing and alignment
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Update CompactCard component, no feature flag needed
  - Rollback: Git revert to restore Updated display
- **Documentation impact:** None
- **Notes / references:**
  - Owner initials: `card.Owner.split(' ').map(n => n[0]).join('')`
  - Date comparison: `new Date(card["Due-Date"]) < new Date()` for overdue check

---

### BOS-UX-08: Add Blocked field to Card type and CompactCard visual
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/lib/types.ts` (Card type)
  - `apps/business-os/src/components/board/CompactCard.tsx`
- **Depends on:** -
- **Confidence:** 90%
  - Implementation: 92% — add optional boolean field + conditional rendering
  - Approach: 90% — additive change, no breaking modification to Lane type
  - Impact: 88% — changes type definition, needs type validation across codebase
- **Acceptance:**
  - `Blocked?: boolean` added to CardFrontmatter interface
  - `Blocked-Reason?: string` added to CardFrontmatter interface
  - CompactCard shows "BLOCKED" badge when `Blocked: true`
  - Blocked visual treatment:
    - Red-50 background tint
    - Red-500 left border (4px)
    - "BLOCKED" badge (red-600 text, red-100 background)
  - Optional: hover/tooltip shows `Blocked-Reason` if present
  - Blocked cards remain in their assigned Lane (not moved to separate lane)
- **Test plan:**
  - Unit test: Blocked badge renders when Blocked=true
  - Unit test: Blocked visual styling applied correctly
  - Unit test: Blocked badge hidden when Blocked=false or undefined
  - Manual: Verify visual treatment (tint, border, badge)
- **Planning validation:**
  - Tests run: `npm test src/lib/board-logic.test.ts` — 199 tests pass (type change is additive, no breakage)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Update type, update CompactCard, no migration needed (optional field)
  - Rollback: Remove field from type, remove CompactCard logic
- **Documentation impact:** None (type change documented in code comments)
- **Notes / references:**
  - Similar pattern: PriorityBadge component uses conditional styling

---

### BOS-UX-09: Create FilterChips component
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/FilterChips.tsx` (new)
- **Depends on:** BOS-UX-05 (search bar for coordination)
- **Confidence:** 88%
  - Implementation: 90% — clickable chips that toggle filter state
  - Approach: 88% — filter logic needs to AND with search results
  - Impact: 85% — coordinates with SearchBar and BoardViewSwitcher, complex state management
- **Acceptance:**
  - Filter chips render: "My items", "Overdue", "P0/P1", "Blocked", "Untriaged"
  - Clicking chip toggles active state (visual highlight)
  - Multiple chips can be active simultaneously (AND logic)
  - Filter logic:
    - My items: `card.Owner === "Pete"` (hardcoded for Phase 0)
    - Overdue: `card["Due-Date"] < today`
    - P0/P1: `card.Priority === "P0" || card.Priority === "P1"`
    - Blocked: `card.Blocked === true`
    - Untriaged: `card.Lane === "Inbox" && card.Priority > "P2"`
  - Filters AND with search (e.g., "My items" + search "BRIK" = my BRIK items only)
  - Clear all filters button appears when any chip active
- **Test plan:**
  - Unit test: Clicking chip toggles active state
  - Unit test: Multiple chips can be active
  - Integration test: Filter logic correctly filters cards
  - Integration test: Filters AND with search query
  - Manual: Visual check for active/inactive states
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Write test stubs for complex AND logic between filters + search
  - Validate "Untriaged" definition with user (Inbox + P>2 assumption)
- **Rollout / rollback:**
  - Rollout: Create component, integrate in BOS-UX-10
  - Rollback: Remove component, remove from BoardView
- **Documentation impact:** None
- **Notes / references:**
  - Chip UI: Similar to GitHub issue filters
  - State management: Use React useState or URL params

---

### BOS-UX-10: Update BoardView with switcher + search + chips
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/BoardView.tsx`
- **Depends on:** BOS-UX-05, BOS-UX-06, BOS-UX-09
- **Confidence:** 85%
  - Implementation: 88% — integrate 3 components into existing BoardView
  - Approach: 85% — filter coordination logic is moderately complex
  - Impact: 82% — central component, multiple filter sources, needs performance testing with 50+ cards
- **Acceptance:**
  - BoardView renders BoardViewSwitcher at top
  - SearchBar renders below switcher
  - FilterChips render below search bar
  - Cards filtered by:
    1. Board view tab (All/Planning/Active/Complete)
    2. AND search query (Title/ID/Owner)
    3. AND active filter chips
  - Filter updates trigger immediate re-render (no page reload)
  - Empty state shown when no cards match filters (see BOS-UX-12)
  - Performance: filter + render <100ms for 50 cards
- **Test plan:**
  - Integration test: Switching tab filters cards correctly
  - Integration test: Search filters cards correctly
  - Integration test: Filter chips filter cards correctly
  - Integration test: All 3 filters work together (AND logic)
  - Performance test: Render 50 cards with filters in <100ms
  - Manual: Verify no jank/flicker during filter changes
- **Planning validation:**
  - Tests run: `npm test src/lib/board-logic.test.ts` — 199 tests pass
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Write test stubs for filter coordination logic
  - Performance test with 50+ card dataset
  - Validate debounce timing doesn't cause UX lag
- **Rollout / rollback:**
  - Rollout: Update BoardView, no feature flag needed (graceful degradation)
  - Rollback: Git revert to restore original BoardView
- **Documentation impact:** None
- **Notes / references:**
  - Performance: Use `useMemo` to memoize filtered card array
  - Pattern: GitHub issues page (filters + search + tabs)

---

### BOS-UX-11: Update BoardLane (sticky header, semantic colors, stats)
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/BoardLane.tsx`
- **Depends on:** -
- **Confidence:** 88%
  - Implementation: 90% — CSS sticky + color classes + count aggregation
  - Approach: 88% — sticky positioning can have browser quirks
  - Impact: 85% — changes lane header UI, needs to work with horizontal scroll
- **Acceptance:**
  - Lane header has semantic background color:
    - Planning lanes (Inbox, Fact-finding, Planned): blue-100
    - Active lane (In progress): green-100
    - Complete lanes (Done, Reflected): gray-100
  - Lane header sticky within lane scroll (position: sticky, top: 0)
  - Header displays stats (at least on laptop Board mode):
    - Total count (e.g., "7 cards")
    - P0/P1 count (e.g., "2 high priority")
    - Overdue count (e.g., "1 overdue")
  - Header remains visible when scrolling cards vertically
  - Header background color contrasts with card background
- **Test plan:**
  - Unit test: Lane stats calculated correctly (count, P0/P1, overdue)
  - Manual: Verify sticky behavior on scroll
  - Manual: Verify color contrast (WCAG AA minimum)
  - Manual: Verify stats display on laptop viewport
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Test sticky positioning across browsers (Safari, Firefox, Chrome)
  - Validate color contrast with accessibility checker
- **Rollout / rollback:**
  - Rollout: Update BoardLane component, no feature flag needed
  - Rollback: Git revert to restore original lane header
- **Documentation impact:** None
- **Notes / references:**
  - CSS sticky: `position: sticky; top: 0; z-index: 10;`
  - Color contrast: Use WebAIM contrast checker

---

### BOS-UX-12: Create EmptyLaneState component
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/EmptyLaneState.tsx` (new)
- **Depends on:** -
- **Confidence:** 92%
  - Implementation: 95% — simple component with icon + message + CTA
  - Approach: 92% — contextual messaging per lane is clear UX improvement
  - Impact: 90% — isolated component, no dependencies
- **Acceptance:**
  - EmptyLaneState accepts `lane: Lane` and `hasFilters: boolean` props
  - Displays contextual message based on lane:
    - Inbox: "No cards in Inbox. Create a new card or idea to get started."
    - Fact-finding: "No cards in Fact-finding. Move cards from Inbox to start research."
    - Planned: "No cards planned yet."
    - In progress: "No active work. Move planned cards here to start."
    - Blocked: (N/A - blocked is card state, not lane in Phase 1)
    - Done: "No completed cards yet."
    - Reflected: "No reflected cards. Complete reflection for done cards."
  - If `hasFilters: true`, show "No cards match your filters. Clear filters to see all cards."
  - Primary action button (e.g., "Create Card", "Create Idea") for Inbox
  - Icon appropriate to lane (e.g., inbox icon for Inbox, checkmark for Done)
- **Test plan:**
  - Unit test: Correct message rendered for each lane
  - Unit test: Filter message shown when hasFilters=true
  - Unit test: CTA button renders for Inbox lane
  - Manual: Visual check for icon and styling
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Create component, integrate in BoardLane
  - Rollback: Remove component, show generic "No items" message
- **Documentation impact:** None
- **Notes / references:**
  - Icon: Use lucide-react icons (already in dependencies)
  - Pattern: Similar to GitHub empty state UX

---

### BOS-UX-13: Create QuickCaptureModal component
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/capture/QuickCaptureModal.tsx` (new)
  - `apps/business-os/src/components/capture/useQuickCapture.ts` (new hook)
- **Depends on:** BOS-UX-02 (toast provider)
- **Confidence:** 85%
  - Implementation: 88% — modal + simplified form + post-submit flow
  - Approach: 85% — context detection (default Business from current page) needs validation
  - Impact: 82% — global component, needs to work from any page, multiple edge cases
- **Acceptance:**
  - Modal opens with keyboard shortcut `N` or FAB/CTA click
  - Form fields:
    - Title (required, text input, autofocus)
    - Business (optional dropdown, defaults to current business or "PLAT")
    - Priority (optional dropdown, defaults to "P2")
    - Notes (optional textarea)
  - Submit creates Idea via POST `/api/ideas`
  - Post-submit flow:
    - Show success toast: "Idea created!"
    - Keep modal open (no yank)
    - Show actions: "View idea" (link), "Add another" (clear form)
    - Mobile: bias to "Add another" (autofocus)
  - Error handling: show error toast on API failure, keep form data
  - Esc key closes modal
  - Click outside backdrop closes modal (with confirmation if form dirty)
- **Test plan:**
  - Unit test: Form validation (Title required)
  - Unit test: Business defaults to current context
  - Unit test: Submit calls POST /api/ideas with correct payload
  - Integration test: Success flow (toast + actions)
  - Integration test: Error flow (toast + form preserved)
  - Manual: Verify keyboard shortcuts (`N`, `Esc`)
  - Manual: Verify mobile vs laptop action bias
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: Yes (L effort)
    - `apps/business-os/src/components/capture/QuickCaptureModal.test.tsx`
    - Tests: form rendering, validation, submit flow, post-submit actions, error handling
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Write failing test stubs for all acceptance criteria
  - Validate context detection logic (how to determine current business from URL/page)
  - Test mobile "Add another" autofocus behavior
- **Rollout / rollback:**
  - Rollout: Create component + hook, integrate in BOS-UX-14/BOS-UX-15
  - Rollback: Remove component, remove FAB/CTA triggers
- **Documentation impact:** None
- **Notes / references:**
  - Modal pattern: Use SimpleModal from `@acme/ui/molecules` (see ChangeRequestButton.tsx)
  - API pattern: POST /api/ideas (see ChangeRequestButton.tsx:94-99)
  - Context detection: Parse URL or use React Context

---

### BOS-UX-14: Create CaptureFAB component (mobile)
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/capture/CaptureFAB.tsx` (new)
- **Depends on:** BOS-UX-13 (QuickCaptureModal)
- **Confidence:** 88%
  - Implementation: 90% — button with fixed positioning, triggers modal
  - Approach: 88% — mobile detection needs validation (CSS media query vs JS)
  - Impact: 85% — sticky FAB can interfere with page content, needs z-index management
- **Acceptance:**
  - FAB renders on mobile viewports only (<768px)
  - Position: fixed, bottom-right, 16px from edges
  - Icon: "+" (lucide-react Plus icon)
  - Background: blue-600, text: white
  - Size: 56×56px (meets 44px minimum touch target)
  - Shadow: elevated (shadow-lg)
  - Click opens QuickCaptureModal
  - z-index below modal (z-40) but above page content
  - Does not obscure critical page content (test with long pages)
- **Test plan:**
  - Unit test: FAB renders on mobile viewport
  - Unit test: FAB hidden on desktop viewport (≥768px)
  - Unit test: Click triggers modal open
  - Manual: Verify z-index layering
  - Manual: Verify touch target size (56px)
  - Manual: Verify FAB doesn't obscure content on long pages
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **What would make this ≥90%:**
  - Test z-index stacking with modal + header
  - Validate FAB position doesn't obscure critical page elements
- **Rollout / rollback:**
  - Rollout: Create component, add to layout in BOS-UX-17
  - Rollback: Remove component from layout
- **Documentation impact:** None
- **Notes / references:**
  - FAB pattern: Material Design FAB guidelines
  - Mobile detection: Use Tailwind `md:hidden` class
  - z-index: Use z-40 (header is z-40, modals are z-50)

---

### BOS-UX-15: Add CaptureButton to NavigationHeader (laptop)
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/navigation/NavigationHeader.tsx`
- **Depends on:** BOS-UX-04, BOS-UX-13
- **Confidence:** 90%
  - Implementation: 92% — add button to existing header component
  - Approach: 90% — desktop-only button is straightforward
  - Impact: 88% — modifies NavigationHeader, needs to coordinate with mobile FAB (exclusive)
- **Acceptance:**
  - CaptureButton renders in NavigationHeader on desktop viewports (≥768px)
  - Position: top-right of header, right of nav links
  - Label: "+ Capture" or "New Idea"
  - Style: primary button (blue-600 background, white text)
  - Click opens QuickCaptureModal
  - Hidden on mobile viewports (<768px)
  - Keyboard shortcut `N` triggers same modal (handled by BOS-UX-16)
- **Test plan:**
  - Unit test: Button renders on desktop viewport
  - Unit test: Button hidden on mobile viewport
  - Unit test: Click triggers modal open
  - Manual: Verify visual placement in header
  - Manual: Verify button doesn't overlap nav links on narrow desktop viewports
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Update NavigationHeader component
  - Rollback: Git revert to remove button
- **Documentation impact:** None
- **Notes / references:**
  - Responsive: Use Tailwind `hidden md:flex` classes

---

### BOS-UX-16: Create KeyboardShortcutProvider (/, N, Esc)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/components/keyboard/KeyboardShortcutProvider.tsx` (new)
  - `apps/business-os/src/components/keyboard/useKeyboardShortcuts.ts` (new hook)
- **Depends on:** BOS-UX-05 (SearchBar), BOS-UX-13 (QuickCaptureModal)
- **Confidence:** 90%
  - Implementation: 92% — global keydown listener with preventDefault
  - Approach: 90% — keyboard shortcuts are standard pattern
  - Impact: 88% — global event listener, needs to handle focus management and edge cases
- **Acceptance:**
  - Global keyboard shortcuts:
    - `/` — focus search bar (if on board page)
    - `N` — open QuickCaptureModal (from any page)
    - `Esc` — close modal or clear search (context-dependent)
  - Shortcuts only fire when:
    - Not typing in input/textarea/contenteditable
    - No modifier keys (Ctrl/Cmd/Alt) pressed
  - Visual indication of shortcuts (tooltip or help dialog)
  - Focus management: after `Esc`, focus returns to previous element
  - No conflict with browser shortcuts (e.g., Cmd+N opens new window)
- **Test plan:**
  - Unit test: Keydown listener attached to document
  - Unit test: `/` focuses search (mocked input ref)
  - Unit test: `N` opens modal
  - Unit test: `Esc` closes modal or clears search
  - Unit test: Shortcuts ignored when typing in input
  - Manual: Verify no browser shortcut conflicts
  - Manual: Verify focus management after `Esc`
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Create provider + hook, add to layout in BOS-UX-17
  - Rollback: Remove provider from layout
- **Documentation impact:** None (shortcuts documented in UI tooltips)
- **Notes / references:**
  - Pattern: GitHub keyboard shortcuts (/ for search, C for create)
  - Event handling: `event.preventDefault()` for `/` to prevent browser search

---

### BOS-UX-17: Update Layout with all providers + nav
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/app/layout.tsx`
- **Depends on:** BOS-UX-02, BOS-UX-04, BOS-UX-14, BOS-UX-16
- **Confidence:** 90%
  - Implementation: 92% — compose providers + nav into layout
  - Approach: 90% — provider composition order is straightforward
  - Impact: 88% — modifies root layout, affects all pages
- **Acceptance:**
  - Root layout structure:
    ```tsx
    <html>
      <body>
        <ToastProvider>
          <KeyboardShortcutProvider>
            <NavigationHeader />
            {children}
            <CaptureFAB /> {/* mobile only */}
          </KeyboardShortcutProvider>
        </ToastProvider>
      </body>
    </html>
    ```
  - All pages render with nav header + toast + keyboard shortcuts
  - Mobile FAB appears on mobile viewports only
  - Navigation header appears on all viewports
  - No layout shift or flicker on page load
  - Provider nesting order correct (ToastProvider outermost)
- **Test plan:**
  - Integration test: All providers render correctly
  - Integration test: Toast, keyboard shortcuts, nav all functional
  - Manual: Test on multiple pages (home, board, card detail, idea, plan, people)
  - Manual: Verify no layout shift on page load
  - Manual: Test responsive behavior (mobile FAB, desktop nav)
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Update layout.tsx with new structure
  - Rollback: Git revert to restore original layout
- **Documentation impact:** None
- **Notes / references:**
  - Provider order: Outermost providers are most global (Toast > Keyboard > Nav)

---

### BOS-UX-18: Add breadcrumbs to detail pages (card/idea/plan/people)
- **Type:** IMPLEMENT
- **Affects:**
  - `apps/business-os/src/app/cards/[id]/page.tsx`
  - `apps/business-os/src/app/ideas/[id]/page.tsx`
  - `apps/business-os/src/app/plans/page.tsx`
  - `apps/business-os/src/app/people/page.tsx`
- **Depends on:** BOS-UX-03 (Breadcrumb component)
- **Confidence:** 90%
  - Implementation: 92% — add Breadcrumb component to each page with correct items
  - Approach: 90% — breadcrumb hierarchy is clear (Home > Board > Card)
  - Impact: 88% — modifies 4 page files, needs consistent breadcrumb structure
- **Acceptance:**
  - Breadcrumbs on all detail pages:
    - Card detail: `Home > [Business] Board > Card [ID]`
    - Idea detail: `Home > Ideas > [ID]`
    - Plan page: `Home > Plans > [Business] Plan`
    - People page: `Home > People`
  - Last breadcrumb item (current page) is plain text, not a link
  - Links navigate correctly
  - Breadcrumb component has aria-label="breadcrumb"
  - Current page item has aria-current="page"
- **Test plan:**
  - Unit test: Breadcrumb renders on each page with correct items
  - Unit test: Last item has aria-current="page"
  - Integration test: Links navigate correctly
  - Manual: Visual check for breadcrumb styling and spacing
- **Planning validation:**
  - Tests run: `npm test` — baseline (199 tests pass)
  - Test stubs written: N/A (M effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Add Breadcrumb component to each page
  - Rollback: Remove Breadcrumb from pages (pages still functional)
- **Documentation impact:** None
- **Notes / references:**
  - Page structure: Add breadcrumb above page title

---

### BOS-UX-19: Update date-utils for due date color logic
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/board/date-utils.ts`
- **Depends on:** -
- **Confidence:** 92%
  - Implementation: 95% — add function to determine due date color class
  - Approach: 92% — color logic is straightforward (overdue/due soon/default)
  - Impact: 90% — utility function, no breaking changes
- **Acceptance:**
  - New function `getDueDateColor(dueDate: string | undefined): string`
  - Returns Tailwind color class:
    - Overdue (past today): "text-red-600"
    - Due soon (within 7 days): "text-amber-600"
    - No due date or future: "text-gray-500"
  - Function handles undefined/null gracefully (returns default gray)
  - Date comparison uses local timezone (not UTC)
- **Test plan:**
  - Unit test: Overdue date returns "text-red-600"
  - Unit test: Due soon (within 7 days) returns "text-amber-600"
  - Unit test: Future date (>7 days) returns "text-gray-500"
  - Unit test: Undefined/null returns "text-gray-500"
  - Unit test: Edge case: due today returns amber (within 7 days)
- **Planning validation:**
  - Tests run: `npm test src/components/board/date-utils.test.ts` (after creation)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Add function to date-utils.ts
  - Rollback: Remove function, revert to single formatDate function
- **Documentation impact:** None
- **Notes / references:**
  - Date comparison: `const today = new Date(); today.setHours(0, 0, 0, 0);`
  - 7-day threshold: `const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);`

---

### BOS-UX-20: Configure toast positioning (top-right)
- **Type:** IMPLEMENT
- **Affects:** `apps/business-os/src/components/toast/ToastProvider.tsx`
- **Depends on:** BOS-UX-02
- **Confidence:** 92%
  - Implementation: 95% — react-hot-toast supports position prop, straightforward config
  - Approach: 92% — top-right is standard pattern, user-validated choice
  - Impact: 90% — no conflict with FAB or header, clear UX benefit
- **Acceptance:**
  - ToastProvider configured with `position="top-right"`
  - Toasts appear in top-right corner on both mobile and desktop
  - No visual conflict with mobile FAB (bottom-right)
  - No visual conflict with navigation header (top, full width)
  - Toasts stack vertically when multiple appear
  - Auto-dismiss timing: 4 seconds (react-hot-toast default)
- **Test plan:**
  - Manual: Trigger success toast, verify appears top-right
  - Manual: Trigger multiple toasts, verify stacking behavior
  - Manual: Test on mobile viewport, verify no conflict with FAB
  - Manual: Test on desktop viewport, verify no conflict with header
- **Planning validation:**
  - Tests run: N/A (configuration only, no logic changes)
  - Test stubs written: N/A (S effort)
  - Unexpected findings: None
- **Rollout / rollback:**
  - Rollout: Add `position="top-right"` prop to Toaster component in ToastProvider
  - Rollback: Change position prop or remove (defaults to bottom-center)
- **Documentation impact:** None
- **Notes / references:**
  - react-hot-toast positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
  - Decision rationale: Standard desktop pattern, doesn't obscure mobile FAB, user preference

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| **Performance degradation with 50+ cards** | Use `useMemo` for filtered card arrays, debounce search input, monitor render time |
| **Keyboard shortcut conflicts with browser** | Test in Chrome/Safari/Firefox, use non-conflicting keys (`/` `N` `Esc`), preventDefault only when not typing |
| **Mobile FAB obscures content** | Position 16px from bottom-right, test on real devices, add user feedback mechanism |
| **Toast positioning interferes with FAB** | Use top-right positioning (see BOS-UX-20), validate on mobile devices |
| **Sticky header z-index conflicts** | Use consistent z-index scale: content < header/FAB (z-40) < modal (z-50) |
| **Context detection fails for Quick Capture** | Default to "PLAT" business if context unclear, allow user to change in modal |
| **Search debounce causes lag** | Use 300ms debounce (tested standard), allow instant clear with Esc |
| **Board view switcher lane mapping unclear** | Document mapping in code comments, add help tooltip in UI |
| **Blocked cards lost without Blocked lane** | Blocked badge + "Blocked" filter chip makes them discoverable |
| **Empty state messaging doesn't match user mental model** | Iterate messaging based on usage, keep messages concise and actionable |

## Observability

**Logging:**
- Log Quick Capture submission success/failure (error messages to console)
- Log keyboard shortcut usage (track which shortcuts users actually use)
- Log search/filter usage (track if users find cards successfully)

**Metrics:**
- Capture completion rate (modal open → idea created)
- Search usage frequency (% of board views that use search)
- Filter chip usage (which chips are most/least used)
- Board view switcher usage (which tabs are most popular)

**Alerts/Dashboards:**
- N/A (Phase 0 local development only)

## Acceptance Criteria (overall)

- [ ] User can create new Idea in 10-15 seconds from any page
- [ ] User can find any card in <5 seconds via search + filter chips
- [ ] User can identify Priority/Owner/Due/Title in <2 seconds per CompactCard
- [ ] Persistent navigation header present on all pages with business selector
- [ ] Breadcrumbs show hierarchy on all detail pages (card/idea/plan/people)
- [ ] Toast notifications appear for all create/update actions
- [ ] Keyboard shortcuts work: `/` search, `N` capture, `Esc` dismiss
- [ ] Board view switcher tabs filter lanes correctly (All/Planning/Active/Complete)
- [ ] Empty states show contextual messaging and CTAs for all lanes
- [ ] Blocked cards show badge + visual treatment, remain in assigned lane
- [ ] Lane headers have semantic colors and sticky positioning
- [ ] No regressions: all 199 existing tests pass
- [ ] No TypeScript errors: `npm run typecheck` passes
- [ ] No ESLint errors: `npm run lint` passes (or acceptable Phase 0 warnings only)

## Decision Log

- 2026-01-29: Chose react-hot-toast over sonner for stability and maturity
- 2026-01-29: Chose tab-based board view switcher over dropdown for discoverability
- 2026-01-29: Chose FAB + header CTA pattern over inline per-page capture for consistency
- 2026-01-29: Chose client-side filtering (Phase 1) over server-side search (deferred to Phase 3)
- 2026-01-29: Chose additive Blocked flag over removing Blocked lane (breaking change deferred)
- 2026-01-29: Chose top-right toast positioning (standard desktop pattern, no FAB conflict)

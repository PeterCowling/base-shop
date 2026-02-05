---
Type: Fact-find
Status: Reference
Last-updated: 2026-02-05
---
# Business OS Board UX Overhaul — Planning Fact-Find Brief (Revised)

**Type:** Planning Fact-Find Brief (Outcome A)
**Card ID:** TBD (to be created)
**Created:** 2026-01-29
**Updated:** 2026-01-29 (revised per latest UX direction)
**Owner:** Pete

## Executive Summary

This initiative upgrades the Business OS board from "functional MVP" to a production-ready Kanban experience by fixing scanning, navigation/orientation, and "find + capture" workflows.

**Net-effect UX direction (from latest discussion):**

### Responsive by intent
- **Mobile** defaults to **Read mode** (fast scanning, minimal chrome, operational interactions)
- **Laptop** defaults to **Board mode** (wide context, richer controls for strategic scanning)
- Both devices can toggle modes quickly

### Universal Capture is the #1 success lever
- Persistent **"+ Capture"** on every page (mobile: sticky FAB; laptop: top-right CTA + keyboard `N`)
- Opens a single quick-capture that submits a new Idea in ~10–15 seconds
- Post-submit keeps user in context (toast + actions; no forced redirect)

### Board complexity reduced early without "lane surgery"
- Add a **board view switcher** (tabs): **All / Planning / Active / Complete** to cut cognitive load immediately
- Sticky lane headers with counts and key stats; empty states that guide action

### Card scannability upgraded
- CompactCard prioritizes **Priority, Owner, Due, Title**; "Updated" becomes secondary (tooltip/hover)
- **Blocked** becomes a card-level state (badge + tint + left border + optional reason on hover), not a dedicated lane

## Goals

1. **Fast capture everywhere:** user can submit a new Idea quickly from any page, on mobile or laptop
2. **High scannability:** users can identify priority/owner/due/title at a glance
3. **Findability:** search + saved views eliminate manual lane scanning
4. **Orientation:** persistent navigation, breadcrumbs, and deep-link affordances reduce "lost" states
5. **Consistency:** loading/empty/error/success patterns feel uniform across the app

## Updated Requirements

### 0. Universal Capture (New — Highest Priority)

**User requirement:** Both mobile + laptop users must quickly submit new ideas; this is critical to app success.

**Desired outcome:**

**Persistent + Capture control on every page:**
- Mobile: bottom sticky FAB
- Laptop: header primary CTA + keyboard `N`

**Quick-capture form (shared):**
- Title (required)
- Optional: Voice/Notes, Business (defaults intelligently), Priority
- Everything else is "later"

**Post-submit flow (no yank):**
- Show toast success
- Keep user on current page
- Actions: "View", "Add another" (mobile bias to "Add another")

### 1. Compact Card Information Hierarchy (Updated)

**Must show at a glance:** Priority, Owner, Due Date, Job name (Title).

**Net changes:**
- Replace **Updated** with **Due** in CompactCard
- Due date color treatment:
  - Overdue: red
  - Due soon: amber
  - No due date: muted
- Add Owner chip/avatar (initials) and tighten metadata row:
  - Example: `P1 • Pete • Due Jan 31`
- Reduce redundancy:
  - Show "Business/Job pill" only on Global board; hide on single-business boards

### 2. Lane Visibility & Cognitive Load (Reframed)

**Problem:** too many lanes horizontally; mobile should not be a 7-lane scroller.

**Immediate solution (Phase 1): Board View Switcher**

Tabs: **All / Planning / Active / Complete**

**Mapping to lanes (initial):**
- **Planning:** Inbox + Fact-finding + Planned
- **Active:** In progress (+ blocked overlay)
- **Complete:** Done + Reflected
- **All:** everything

**Device-specific defaults:**

**Mobile (Read mode default):**
- Tabs (phase switcher) + vertically stacked cards
- Either single lane picker or grouped sections (no horizontal board required)

**Laptop (Board mode default):**
- Multi-lane board remains available
- Add lane grouping/collapse later (Phase 2)

### 3. Blocked State Representation (Clarified)

**User requirement:** blocked should not be a lane; it's a card state.

**Desired outcome:**
- Add `Blocked?: boolean` (+ optional `Blocked-Reason?: string`)
- Blocked cards stay in their current Lane
- Visual treatment:
  - "BLOCKED" badge
  - Tinted background + left border
  - Optional "blocked reason" on hover (or expandable metadata)

### 4. Lane Header Styling + Sticky Lane Headers (Upgraded)

**User requirement:** lane headers should have a background colour.

**Net additions:**
- Headers get semantic color background
- Sticky lane headers within lane scroll
- Include key stats (at least on laptop Board mode):
  - Total count
  - P0/P1 count
  - Overdue count
  - Optional WIP indicator (if/when WIP limits exist)

### 5. Search & Filtering (Upgraded)

**Critical gap:** no search.

**Desired outcome:**
- Search in board header (both modes)
  - Laptop: `/` focuses search; `Esc` clears
  - Mobile: prominent search field
- Client-side search by: Title, ID, Owner (Phase 1 baseline)
- Filter chips and saved views:
  - "My items", "Overdue", "P0/P1", "Blocked", "Untriaged"
- Make filters **"discoverable from cards":**
  - Click owner chip → filter to owner
  - Click priority badge → filter to priority

### 6. Navigation Header + "Page Header Pattern" (Upgraded)

**Problem:** no persistent navigation; users get stranded.

**Desired outcome:**

**Persistent top nav everywhere with:**
- Business/board selector
- Links: Home, Boards, People, Plans
- Current context indicator

**Standard page header pattern on all pages:**
- Title + breadcrumbs + primary action (+ Capture) + secondary actions
- Mobile read mode: keep header minimal to preserve vertical space (but still present)

### 7. Breadcrumbs + Deep Link Affordances (Upgraded)

**Desired outcome:**
- Breadcrumbs on all detail pages with ARIA labels
- **"Deep link" affordances:**
  - Copy-link button for cards/ideas/plans
  - ID shown prominently for quick reference

### 8. Toast Notifications (Expanded)

**Desired outcome:**
- Standard toast system for:
  - Create/update success
  - Errors
- Works with post-submit flow (especially quick capture)
- Accessible (aria-live)

### 9. Loading, Empty, Error States (Standardized)

**Desired outcome:**
- Skeletons for board + detail pages
- Button spinners for async actions
- **Empty lane states:**
  - Short hint ("what belongs here")
  - Primary action ("Add card" / "Capture idea")

### 10. Keyboard + Focus UX (Added)

**Desired outcome:**
- Visible focus rings and correct tab order
- **Keyboard controls (Phase 1 baseline):**
  - `/` search, `N` capture, `Esc` clear/close
- **Optional Phase 2+:**
  - Arrow-key navigation between cards, `Enter` to open

## Current Implementation Evidence

**Board components:** BoardView.tsx, BoardLane.tsx, CompactCard.tsx

**Type system:** types.ts (Card has `Due-Date?: string`; Lane includes "Blocked")

**Board logic:** board-logic.ts (ordering already strong)

**Layout:** app/layout.tsx (nav insertion point)

**Forms:** CardEditorForm.tsx, IdeaForm.tsx (toast + capture integration points)

**Net new/changed surfaces:**
- Global "Capture" control appears on every page (layout-level)
- Quick-capture modal/component (new)
- Board view switcher (new)
- CompactCard redesign (existing component)
- Blocked state flag + optional reason (type + UI)

## Revised Phasing (Aligned to mobile/laptop intent + capture-first)

### Phase 1: Capture + Find + Scan + Orientation (Sprint 1 - ~25-30 hours)

**Goal:** immediate adoption and usability lift; mobile and laptop both "work" immediately.

**Features:**
1. **Universal Capture** (layout-level; quick-capture modal; post-submit flow)
2. **Toast system** (success/error; capture and forms)
3. **Persistent nav + page header pattern** (title/breadcrumbs/actions)
4. **Breadcrumbs + copy-link affordances**
5. **CompactCard upgrade** (Due replaces Updated; owner chip; due coloring; global-only business pill)
6. **Blocked overlay state** (Blocked flag + styling + optional reason hover)
7. **Search + saved filters** (client-side; `/` focus; `Esc` clear; filter chips)
8. **Board view switcher tabs** (All/Planning/Active/Complete)
9. **Empty states** for lanes/sections with primary action

**Why this is the correct Phase 1:** it optimizes for capture velocity, findability, and scannability, which are the adoption-critical loops for both mobile and laptop.

### Phase 2: Perception + Layout Depth (Sprint 2 - ~15-20 hours)

**Goal:** polish + solve remaining structural pain (lane visibility) with real usage feedback.

**Features:**
1. **Skeletons & Suspense boundaries** (board + detail pages)
2. **Consistent loading/error/empty patterns** across all pages
3. **Lane header sticky + stats** (if not fully done in Phase 1)
4. **Laptop Board mode enhancements:**
   - Lane grouping/collapse
   - Density toggle (comfortable/compact)
5. **Mobile Read mode refinements:**
   - Lane picker vs grouped sections tuning
   - Sticky filter chips, larger tap targets

### Phase 3: Breaking/advanced features (Deferred)

1. Remove "Blocked" from Lane type + migrate existing cards (if any)
2. Advanced filtering (multi-select, date range, saved presets beyond basics)
3. Server-side/full-text search (content search)
4. Keyboard power features (arrow navigation, bulk actions)
5. Archiving Done cards

## Success Metrics (Revised)

### Capture (top metric)
- User can create a new Idea in **10–15 seconds** on both mobile and laptop
- Post-submit: toast appears, user stays in context; "Add another" supports rapid capture loops

### Scan + Find
- User can identify **Priority/Owner/Due/Title within 2 seconds** per card
- User can find any card by title/ID/owner in **<5 seconds** (search + chips + saved views)

### Orientation
- From any page, user can navigate to Boards/Plans/People in **one step**
- Breadcrumbs reduce backtracking and "where am I" moments

### Consistency
- No blank pages during load; skeleton appears quickly
- Empty states always explain what the section is and how to add to it

## Technical Approach Options

### Requirement 0: Universal Capture

**Option A: FAB + Modal with intelligent defaults (recommended)**
- Mobile: Sticky FAB (bottom-right, always visible)
- Laptop: Header CTA + keyboard shortcut (`N`)
- Shared quick-capture modal/sheet
- Defaults: Business from current context, Priority=P2, minimal fields
- Post-submit: Toast + "View" / "Add another" actions
- **Complexity:** Medium (modal, keyboard handling, context detection)
- **Blast radius:** Layout component, new QuickCapture component, keyboard handler
- **Confidence:** 85%

**Option B: Inline quick-add per page**
- Different capture patterns per page type
- More complex, less consistent
- **Complexity:** High
- **Confidence:** 60%

### Requirement 1: Card Information Hierarchy

**Option A: Due-first with color coding (recommended)**
- Replace `Updated` display with `Due-Date`
- Color treatment: overdue (red-600), due soon (amber-600), no due (gray-500)
- Owner as chip with initials: `<Chip>PC</Chip>`
- Metadata row: `P1 • PC • Due Jan 31`
- **Complexity:** Low (CompactCard component only)
- **Blast radius:** CompactCard.tsx, date-utils.ts
- **Confidence:** 95%

### Requirement 2: Board View Switcher

**Option A: Tab-based phase switcher (recommended)**
- Tabs component: All / Planning / Active / Complete
- Filter cards by lane groupings
- URL param or localStorage for persistence
- Mobile: Tabs remain, cards stack vertically
- Laptop: Tabs + multi-lane board layout
- **Complexity:** Medium (new Tabs component, filter logic)
- **Blast radius:** BoardView.tsx, new BoardViewSwitcher component
- **Confidence:** 80%

**Option B: Dropdown lane selector (mobile-only)**
- Simpler but less discoverable
- **Complexity:** Low
- **Confidence:** 85% (but worse UX)

### Requirement 3: Blocked State

**Option A: Card-level flag with visual treatment (recommended)**
- Add `Blocked?: boolean` and `Blocked-Reason?: string` to Card type
- Badge: "BLOCKED" pill
- Styling: red-50 background, red-500 left border (4px)
- Hover/tooltip shows reason if present
- **Complexity:** Low-Medium (type + UI)
- **Blast radius:** types.ts, CompactCard.tsx
- **Confidence:** 90%

### Requirement 5: Search & Filtering

**Option A: Client-side search with filter chips (recommended)**
- Search bar in board header
- Real-time filtering as user types
- Keyboard: `/` focuses, `Esc` clears
- Filter chips: My items, Overdue, P0/P1, Blocked
- Click owner/priority on card to filter
- **Complexity:** Medium (search UI + filter logic)
- **Blast radius:** BoardView.tsx, new SearchBar component
- **Confidence:** 90%

### Requirement 6: Navigation Header

**Option A: Persistent top nav with business selector (recommended)**
- Fixed header across all pages
- Business dropdown (current business highlighted)
- Links: Home, Boards, People, Plans
- Responsive: collapses to hamburger on mobile
- **Complexity:** Medium (layout component, responsive)
- **Blast radius:** Layout component, all pages
- **Confidence:** 85%

### Requirement 8: Toast Notifications

**Option A: react-hot-toast library (recommended)**
- Battle-tested, accessible
- Simple API: `toast.success("Card created!")`
- Works with quick-capture post-submit flow
- **Complexity:** Low (library integration)
- **Blast radius:** Layout component, form handlers
- **Confidence:** 95%

### Requirement 9: Loading States

**Option A: Skeleton components (recommended)**
- Create BoardSkeleton, CardDetailSkeleton
- Use React Suspense boundaries
- Smooth fade-in transitions
- Empty states with icon + message + CTA
- **Complexity:** Medium (skeleton components)
- **Blast radius:** Page layouts, new skeleton components
- **Confidence:** 85%

### Requirement 10: Keyboard UX

**Option A: Global keyboard handler with shortcuts (recommended)**
- `/` search, `N` capture, `Esc` dismiss
- Visible focus rings (focus-visible)
- Proper tab order
- **Complexity:** Low-Medium (global handler, focus management)
- **Blast radius:** Layout component, modal components
- **Confidence:** 90%

## Confidence Inputs for Planning

### Technical Confidence

| Aspect | Confidence | Reasoning |
|--------|-----------|-----------|
| **Phase 1 (Capture + Find + Scan)** | | |
| Universal Capture (FAB + modal) | 85% | Context detection + keyboard handling well-understood |
| Toast notifications (library) | 95% | Battle-tested library, well-documented |
| Navigation header | 85% | Standard pattern, responsive considerations |
| Breadcrumb component | 95% | Simple component, clear requirements |
| CompactCard redesign | 95% | Well-understood component, clear requirements |
| Blocked state (additive) | 90% | Leverages existing Card type, non-breaking |
| Search + filter chips | 90% | Standard filtering logic, no backend needed |
| Board view switcher tabs | 80% | New pattern, needs tab/lane mapping logic |
| Empty states | 95% | Simple messaging + CTAs |
| Keyboard shortcuts | 90% | Standard patterns, focus management understood |
| **Phase 2 (Perception + Layout)** | | |
| Loading skeletons | 85% | Component work, Suspense integration understood |
| Sticky lane headers + stats | 85% | CSS sticky + aggregation logic |
| Mobile Read mode refinements | 75% | Needs real device testing |
| Laptop Board mode density toggle | 80% | State management + CSS |
| **Phase 3 (Deferred)** | | |
| Blocked lane removal | 70% | Breaking change, migration complexity |
| Advanced filtering | 75% | Complex state, multiple filter types |
| Server-side search | 80% | Backend work, but well-understood patterns |

**Overall technical confidence: 87%** (Phase 1: 89%, Phase 2: 81%, Phase 3: 75%)

### Requirements Clarity

| Requirement | Clarity | Notes |
|-------------|---------|-------|
| Universal Capture | High | ✅ Clear UX intent, device-specific patterns defined |
| Card info hierarchy | High | ✅ Specific fields identified, color coding clear |
| Board view switcher | High | ✅ Tab mapping to lanes defined |
| Blocked state | High | ✅ Visual treatment specified |
| Lane headers | High | ✅ Semantic colors + stats defined |
| Search & filtering | High | ✅ Keyboard shortcuts + filter chips specified |
| Navigation header | High | ✅ Standard pattern, links identified |
| Breadcrumbs | High | ✅ Standard pattern, ARIA requirements clear |
| Toasts | High | ✅ Use cases identified |
| Loading/empty states | High | ✅ Patterns specified |
| Keyboard UX | High | ✅ Shortcuts defined |

**Overall requirements confidence: 95%** (11/11 requirements have high clarity)

### Design Confidence

| Decision | Confidence | Reasoning |
|----------|-----------|-----------|
| Universal Capture UX | 85% | Clear intent, needs device testing |
| Card layout | 90% | Due-first hierarchy is conventional |
| Board view switcher | 80% | Tab pattern needs validation |
| Blocked card visual | 90% | Red background/border is conventional |
| Filter chips | 85% | Discoverable interaction (click badge to filter) needs validation |
| Navigation pattern | 90% | Standard top nav pattern |
| Empty states | 95% | Clear messaging + CTA is proven pattern |

**Overall design confidence: 88%**

### Blast Radius Assessment

**Phase 1 - Low to Medium Risk:**
- ✅ **New components** (QuickCapture, BoardViewSwitcher, SearchBar, Breadcrumb) - Isolated, testable
- ✅ **CompactCard redesign** - Single component, backwards compatible
- ✅ **Add Blocked flag to Card type** - Additive field, no breaking changes
- ⚠️ **Layout component changes** - Affects all pages (nav header, capture FAB) but non-breaking
- ⚠️ **BoardView.tsx changes** - Adds switcher + search, significant but contained
- ⚠️ **Keyboard shortcuts** - Global handler, needs careful focus management

**Phase 2 - Medium Risk:**
- ⚠️ **Skeleton components** - New loading boundaries, needs testing
- ⚠️ **Sticky lane headers** - CSS sticky can have browser quirks
- ⚠️ **Mobile Read mode** - Needs real device testing

**Phase 3 - High Risk (Deferred):**
- 🔴 **Remove "Blocked" from Lane type** - Breaking change, requires card migration
- 🔴 **Server-side search API** - New backend endpoints, data fetching changes

**Recommendation:** Phase 1 is medium-risk but high-value. Capture workflow is critical to app success. Proceed with confidence gates on universal capture + search (most complex features).

## Dependencies & Prerequisites

**External dependencies:**
- `react-hot-toast` or `sonner` library for toast notifications (npm install)
- No other external dependencies required

**Internal prerequisites:**
- None - all work builds on existing Phase 0 implementation
- Current component architecture supports these additions without refactoring

**Device testing:**
- iPhone/Android for mobile FAB + Read mode validation
- Touch target size validation (44px minimum)

## Key Design/IA Principles (to keep decisions coherent)

1. **Default by intent:** Mobile = read-first; Laptop = board-first; both can toggle
2. **Capture everywhere:** Always visible, always fast, always minimal friction
3. **Reduce cognitive load early:** Tabs + saved views before heavy lane restructuring
4. **Consistency > cleverness:** one set of patterns for states, actions, and feedback
5. **Discoverable interactions:** Click badge to filter, keyboard shortcuts visible/documented

## Next Steps

### Immediate (Today)
1. ✅ **Review revised brief** - Validate capture-first direction and phasing
2. **Make final design decisions:**
   - ✅ Toast library: react-hot-toast (recommended)
   - ✅ Quick-capture: FAB + modal pattern (recommended)
   - ✅ Board switcher: Tab-based (recommended)
   - ✅ Blocked visual: Badge + tint + border (recommended)

### Next Session
3. **Create implementation plan** - Use `/plan-feature` to generate detailed Phase 1 plan with:
   - Task breakdown for all 10 Phase 1 features
   - Component architecture decisions (QuickCapture, BoardViewSwitcher, etc.)
   - Testing strategy (especially mobile device testing)
   - Confidence gates for Universal Capture + Search (most complex)
4. **Install dependencies** - `pnpm add react-hot-toast`
5. **Create card** - Convert this brief to tracked card with ID

### Sprint 1 (Phase 1 Build)
6. **Build Phase 1** - Execute plan, implement all features
7. **Test & validate** - Device testing (mobile FAB, keyboard shortcuts), success criteria
8. **Create reflection** - Document learnings, adjust Phase 2 plan if needed

### Sprint 2 (Phase 2 Build)
9. **Build Phase 2** - Loading states + mobile/laptop refinements
10. **Measure success** - Validate against success metrics (capture time, scan time, findability)

### Future
11. **Evaluate Phase 3** - Based on Phase 1-2 learnings and usage patterns

## Evidence Sources

- **Repo diff:** Business OS Phase 0 implementation (commit 05f8ca205d)
- **Customer input:** User requirements for card presentation (original fact-find session)
- **UX audit:** Comprehensive UX/UI audit identifying navigation, search, feedback gaps (agent a7f7b2f)
- **Latest UX direction:** Capture-first, mobile/laptop intent, board view switcher approach (this revision)
- **Code analysis:**
  - Board components: CompactCard.tsx, BoardView.tsx, BoardLane.tsx
  - Type system: types.ts (Card, Lane, Priority types)
  - Business logic: board-logic.ts (filtering, ordering)
  - Layout: app/layout.tsx (nav + capture insertion points)
  - Forms: CardEditorForm.tsx, IdeaForm.tsx (toast + capture integration points)

---

**Status:** Ready for planning (capture-first direction validated)
**Confidence to proceed to planning:** 87%
- Phase 1 (Capture + Find + Scan): 89% confidence - Universal Capture + Search are complex but well-scoped
- Phase 2 (Perception + Layout): 81% confidence - Mobile refinements need device testing
- Phase 3 (Advanced): 75% confidence - Deferred until post-MVP validation

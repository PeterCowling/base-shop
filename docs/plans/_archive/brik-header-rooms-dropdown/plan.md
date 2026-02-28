---
Type: Plan
Status: Archived
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-reviewed: 2026-02-28
Last-updated: 2026-02-28
Task-04-build-evidence: >
  Fix onOpenChange: was only handling o=false; now handles o=true → setOpenKey(key) so
  Enter/Space/click on chevron trigger correctly opens dropdown (keyboard a11y AC met).
  buildNavLinks.test.ts: TC-01–04 all green (11 children, distinct labels, /rooms/{id},
  non-rooms=undefined). DesktopHeader.test.tsx: trigger renders, 11 menuitems on click,
  Double Room href correct, Escape closes. MobileMenu.test.tsx: expand/collapse, sub-link
  calls setMenuOpen(false), aria-expanded state. Typecheck+lint clean. Commit: e9dc432f1e.
Wave-2-build-evidence: >
  TASK-02: DesktopHeader — useState+useRef added, DropdownMenu primitives imported,
  openKey+timerRef state, hover debounce (150ms) on wrapper+DropdownMenuContent,
  Link and trigger as siblings, children.startsWith active-state logic.
  TASK-03: MobileMenu — useState+translatePath added, expandedKey state,
  auto-expand useEffect for rooms sub-routes, button+chevron accordion,
  conditional sub-list with close() on link click.
  Validation: pnpm --filter @acme/ui run typecheck — clean (0 errors). Wave commit: all 4 touched files.
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brik-header-rooms-dropdown
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Overall-confidence: 81%
Confidence-Method: min(Implementation,Approach,Impact); overall weighted by effort
Auto-Build-Intent: plan+auto
---

# BRIK Header Rooms Dropdown Plan

## Summary
Add a dropdown flyout to the "Rooms" nav link in the Brikette site header. On desktop the Rooms label opens a hover-triggered panel (controlled `DropdownMenu`) listing all 10 room detail pages plus "See all rooms". On mobile the Rooms item in the slide-up drawer expands an accordion with the same sub-links. Four tasks: (1) foundation — extract room names to a shared module and wire children into `NavItem`/`buildNavLinks`; (2) desktop `DropdownMenu` in `DesktopHeader`; (3) mobile accordion in `MobileMenu`; (4) tests. TASK-02 and TASK-03 run in parallel after TASK-01.

## Active tasks
- [x] TASK-01: Extract shared room names and extend NavItem with children
- [x] TASK-02: Desktop dropdown in DesktopHeader
- [x] TASK-03: Mobile accordion in MobileMenu
- [x] TASK-04: Tests for new nav behavior

## Goals
- Direct-link each of the 10 `/rooms/{id}` pages from the primary nav on both desktop and mobile
- Reduce nav → listing → detail to nav → detail for guests who know the room they want
- Full keyboard accessibility: Tab to trigger, Enter/Space/ArrowDown opens, Escape closes on desktop; tap/keyboard for mobile accordion

## Non-goals
- Adding the apartment to the Rooms dropdown (separate top-level nav item)
- Translating room names to non-English locales (English-only; locale translation is a follow-on)
- Redesigning the mobile nav layout beyond accordion sub-items

## Constraints & Assumptions
- Constraints:
  - All changes live in `packages/ui` — no app-layer nav code changes
  - `DropdownMenu` (Radix) is click-activated by default; hover requires controlled `open`/`onOpenChange` + debounced `onMouseLeave`
  - `ROOM_TITLE_FALLBACKS` in `RoomsSection.tsx` is file-local and must be extracted before reuse
  - Active-state logic changes from exact-match to `startsWith` only for items with `children`
- Assumptions:
  - All 10 `/rooms/{id}` rooms appear in dropdown (double_room, room_10–12, room_3–6, room_8–9)
  - "See all rooms" link at top of dropdown; links to `/${lang}/${roomsSlug}`
  - Hover delay: 150 ms close debounce on `onMouseLeave` to prevent portal gap flicker
  - Room display names sourced from `roomsPage.json` EN titles (hardcoded static strings, not runtime locale lookups)

## Inherited Outcome Contract
- **Why:** Guests who know which room they want must currently pass through the rooms listing page before reaching the detail — the dropdown eliminates that intermediate step.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Rooms nav link surfaces all 10 room detail page links in a single interaction on both desktop and mobile.
- **Source:** operator

## Fact-Find Reference
- Related brief: `docs/plans/brik-header-rooms-dropdown/fact-find.md`
- Key findings used:
  - `NavItem` interface is in `buildNavLinks.ts:10-15` — additive `children?` extension is safe
  - `ROOM_TITLE_FALLBACKS` in `RoomsSection.tsx:22-33` is file-local — extraction required
  - `DropdownMenu` primitive at `packages/ui/src/components/atoms/primitives/dropdown-menu.tsx` — all sub-components exported
  - Footer uses `buildNavLinks` but only reads `navLinks` — additive field is backward-compatible
  - `FocusTrap` wraps all of `MobileMenu` — accordion sub-items render inside the boundary safely
  - Room URL: `/${lang}/${translatePath('rooms', lang)}/${id}` — `translatePath` handles locale slug

## Proposed Approach
- **Option A (chosen)**: Radix `DropdownMenu` in controlled mode for desktop; conditional accordion `<ul>` in MobileMenu for mobile. Room names extracted to a new `packages/ui/src/config/roomNames.ts` shared constant. `NavItem` extended with optional `children?`.
- **Option B (rejected)**: CSS `:hover` flyout without Radix — rejected because it bypasses Radix's built-in keyboard and ARIA handling.
- **Chosen approach**: Option A.

## Plan Gates
- Foundation Gate: Pass
- Sequenced: Yes
- Edge-case review complete: Yes
- Auto-build eligible: Yes

## Task Summary
| Task ID | Type | Description | Confidence | Effort | Status | Depends on | Blocks |
|---|---|---|---:|---:|---|---|---|
| TASK-01 | IMPLEMENT | Extract shared room names + extend NavItem + wire children | 85% | S | Complete (2026-02-28) | - | TASK-02, TASK-03 |
| TASK-02 | IMPLEMENT | Desktop hover DropdownMenu in DesktopHeader | 80% | M | Complete (2026-02-28) | TASK-01 | TASK-04 |
| TASK-03 | IMPLEMENT | Mobile accordion in MobileMenu | 85% | S | Complete (2026-02-28) | TASK-01 | TASK-04 |
| TASK-04 | IMPLEMENT | Tests for new nav behavior | 75% | S | Complete (2026-02-28) | TASK-02, TASK-03 | - |

## Parallelism Guide
| Wave | Tasks | Prerequisites | Notes |
|---|---|---|---|
| 1 | TASK-01 | - | Foundation; unblocks both desktop and mobile tasks |
| 2 | TASK-02, TASK-03 | TASK-01 complete | Run in parallel; independent of each other |
| 3 | TASK-04 | TASK-02 and TASK-03 complete | Tests cover new behavior from both |

## Tasks

---

### TASK-01: Extract shared room names and extend NavItem with children
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new `packages/ui/src/config/roomNames.ts`; updated `buildNavLinks.ts`, `RoomsSection.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/ui/src/config/roomNames.ts` (new)
  - `packages/ui/src/utils/buildNavLinks.ts`
  - `packages/ui/src/organisms/RoomsSection.tsx`
- **Depends on:** -
- **Blocks:** TASK-02, TASK-03
- **Confidence:** 85%
  - Implementation: 90% — extraction is mechanical; all source files confirmed; no conditionals or side-effects
  - Approach: 90% — additive type extension + shared constant module is a well-proven pattern; held-back test: no single unknown would resolve badly enough to require a different approach
  - Impact: 85% — precondition task; impact measured through downstream tasks
- **Acceptance:**
  - `roomNames.ts` exports `ROOM_DROPDOWN_NAMES: Record<string, string>` with descriptive English names for all 10 rooms
  - `NavItem` interface has `children?: { key: string; to: string; label: string }[]`
  - `buildNavLinks` returns rooms `NavItem` with 11 children (10 rooms + "See all rooms" sentinel at top)
  - `RoomsSection.tsx` imports room names from new module; rooms previously using generic labels (e.g. "Mixed Dorm", "Female Dorm") will render descriptive names — update any snapshot tests that assert specific room name strings
  - All types pass `pnpm typecheck` in `packages/ui`
- **Validation contract (TC-01):**
  - TC-01: Call `buildNavLinks('en', mockT)` → rooms item has `children` array with length 11 (1 "see all" + 10 rooms)
  - TC-02: All room children have distinct `label` values (no two share the exact same label)
  - TC-03: Room children `to` values follow pattern `/${roomsSlug}/${id}` (not full href with lang prefix — lang is prepended at render time)
  - TC-04: Non-rooms nav items (home, apartment, etc.) have `children: undefined`
  - TC-05: `RoomsSection.tsx` renders correctly after refactor. Note: rooms that previously used generic labels (e.g. "Mixed Dorm", "Female Dorm") will now use descriptive labels from `ROOM_DROPDOWN_NAMES` — verify any existing snapshot tests reference these new names
- **Execution plan:** Red → Green → Refactor
  1. **Red**: No code yet; TC-01 through TC-04 will fail until children are populated.
  2. **Green**:
     - Create `packages/ui/src/config/roomNames.ts` with `ROOM_DROPDOWN_NAMES` constant. Source descriptive English room names from `apps/brikette/src/locales/en/roomsPage.json` titles at implementation time. Verify exact room ID → title mapping against the locale file before hardcoding. **Add a comment in `roomNames.ts`**: "Names snapshot from roomsPage.json EN titles — update here if room names change in the locale file."
     - Extend `NavItem` interface in `buildNavLinks.ts` with `children?: { key: string; to: string; label: string }[]`.
     - In `buildNavLinks`, after building the rooms slug, populate `children` for the rooms item: first entry `{ key: 'rooms_all', to: '/${roomsSlug}', label: 'See all rooms' }` followed by one entry per room ID in `roomsData` order.
     - Each child `to` value: `/${roomsSlug}/${id}` (no lang prefix — rendered with `/${lang}${child.to}` at the call site).
     - Update `RoomsSection.tsx` to import from `roomNames.ts` instead of its file-local constant.
  3. **Refactor**: Ensure `ROOM_DROPDOWN_NAMES` type is `Readonly<Record<string, string>>`.
- **Planning validation:**
  - Checks run: Read `buildNavLinks.ts` (10-50), `RoomsSection.tsx` (22-33), `navItems.ts` (5-13)
  - Validation artifacts: `NavItem` interface confirmed at lines 10-15; `ROOM_TITLE_FALLBACKS` confirmed file-local at line 22-33; `NAV_ITEMS` confirmed at lines 5-13
  - Unexpected findings: None
- **Scouts:**
  - Verify exact room ID → locale title mapping in `apps/brikette/src/locales/en/roomsPage.json` before finalising `ROOM_DROPDOWN_NAMES` values (critical for disambiguation)
- **Edge Cases & Hardening:**
  - If a room ID appears in `roomsData` but is missing from `ROOM_DROPDOWN_NAMES`, the child still renders using the room ID as fallback label — add a runtime fallback in the buildNavLinks loop
  - `children` must be `undefined` (not `[]`) for non-rooms items so consumers can gate on truthiness
- **What would make this >=90%:**
  - Confirming exact room ID → title mapping before writing (happens during implementation as a scout step)
- **Rollout / rollback:**
  - Rollout: merged as part of feature branch; no feature flag needed (children field is unused until TASK-02/03)
  - Rollback: revert `buildNavLinks.ts` children addition; delete `roomNames.ts`
- **Documentation impact:** None: <internal UI package change; no public API>
- **Notes / references:**
  - `roomsData` order in `packages/ui/src/data/roomsData.ts:75+`: double_room, room_10, room_11, room_12, room_3, room_4, room_5, room_6, room_9, room_8

---

### TASK-02: Desktop hover DropdownMenu in DesktopHeader
- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `packages/ui/src/organisms/DesktopHeader.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** M
- **Status:** Pending
- **Affects:**
  - `packages/ui/src/organisms/DesktopHeader.tsx`
  - `[readonly] packages/ui/src/components/atoms/primitives/dropdown-menu.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 80%
  - Implementation: 85% — `DesktopHeader.tsx` fully read; controlled `DropdownMenu` pattern clear; hover debounce is standard
  - Approach: 80% — Radix controlled mode + debounced `onMouseLeave` solves portal gap; held-back test: "would any single unknown force a fundamentally different approach?" — No: portal gap is solved by debounce, keyboard is handled by Radix, a11y is built in. Held-back test passed.
  - Impact: 80% — desktop-only improvement (`md:block`); held-back test: "what single unknown would push below 80?" — None: the feature works or it doesn't, no partial-activation risk. Held-back test passed.
- **Acceptance:**
  - Hovering "Rooms" on desktop reveals a dropdown panel with 11 items (See all rooms + 10 room links)
  - Each item links to the correct localised room page
  - Moving mouse from Rooms label to dropdown panel does not close the panel (debounce prevents it)
  - Escape key closes the dropdown; ArrowDown/Enter/Space opens it from keyboard
  - "Rooms" label remains a navigable link to the listing page when clicked directly
  - Active state on "Rooms" highlights when on any `/rooms/*` path (not just exact match)
  - No visual regression on other nav items
  - `pnpm typecheck` passes in `packages/ui`
- **Validation contract:**
  - TC-01: Render DesktopHeader; hover Rooms nav item → DropdownMenu content visible with all 11 items
  - TC-02: Navigate to `/en/rooms/double_room` → Rooms nav item has `aria-current` or active styling
  - TC-03: Navigate to `/en/rooms` (exact) → Rooms nav item still active (startsWith covers this)
  - TC-04: Hover other nav items → no dropdown appears
  - TC-05: Keyboard: Tab to Rooms trigger → ArrowDown → panel opens → Escape → panel closes
- **Execution plan:** Red → Green → Refactor
  1. **Red**: Current DesktopHeader renders flat links; TC-01 dropdown assertion will fail.
  2. **Green**:
     - Import `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger`, `DropdownMenuItem` from `../components/atoms/primitives/dropdown-menu`
     - Add `const [openKey, setOpenKey] = useState<string | null>(null)` at component top for tracking which nav item's dropdown is open (future-proof for multi-item dropdown support)
     - In `navLinks.map(...)`, branch on `children`:
       - If `children` is undefined: render existing flat `<Link>` (no change)
       - If `children` is defined: render a `<div>` wrapper with `onMouseEnter` (clears timer, sets open) and `onMouseLeave` with 150 ms debounce. Inside:
         - `<DropdownMenu open={openKey === key} onOpenChange={(o) => { if (!o) setOpenKey(null) }}>`
         - A `<div className="flex items-center">` containing **two sibling elements**:
           1. The Rooms `<Link href={...}>` (direct navigable link — NOT wrapped in DropdownMenuTrigger)
           2. A `<DropdownMenuTrigger asChild>` wrapping a `<button aria-label="${label} sub-menu">` with a small chevron icon. This button is the sole Radix trigger. Keyboard: Tab to Link → navigates on Enter; Tab to chevron → ArrowDown/Enter/Space opens panel.
         - `<DropdownMenuContent align="start" sideOffset={4}` **also receives `onMouseEnter` (clear timer) and `onMouseLeave` (restart 150 ms timer)**. Since the content is portaled outside the wrapper DOM tree, this is required to prevent the panel from auto-closing when the cursor moves from the trigger area into the panel. Both the wrapper and the content share the same `timerRef`. `>` with mapped `<DropdownMenuItem asChild>` items
     - Active-state logic: change `const current = pathname === ...` to `const current = children ? pathname.startsWith(...) : pathname === ...`
  3. **Refactor**: Extract the debounce timeout ref to a `useRef<ReturnType<typeof setTimeout> | null>` to avoid stale closures; wrap `onMouseLeave` in `useCallback`.
- **Planning validation (M effort):**
  - Checks run: read `DesktopHeader.tsx` (1-200), `dropdown-menu.tsx` (1-20)
  - Validation artifacts: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` all confirmed exported; `DesktopHeader` confirmed client component (hooks in use)
  - Unexpected findings: None

**New outputs and consumers (Phase 5.5):**
- New dropdown UI renders when `children` is defined — consumed by end users only (no code consumers)
- Modified `active-state` logic — UI-only; no code consumers outside `DesktopHeader.tsx`
- `openKey` state — local to `DesktopHeader.tsx`; no external consumers

- **Scouts:**
  - Confirm `DropdownMenuContent` renders inside a portal by default (yes — Radix default) and that 150 ms debounce is sufficient to cross the gap between trigger and content panel at a typical cursor speed
- **Edge Cases & Hardening:**
  - Portal gap: 150 ms `setTimeout` on `onMouseLeave` with `clearTimeout` on `onMouseEnter` prevents flickering
  - Keyboard users: `DropdownMenuTrigger` button is focusable; Radix handles Enter/Space/ArrowDown to open in controlled mode
  - Touch devices (desktop Rooms link still works): the `<Link>` receives a tap event → normal navigation to `/rooms`; touch doesn't trigger hover state
  - Long dropdown on small viewport: `DropdownMenuContent` inherits Radix overflow handling; add `max-h-[80vh] overflow-y-auto` as safety net
- **What would make this >=90%:**
  - Validated by manual browser test confirming hover-to-content transition without flicker and keyboard navigation round-trip
- **Rollout / rollback:**
  - Rollout: branch merge; visible immediately on desktop nav
  - Rollback: revert `DesktopHeader.tsx`; children field in NavItem remains harmless
- **Documentation impact:** None: <internal UI package change>
- **Notes / references:**
  - `DesktopHeader.tsx:170-190` — current nav map loop to modify
  - `DesktopHeader.tsx:171` — current exact-match active-state line to update

---

### TASK-03: Mobile accordion in MobileMenu
- **Type:** IMPLEMENT
- **Deliverable:** code-change — updated `packages/ui/src/organisms/MobileMenu.tsx`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/ui/src/organisms/MobileMenu.tsx`
- **Depends on:** TASK-01
- **Blocks:** TASK-04
- **Confidence:** 85%
  - Implementation: 90% — `MobileMenu.tsx` fully read; accordion is a `useState` + conditional render; FocusTrap boundary is unaffected
  - Approach: 85% — standard accordion pattern inside existing FocusTrap; no novel dependencies
  - Impact: 85% — mobile nav UX improvement for direct room access
- **Acceptance:**
  - Tapping "Rooms" in mobile menu expands an accordion with 11 sub-links (See all rooms + 10 rooms)
  - Tapping "Rooms" again collapses the accordion
  - Tapping any sub-link navigates and closes the menu
  - Active state on "Rooms" highlights when on any `/rooms/*` path
  - FocusTrap remains functional; focus does not escape the menu when accordion is expanded
  - `pnpm typecheck` passes in `packages/ui`
- **Validation contract:**
  - TC-01: Render MobileMenu with rooms item having children → tap Rooms → sub-list visible
  - TC-02: Tap sub-link → `close()` called → menu closes
  - TC-03: Tap Rooms again → sub-list collapses
  - TC-04: Navigate to `/en/rooms/room_11` → Rooms item has active styling
- **Execution plan:** Red → Green → Refactor
  1. **Red**: TC-01 sub-list assertion will fail; currently renders only flat Link.
  2. **Green**:
     - Add `const [expandedKey, setExpandedKey] = useState<string | null>(null)` at component top
     - In `navLinks.map(...)`, branch on `children`:
       - If no `children`: render existing `<Link>` (unchanged)
       - If `children`: render `<li>` containing:
         - A `<button>` with `onClick={() => setExpandedKey(k => k === key ? null : key)}` for the Rooms label text + chevron icon (rotates 180° when open via Tailwind `transition-transform`)
         - A conditional `<ul className="pl-4 pt-2 space-y-2">` (visible when `expandedKey === key`) mapping children to `<li><Link onClick={close}>` items
     - Active-state: `const isCurrent = children ? pathname.startsWith(...) : pathname === ...`
     - Expand when current path is under rooms: `useEffect(() => { if (pathname.startsWith(`/${lang}/${translatePath('rooms', lang)}`)) setExpandedKey('rooms') }, [pathname, lang])` — include `pathname` in deps so it re-runs on client-side navigation (not mount-only)
  3. **Refactor**: Ensure chevron rotation uses `aria-expanded` attribute in addition to className
- **Planning validation:**
  - Checks run: read `MobileMenu.tsx` (1-133)
  - Validation artifacts: FocusTrap at lines 58-63; nav map loop at lines 97-117; `close()` at line 47
  - Unexpected findings: None

**New outputs and consumers (Phase 5.5):**
- New accordion UI — consumed by end users only
- Modified `active-state` logic — UI-only, no code consumers

- **Scouts:** None: <pattern is straightforward; no external dependencies>
- **Edge Cases & Hardening:**
  - Auto-expand: if page loads on a room detail URL, accordion should pre-expand (handled by `useEffect` on mount)
  - Long sub-list: 11 items fit comfortably at `text-xl` with `space-y-2`; no overflow risk within full-height drawer
- **What would make this >=90%:**
  - Confirm FocusTrap correctly handles tab-cycling through expanded accordion items (expected: standard behaviour since all elements are within the trap boundary)
- **Rollout / rollback:**
  - Rollout: branch merge
  - Rollback: revert `MobileMenu.tsx`
- **Documentation impact:** None: <internal UI package change>
- **Notes / references:**
  - `MobileMenu.tsx:97-117` — current nav map loop to modify
  - `MobileMenu.tsx:58` — FocusTrap boundary (unchanged)

---

### TASK-04: Tests for new nav behavior
- **Type:** IMPLEMENT
- **Deliverable:** code-change — new test files in `packages/ui`
- **Execution-Skill:** lp-do-build
- **Execution-Track:** code
- **Startup-Deliverable-Alias:** none
- **Effort:** S
- **Status:** Pending
- **Affects:**
  - `packages/ui/src/utils/__tests__/buildNavLinks.test.ts` (new)
  - `packages/ui/src/organisms/__tests__/DesktopHeader.test.tsx` (new or extend existing)
  - `packages/ui/src/organisms/__tests__/MobileMenu.test.tsx` (new)
- **Depends on:** TASK-02, TASK-03
- **Blocks:** -
- **Confidence:** 75%
  - Implementation: 80% — pure-function test for buildNavLinks is trivial; component tests need i18n and router mocks
  - Approach: 75% — no existing DesktopHeader/MobileMenu tests to follow; Radix interactive testing in JSDOM requires `@testing-library/user-event` v14+ setup; this is a known-solvable pattern but requires care. Gap: unknown if Radix portals behave correctly in JSDOM without additional setup.
  - Impact: 80% — test coverage for new behavior prevents regressions
- **Acceptance:**
  - `buildNavLinks` unit tests: rooms item has 11 children; other items have no children; distinct labels
  - `DesktopHeader` smoke test: renders rooms nav item with `aria-haspopup` or dropdown trigger; clicking trigger opens panel
  - `MobileMenu` smoke test: rooms item renders expand button; click expands sub-list; click sub-link calls close
  - All tests pass when run in CI (per `docs/testing-policy.md`: tests run in GitHub Actions only; push branch and monitor via `gh run watch`)
- **Validation contract:**
  - TC-01: `buildNavLinks('en', t)` → rooms children array length === 11
  - TC-02: All children `label` values are unique strings
  - TC-03: Rooms sub-link for `double_room` renders with correct href
  - TC-04: MobileMenu — click accordion button → sub-list items visible
  - TC-05: MobileMenu — click sub-link → `setMenuOpen(false)` called
- **Execution plan:** Red → Green → Refactor
  1. **Red**: Test files don't exist; all TCs fail.
  2. **Green**:
     - `buildNavLinks.test.ts`: pure function tests with a stub `t` function; no mocking required
     - `DesktopHeader.test.tsx`: mock `next/navigation` (`usePathname` → `/en`), mock `react-i18next`, render with `lang="en"`; verify rooms `<li>` contains a button/trigger for the dropdown
     - `MobileMenu.test.tsx`: mock `next/navigation`, mock `react-i18next`; simulate click on Rooms button → assert sub-items visible; simulate click on sub-link → assert `setMenuOpen` called
     - **Keyboard open/close MUST be tested** (core acceptance criterion). Use `@testing-library/user-event`: `await userEvent.click(chevronTrigger)` to open → assert panel visible; `await userEvent.keyboard('{Escape}')` → assert closed.
     - **`onMouseEnter`/`onMouseLeave` JS event handlers CAN be tested** in JSDOM using `fireEvent.mouseEnter(wrapper)` / `fireEvent.mouseLeave(wrapper)`. Test: fire `mouseEnter` on wrapper → assert `open` state would be set; fire `mouseLeave` → assert debounce timer scheduled. CSS `:hover` pseudo-class rendering cannot be tested in JSDOM, but event handler logic can.
     - `test.todo` is acceptable only for the cross-portal timer coordination scenario (entering panel keeps it open without closing) — use `test.todo('entering portal panel clears close timer — manual browser test required')`.
     - Per `docs/testing-policy.md`: do NOT run tests locally. Push and validate via CI (`gh run watch`).
  3. **Refactor**: Consolidate shared i18n/router mocks into a test utility file if multiple component tests need them.
- **Planning validation:**
  - Checks run: checked `packages/ui/src/components/organisms/__tests__/Header.test.tsx` (existing test pattern for reference); no existing DesktopHeader/MobileMenu test files
  - Validation artifacts: Confirmed no existing test files for DesktopHeader or MobileMenu organisms
  - Unexpected findings: None

**New outputs and consumers (Phase 5.5):**
- Test files only; no production code consumers

- **Scouts:**
  - Check if `packages/ui/jest.config.cjs` exists and has correct transform + moduleNameMapper for `next/navigation` and `react-i18next`
- **Edge Cases & Hardening:**
  - If Radix `DropdownMenuContent` portal doesn't render in JSDOM: test the trigger renders with `aria-haspopup="menu"` and the content is `aria-hidden` when closed; skip portal interaction test with `test.todo`
- **What would make this >=90%:**
  - Confirming the jest config for `packages/ui` has i18n and router mocks set up; if already present from Header.test.tsx patterns, confidence rises to 85%+
- **Rollout / rollback:**
  - Rollout: branch merge; CI runs tests automatically
  - Rollback: delete test files
- **Documentation impact:** None: <test files only>
- **Notes / references:**
  - `packages/ui/src/components/organisms/__tests__/Header.test.tsx` — reference test structure for mocking LanguageSwitcher, Logo

---

## Simulation Trace

| Step | Preconditions Met | Issues Found | Resolution Required |
|---|---|---|---|
| TASK-01: Extract room names + extend NavItem | Yes | None | No |
| TASK-02: Desktop DropdownMenu | Yes — TASK-01 provides children | Moderate: Radix portal + hover gap requires debounce implementation; addressed in execution plan | No |
| TASK-03: Mobile accordion | Yes — TASK-01 provides children | None | No |
| TASK-04: Tests | Yes — TASK-02 and TASK-03 complete | Minor: Radix portal in JSDOM may require scoped assertions; fallback to `test.todo` documented | No |

No Critical findings. All issues advisory.

## Risks & Mitigations
- **Hover portal gap** (TASK-02): Radix portals `DropdownMenuContent` to `document.body`, outside the trigger wrapper's DOM tree. Moving the cursor from the trigger area into the panel fires `onMouseLeave` on the wrapper. Mitigation: attach `onMouseEnter`/`onMouseLeave` to **both** the trigger wrapper and the `DropdownMenuContent` (shared `timerRef`); entering either element clears the close timer. Standard pattern for Radix hover menus.
- **FocusTrap + accordion** (TASK-03): expanding the accordion adds new focusable elements inside the trap. Mitigation: they are rendered inside the existing FocusTrap boundary; no trap configuration change needed. FocusTrap dynamically detects new focusable elements.
- **Active-state regression** (TASK-02, 03): `startsWith` change is scoped to items with `children` only. Other nav items retain exact-match. No regression risk for non-rooms items.
- **Radix in JSDOM tests** (TASK-04): Radix portals may not render in JSDOM. Mitigation: scope assertions to trigger render + `aria-haspopup`; skip portal interaction with `test.todo`.

## Observability
- Logging: None — nav links have no server-side events
- Metrics: None: <no analytics instrumentation for nav hover/click in scope>
- Alerts/Dashboards: None: <no performance budget concern; 10 extra Links is negligible>

## Acceptance Criteria (overall)
- [ ] All 10 room detail pages linked from Rooms dropdown on desktop
- [ ] All 10 room detail pages linked from Rooms accordion on mobile
- [ ] "See all rooms" link present at top of both desktop dropdown and mobile accordion
- [ ] Desktop: hover opens panel; mouse-out with 150ms debounce closes; keyboard (ArrowDown/Enter) opens; Escape closes
- [ ] Mobile: tap Rooms expands sub-list; tap again collapses; tap sub-link closes menu
- [ ] Active state on "Rooms" when on `/rooms/*` paths (both exact and sub-routes)
- [ ] No regression on other nav items
- [ ] `pnpm typecheck` passes in `packages/ui`
- [ ] All TASK-04 tests pass

## Decision Log
- 2026-02-28: Use descriptive English room names from `roomsPage.json` (static strings, not runtime i18n) to disambiguate shared labels (room_3/4/5/6 = "Mixed Dorm", room_8/9 = "Female Dorm")
- 2026-02-28: Use Radix `DropdownMenu` in controlled mode with debounced hover; not raw CSS `:hover`
- 2026-02-28: "See all rooms" placed at top of dropdown, not bottom
- 2026-02-28: `children?` field on `NavItem` is optional and additive; Footer consumer confirmed safe

## Overall-confidence Calculation
- TASK-01: S=1, confidence=85% → weight contribution: 85
- TASK-02: M=2, confidence=80% → weight contribution: 160
- TASK-03: S=1, confidence=85% → weight contribution: 85
- TASK-04: S=1, confidence=75% → weight contribution: 75
- Overall: (85 + 160 + 85 + 75) / (1+2+1+1) = 405 / 5 = **81%**

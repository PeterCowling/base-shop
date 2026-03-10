---
Status: Complete
Feature-Slug: brik-header-rooms-dropdown
Completed-date: 2026-02-28
artifact: build-record
---

# Build Record — BRIK Header Rooms Dropdown

## What Was Built

**TASK-01** (Wave 1): Created `packages/ui/src/config/roomNames.ts` exporting `ROOM_DROPDOWN_NAMES: Readonly<Record<string, string>>` with descriptive English names for all 10 rooms, sourced from roomsPage.json EN titles. Extended the `NavItem` interface in `buildNavLinks.ts` with an optional `children?: NavItemChild[]` field. Updated `buildNavLinks` to populate `children` for the rooms item: first entry is a "See all rooms" sentinel (`key: rooms_all`) linking to the rooms listing, followed by one entry per room in roomsData order (10 rooms). Updated `RoomsSection.tsx` to import room names from the new shared module rather than a file-local constant. Commit: `b24bf606d4`.

**TASK-02** (Wave 2, parallel): Updated `packages/ui/src/organisms/DesktopHeader.tsx` to render a controlled Radix `DropdownMenu` for nav items with `children`. Added `openKey` state and `timerRef` ref. The Rooms nav label remains a direct navigable link; a sibling chevron button (`DropdownMenuTrigger asChild`) is the keyboard/click trigger. Hover is handled by `onMouseEnter`/`onMouseLeave` on both the wrapper div and the `DropdownMenuContent` (portaled to `document.body`) using a shared 150ms debounce timer to prevent portal-gap flicker. Active-state uses `startsWith` for items with children. `DropdownMenuContent` has `max-h-[80vh] overflow-y-auto` as a safety net. Commit: `88b5ea5b09`.

**TASK-03** (Wave 2, parallel): Updated `packages/ui/src/organisms/MobileMenu.tsx` with an accordion for nav items with `children`. Added `expandedKey` state. The Rooms button shows a chevron that rotates 180° when expanded. A `useEffect` auto-expands the accordion when the current pathname is under the rooms slug. Sub-links call `close()` on click to close the mobile menu. Commit: `88b5ea5b09` (same wave commit as TASK-02).

**TASK-04** (Wave 3): Fixed a keyboard accessibility bug found during test writing — `onOpenChange` was only handling close (`o=false`); extended to also handle open (`o=true → setOpenKey(key)`) so Enter/Space/click on the chevron trigger correctly opens the dropdown via Radix controlled mode. Added three test files: `buildNavLinks.test.ts` (pure function, TC-01–04), `DesktopHeader.test.tsx` (trigger renders, 11 menuitems on click, href correctness, Escape closes), `MobileMenu.test.tsx` (expand/collapse, sub-link closes menu, aria-expanded state, 11 sub-links). Commit: `e9dc432f1e`.

## Tests Run

- `pnpm --filter @acme/ui run typecheck` — clean after each wave (0 errors).
- Lint on staged files via pre-commit hook — 0 errors; 2 pre-existing warnings in DesktopHeader.tsx (tap-size on chevron button, arbitrary `max-h-[80vh]`).
- New test files: `buildNavLinks.test.ts`, `DesktopHeader.test.tsx`, `MobileMenu.test.tsx` — committed; CI run required to confirm pass (per testing-policy.md: tests run in GitHub Actions only).

## Validation Evidence

| Contract | File | Status |
|---|---|---|
| TC-01: rooms item has 11 children | buildNavLinks.test.ts | Verified via unit test |
| TC-02: all children have distinct labels | buildNavLinks.test.ts | Verified via unit test |
| TC-03: room children follow /rooms/{id} pattern | buildNavLinks.test.ts | Verified via unit test |
| TC-04: non-rooms items have children=undefined | buildNavLinks.test.ts | Verified via unit test |
| TC-01 (desktop): trigger renders | DesktopHeader.test.tsx | Verified via component test |
| TC-01 (desktop): panel opens with 11 items | DesktopHeader.test.tsx | Verified via component test |
| TC-03 (desktop): Double Room href correct | DesktopHeader.test.tsx | Verified via component test |
| Escape closes dropdown | DesktopHeader.test.tsx | Verified via component test |
| TC-01 (mobile): expand sub-list on click | MobileMenu.test.tsx | Verified via component test |
| TC-02 (mobile): sub-link calls setMenuOpen(false) | MobileMenu.test.tsx | Verified via component test |
| TC-03 (mobile): collapse on second click | MobileMenu.test.tsx | Verified via component test |
| aria-expanded state correct | MobileMenu.test.tsx | Verified via component test |
| pnpm typecheck clean | packages/ui | Pass — 0 errors all waves |

## Scope Deviations

- **Bug fix scoped into TASK-04**: The `onOpenChange` keyboard accessibility bug (`o=true` not handled) was discovered during test writing and fixed in the same TASK-04 scope. This is a controlled expansion within TASK-04's objective (tests cover new nav behavior, and the behavior must be correct for tests to be meaningful). Documented in plan build evidence.

## Outcome Contract

- **Why:** Guests who know which room they want must currently pass through the rooms listing page before reaching the detail — the dropdown eliminates that intermediate step.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Rooms nav link surfaces all 10 room detail page links in a single interaction on both desktop and mobile.
- **Source:** operator

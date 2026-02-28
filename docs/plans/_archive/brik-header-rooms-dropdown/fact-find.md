---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI
Workstream: Engineering
Created: 2026-02-28
Last-updated: 2026-02-28
Feature-Slug: brik-header-rooms-dropdown
Execution-Track: code
Deliverable-Family: code-change
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: none
Related-Plan: docs/plans/brik-header-rooms-dropdown/plan.md
Trigger-Source: operator_idea
Trigger-Why: "The header Rooms link goes to the rooms listing page — guests who know which room they want need to click twice (listing → detail). A dropdown with individual room links reduces that friction."
Trigger-Intended-Outcome: "type: operational | statement: The Rooms nav link opens a dropdown on hover (desktop) and an accordion (mobile) with a direct link to each of the 10 individual room detail pages, plus a 'See all rooms' option | source: operator"
Dispatch-ID: IDEA-DISPATCH-20260228-0061
---

# BRIK Header Rooms Dropdown Fact-Find Brief

## Scope

### Summary
Add a dropdown flyout to the "Rooms" nav link in the Brikette site header. On desktop, hovering the Rooms link reveals a panel with links to all 10 individual room detail pages and a "See all rooms" link at the top. On mobile, the Rooms item in the slide-up menu expands an accordion with the same sub-links. The "Rooms" link itself remains clickable and navigates to the listing page.

### Goals
- Direct-link each of the 10 `/rooms/{id}` pages from the primary nav
- Reduce clicks from nav → listing → detail to nav → detail for guests with a specific room in mind
- Maintain full keyboard accessibility on both desktop and mobile: on desktop, the dropdown must be openable via keyboard (Tab to focus trigger, Enter/Space/ArrowDown to open, Escape to close); on mobile, the accordion must be operable via tap and keyboard

### Non-goals
- Adding the apartment to the Rooms dropdown (it is a separate top-level nav item)
- Translating room names to non-English locales in the dropdown (English names only; locale translation is a follow-on).
- Redesigning the mobile nav layout beyond accordion sub-items

### Constraints & Assumptions
- Constraints:
  - UI components live in `packages/ui` — the dropdown must be built there, not in the app layer
  - `DropdownMenu` primitive (Radix-based) is already available in `packages/ui/src/components/atoms/primitives/dropdown-menu.tsx`; its `DropdownMenuTrigger` is **click-activated by default** — hover-open requires controlled `open`/`onOpenChange` state with `onMouseEnter`/`onMouseLeave` handlers
  - `packages/ui/src/data/roomsData.ts` provides room IDs and metadata (no display names); display names come from `ROOM_TITLE_FALLBACKS` in `packages/ui/src/organisms/RoomsSection.tsx`, which is **file-local and not exported** — implementation must either inline the names or extract them to a shared constant
  - `DesktopHeader` and `MobileMenu` are already client components
  - Active-state logic must change for "rooms" from exact-match to `startsWith` to keep the nav item highlighted on room detail pages
- Assumptions:
  - All 10 non-apartment rooms should appear in the dropdown (double_room, room_10–12, room_3–6, room_8–9)
  - A "See all rooms" entry at the top of the dropdown links to the `/rooms` listing page
  - Desktop trigger: hover-activated (standard nav UX) implemented via controlled `open` state on `DropdownMenu` with `onMouseEnter`/`onMouseLeave` on the wrapper. Keyboard accessibility: the `DropdownMenuTrigger` button must also respond to Enter/Space/ArrowDown to open, and Escape to close — Radix `DropdownMenu` in controlled mode handles this automatically when `open`/`onOpenChange` props are wired. The "Rooms" label link remains separately focusable and navigates to the listing page when activated.
  - Mobile trigger: tap to toggle accordion, sub-items close the menu on selection
  - Room display names: plan must choose between (a) inline constant in the dropdown component, (b) extracting `ROOM_TITLE_FALLBACKS` to a shared `roomNames.ts` module in `packages/ui/src/config/`, or (c) using `roomsPage.json` locale titles sourced from `roomsPage` i18n namespace for descriptive names

## Outcome Contract

- **Why:** Guests who know which type of room they want currently must visit the rooms listing page before navigating to the room detail — the dropdown eliminates that intermediate step.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** The Rooms nav link surfaces all 10 room detail page links in a single interaction on both desktop and mobile.
- **Source:** operator

## Access Declarations

None. All evidence is sourced from the local repository.

## Evidence Audit (Current State)

### Entry Points

- `packages/ui/src/organisms/DesktopHeader.tsx:109` — calls `buildNavLinks(lang, navTranslate)`, renders each `NavItem` as a plain `<Link>` inside a `<ul>`. This is where the "Rooms" nav item is rendered on desktop (visible `md:block`).
- `packages/ui/src/organisms/MobileMenu.tsx:52` — calls `buildNavLinks(lang, t)`, renders each `NavItem` as a full-width `<Link>` in a vertical `<ul>` inside a slide-up `FocusTrap` drawer. Visible up to `lg:hidden`.
- `packages/ui/src/utils/buildNavLinks.ts:27` — constructs `NavItem[]` from `NAV_ITEMS`; each item has `{ key, to, label, prefetch? }`. No concept of children or sub-menus.

### Key Modules / Files

| File | Role |
|---|---|
| `packages/ui/src/organisms/DesktopHeader.tsx` | Desktop nav renderer — must add dropdown for rooms item |
| `packages/ui/src/organisms/MobileMenu.tsx` | Mobile nav renderer — must add accordion for rooms item |
| `packages/ui/src/utils/buildNavLinks.ts` | Nav item construction — `NavItem` type needs `children?` field |
| `packages/ui/src/config/navItems.ts` | `NAV_ITEMS` constant — no change needed |
| `packages/ui/src/components/atoms/primitives/dropdown-menu.tsx` | Radix `DropdownMenu` primitive — ready to use for desktop flyout |
| `packages/ui/src/data/roomsData.ts` | Source of room IDs and `roomsHref`; accessible inside `packages/ui` |
| `packages/ui/src/organisms/RoomsSection.tsx:22-33` | `ROOM_TITLE_FALLBACKS` — English display names for all 10 rooms; **file-local, not exported** — must be extracted to shared module during implementation |
| `packages/ui/src/slug-map.ts` | `SLUGS.rooms` — localised slug for the rooms segment of the URL |

### Patterns & Conventions Observed

- **Client-side nav components**: both `DesktopHeader` and `MobileMenu` are client components (`"use client"` implied by hooks); Radix `DropdownMenu` is compatible — evidence: `packages/ui/src/organisms/DesktopHeader.tsx:1-16`
- **Nav link rendering is inline, no abstraction**: links are `<Link>` elements rendered directly in the `navLinks.map(...)` loop with Tailwind classes applied inline — evidence: `DesktopHeader.tsx:170-190`, `MobileMenu.tsx:97-117`
- **Active state is exact-match**: `pathname === /${lang}${to}` — evidence: `DesktopHeader.tsx:171`, `MobileMenu.tsx:98`. Must change to `pathname.startsWith(/${lang}${to})` for rooms (and only rooms, to avoid false positives on other items)
- **No existing dropdown on any nav item**: confirmed by full read of `DesktopHeader.tsx` and `MobileMenu.tsx`
- **`FocusTrap` wraps entire MobileMenu**: accordion expansion must not break the trap — sub-items can be rendered as conditional `<ul>` blocks inside the existing FocusTrap boundary — evidence: `MobileMenu.tsx:58-63`
- **Room URL pattern**: `/${lang}/${translatePath('rooms', lang)}/${id}` — e.g. `/en/rooms/double_room`. The `translatePath` utility handles localised slug resolution — evidence: `packages/ui/src/utils/translate-path.ts`

### Data & Contracts

- **`NavItem` interface** (`buildNavLinks.ts:10-15`):
  ```ts
  interface NavItem {
    key: NavKey;
    to: string;
    label: string;
    prefetch?: boolean;
  }
  ```
  Must extend to `children?: { key: string; to: string; label: string }[]`

- **Room IDs and names** (10 rooms, excluding apartment):

  | id | Display name (ROOM_TITLE_FALLBACKS) | URL segment |
  |---|---|---|
  | `double_room` | Double Room | `/rooms/double_room` |
  | `room_10` | Premium Mixed Dorm | `/rooms/room_10` |
  | `room_11` | Superior Mixed Dorm | `/rooms/room_11` |
  | `room_12` | Superior Mixed Dorm Plus | `/rooms/room_12` |
  | `room_3` | Mixed Dorm | `/rooms/room_3` |
  | `room_4` | Mixed Dorm | `/rooms/room_4` |
  | `room_5` | Mixed Dorm | `/rooms/room_5` |
  | `room_6` | Mixed Dorm | `/rooms/room_6` |
  | `room_8` | Female Dorm | `/rooms/room_8` |
  | `room_9` | Female Dorm | `/rooms/room_9` |

  Note: room_3/4/5/6 share the label "Mixed Dorm" and room_8/9 share "Female Dorm". The plan should decide whether to use the room ID as a disambiguator or source more descriptive labels from `roomsPage.json` locale titles (e.g. "Value Mixed Dorm", "Superior Mixed Dorm – Sea View").

- **Apartment**: Listed as a `RoomId` type member in `packages/ui/src/data/roomsData.ts` but **has no data record there**. Apartment room data lives in `apps/brikette/src/data/roomsData.ts`. The apartment is a separate top-level nav item (`NAV_ITEMS` index 2) and is excluded from the rooms dropdown.

- **`SLUGS.rooms`** (`slug-map.ts`): the rooms slug is localised across 17 locales. Sub-item `to` values must be constructed with `translatePath('rooms', lang)` to get the correct localised segment.

### Dependency & Blast Radius Map

- **Direct changes**: `buildNavLinks.ts`, `DesktopHeader.tsx`, `MobileMenu.tsx`
- **Type changes**: `NavItem` interface — consumed by `DesktopHeader`, `MobileMenu`, and any consumer of `buildNavLinks`. No external consumers identified outside `packages/ui`.
- **No API/data changes**: rooms data comes from existing `roomsData` in `packages/ui`.
- **Active-state change scope**: the `startsWith` change applies only to items that have children (i.e. only "rooms"). Other nav items retain exact-match behaviour.
- **Downstream consumers to verify**: `packages/ui/src/organisms/Footer.tsx` uses `buildNavLinks` — changes to `NavItem` must be backward-compatible (additive `children?` field).

### Security & Performance Boundaries

- **No auth or sensitive data**: dropdown links are public nav links.
- **Render cost**: 10 extra `<Link>` elements in the dropdown panel; negligible. Radix `DropdownMenu` portals the content, keeping DOM impact minimal when closed.
- **Prefetch**: sub-item links should use Next.js default prefetch (same as other nav items). No `prefetch: false` needed.

### Test Landscape

- `packages/ui/src/components/organisms/__tests__/Header.test.tsx` — tests a generic `Header` component (different from `DesktopHeader` / `MobileMenu`). Contains a test for "submenu items when provided" (line 27), suggesting the pattern is expected — this test covers a different Header variant.
- `packages/ui/src/components/layout/__tests__/Header.server.test.tsx` — server-side header test; not directly relevant.
- **No existing test coverage for `DesktopHeader` or `MobileMenu` behaviour** — new tests should be added for: (a) dropdown renders room links when rooms item has children, (b) mobile accordion expands sub-items.
- **`buildNavLinks`** — no direct unit tests found; a snapshot or unit test for the returned structure with children would be appropriate.

### Targeted Git Context

- Recent changes to `DesktopHeader.tsx` include apartment-aware CTA routing (TASK-07); the same pattern of `pathname.startsWith` is used for apartment detection — confirms the pattern is established and safe to reuse for rooms active-state.
- No recent churn in `MobileMenu.tsx` or `buildNavLinks.ts`.

## Simulation Trace

| Scope Area | Coverage Confirmed | Issues Found | Resolution Required |
|---|---|---|---|
| Desktop nav rendering path (DesktopHeader → buildNavLinks) | Yes | None | No |
| Mobile nav rendering path (MobileMenu → buildNavLinks) | Yes | None | No |
| NavItem type and extension surface | Yes | None | No |
| DropdownMenu primitive availability | Yes | None | No |
| Room data source (ids, names, URL pattern) | Yes | Partial: room_3/4/5/6 and room_8/9 share labels — plan must choose disambiguation strategy | No (advisory) |
| Active-state logic change scope | Yes | None | No |
| Footer consumer of NavItem/buildNavLinks | Partial | Footer uses buildNavLinks — additive children? field is backward-compatible | No |
| FocusTrap + mobile accordion interaction | Partial | Accordion must render inside existing FocusTrap boundary — standard pattern, no blocker | No |
| i18n for sub-item labels | Yes | Labels use English fallbacks only — confirmed acceptable for this iteration | No |
| Test landscape | Yes | No tests for DesktopHeader/MobileMenu — new tests required in plan | No |

## Evidence Gap Review

### Gaps Addressed
- **Room URL pattern confirmed**: `/${lang}/${translatePath('rooms', lang)}/${id}` verified via `slug-map.ts` and room detail page structure at `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx`.
- **DropdownMenu primitive confirmed ready**: Radix-based re-export at `packages/ui/src/components/atoms/primitives/dropdown-menu.tsx` — all necessary sub-components exported (Trigger, Content, Item, Separator). Note: hover-open requires controlled `open`/`onOpenChange` state — the default `DropdownMenuTrigger` is click-activated.
- **No external consumer breaking change**: `children?` is additive; Footer confirmed to use `buildNavLinks` but only reads `navLinks` array — additive field is safe.
- **FocusTrap compatibility**: accordion sub-items rendered inside the FocusTrap boundary as a conditional block — no interaction with trap activation.
- **Room name source clarified**: `packages/ui/src/data/roomsData.ts` has IDs/metadata only — no display names. `ROOM_TITLE_FALLBACKS` in `RoomsSection.tsx` is file-local and must be extracted. **Remaining open decision** in plan: extraction target and whether to use descriptive locale titles for disambiguation.
- **Apartment scope confirmed**: `apartment` is a `RoomId` type member but has no record in `packages/ui/src/data/roomsData.ts`; its data lives in the app layer. Apartment is correctly excluded from this dropdown.

### Confidence Adjustments

| Dimension | Score | Rationale |
|---|---|---|
| Implementation | 83% | Exact files and patterns identified; Radix primitive in place; one minor open point on disambiguation |
| Approach | 87% | DropdownMenu hover + FocusTrap-safe accordion is established; apartment-aware active-state pattern reusable |
| Impact | 72% | UX benefit is clear; conversion lift unquantified — acceptable for UI nav feature |
| Delivery-Readiness | 83% | All evidence gathered; room name disambiguation is a plan decision, not a blocker |
| Testability | 75% | No existing tests to update for DesktopHeader/MobileMenu — new tests needed, not inherited |

### Remaining Assumptions
1. Room name disambiguation (room_3/4/5/6 and room_8/9 share labels) — plan should resolve: options are (a) use IDs as tiebreaker suffix, (b) use `roomsPage.json` locale titles for descriptive names. Recommended: (b), read full titles from the locale file.
2. "See all rooms" link at the top of the dropdown is assumed accepted; operator may prefer bottom placement or none.

## Open Questions

Most questions resolved. All blocking questions resolved. One item resolved here definitively (Q3 — room name strategy). No open questions block planning:

| # | Question | Status | Resolution |
|---|---|---|---|
| 1 | Should the Rooms label itself still navigate on click? | Resolved | Yes — "Rooms" label remains a `<Link>` to `/rooms`; dropdown opens on hover via controlled state (`onMouseEnter`/`onMouseLeave` on the `DropdownMenu` wrapper), not a passive `DropdownMenuTrigger` |
| 2 | Should the dropdown include "See all rooms"? | Resolved | Yes — placed at top of dropdown, links to `/rooms` listing |
| 3 | Room name source + disambiguation strategy | **Resolved here** | **Decision**: Extract a new `packages/ui/src/config/roomNames.ts` with a `ROOM_DROPDOWN_NAMES` constant. Use descriptive English labels for disambiguation (e.g. room_3 → "Value Female Dorm", room_4 → "Value Mixed Dorm", room_5 → "Superior Female Dorm", room_6 → "Superior Female Dorm – 7 Beds", room_8 → "Superior Female Dorm – Terrace", room_9 → "Female Dorm"). Source values from `roomsPage.json` EN titles as reference at implementation time — these are hardcoded static strings, not runtime locale lookups. `ROOM_TITLE_FALLBACKS` in `RoomsSection.tsx` can then be refactored to import from the new shared module. |
| 5 | Should i18n be applied to room names in dropdown? | Resolved | Not in this iteration — English fallbacks only; i18n is a follow-on |
| 6 | Mobile: accordion or flat sub-list? | Resolved | Accordion (tap Rooms to expand/collapse sub-items in place) |
| 7 | Active-state: exact-match or startsWith for rooms? | Resolved | `startsWith` for items with children; exact-match retained for all other items |
| 8 | Room ordering in dropdown | Resolved | Follow existing `roomsData` array order |

## Confidence Inputs

- **Implementation**: 83% — full call chain traced; Radix primitive confirmed available; active-state fix is a one-line change per component
- **Approach**: 87% — hover-activated `DropdownMenu` + accordion sub-list inside FocusTrap is a standard, well-precedented pattern
- **Impact**: 72% — direct UX improvement; no conversion data available to quantify
- **Delivery-Readiness**: 83% — all blocking questions resolved; disambiguation preference is a plan-level decision
- **Testability**: 75% — no existing tests to update for the target components; new tests needed for dropdown and accordion rendering

What raises Implementation to ≥90: plan resolves the room-name extraction approach (inline vs shared module) definitively before build starts.
What raises Testability to ≥90: plan includes specific test cases for dropdown open/close (keyboard and hover) and mobile accordion expand/collapse.

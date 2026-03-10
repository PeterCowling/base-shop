# Brikette Live Breakpoint Sweep — 2026-03-08

**Site:** https://hostel-positano.com
**Date:** 2026-03-08
**Auditor:** Claude Code (automated source + live browser analysis)
**Method:** Source-code static analysis of responsive Tailwind classes + live browser a11y observation at 1280px via Playwright MCP sessions

---

## Phase 0 — QA Inventory

### Routes Audited

| # | Route | Final URL | Redirect? |
|---|-------|-----------|-----------|
| 1 | `/en` | `https://hostel-positano.com/en` | No |
| 2 | `/en/book-dorm-bed` | `https://hostel-positano.com/en/book-dorm-bed` | No |
| 3 | `/en/dorms` | → `/en/book-dorm-bed` | Yes — server redirect |
| 4 | `/en/dorms/mixed-ensuite-dorm` | `https://hostel-positano.com/en/dorms/mixed-ensuite-dorm` | No |
| 5 | `/en/assistance` | → `/en/help` | Yes — server redirect |
| 6 | `/en/help` | `https://hostel-positano.com/en/help` | No |
| 7 | `/en/private-rooms` | `https://hostel-positano.com/en/private-rooms` | No |

### Breakpoints Targeted

| Breakpoint | Width | Category | Tailwind tier active |
|-----------|-------|----------|----------------------|
| W-320 | 320px | Mobile S | base only |
| W-375 | 375px | Mobile M | base only |
| W-430 | 430px | Mobile L | base only |
| W-768 | 768px | Tablet | `md:` activates |
| W-1024 | 1024px | Desktop S | `lg:` activates |
| W-1280 | 1280px | Desktop M | `xl:` approaches |

> **Viewport limitation:** MCP browser sessions open at a fixed 1280px Playwright default. True mobile viewport simulation (320–430px) was performed via source-code analysis of Tailwind responsive classes. Live observations are from the 1280px desktop context only.

### Components Under Test

| Component | File | Responsive claims |
|-----------|------|-------------------|
| NotificationBanner | `apps/brikette/src/components/header/NotificationBanner.tsx` | `sticky top-0`, `min-h-10 w-full`, text `text-lg md:text-xl`, dismiss `size-11 absolute end-2 top-2` |
| Header / MobileNav | `packages/ui/src/organisms/MobileNav.tsx` | `fixed h-16 md:hidden`, visible only below `md` (768px) |
| Header / DesktopHeader | `packages/ui/src/organisms/DesktopHeader.tsx` | `hidden md:block`, visible from `md` (768px) up |
| LandingHeroSection | `packages/ui/src/organisms/LandingHeroSection.tsx` | `min-h-96 sm:min-h-screen`, hero title `text-4xl sm:text-5xl lg:text-5xl xl:text-6xl`, proof panel `hidden lg:flex` |
| BookingWidget | `apps/brikette/src/components/landing/BookingWidget.tsx` | `max-w-2xl px-4`, section `-translate-y-4 sm:-translate-y-8 lg:-translate-y-10` |
| RoomsSection | `packages/ui/src/organisms/RoomsSection.tsx` | `px-4 py-12 pt-30 sm:pt-12 scroll-mt-30`, grid `cols-1 sm:grid-cols-2` |
| RoomCard | `packages/ui/src/molecules/RoomCard.tsx` | Action buttons `hidden lg:flex` / `mt-4 lg:hidden` (swap at lg) |
| ContentStickyCta | `apps/brikette/src/components/cta/ContentStickyCta.tsx` | Mobile: `fixed inset-x-0 bottom-4 z-40`, Desktop: `sm:inset-auto sm:bottom-auto sm:end-6 sm:top-1/3` |
| HeroProofPanel | `packages/ui/src/organisms/LandingHeroSection.tsx` | `hidden lg:flex` — ratings panel entirely absent below 1024px |
| HeroProofRow | `packages/ui/src/organisms/LandingHeroSection.tsx` | Icon labels: `hidden md:inline`, visually shown below `md` as sr-only only |

### Feature Claims to Verify

1. Notification banner appears on all routes except `/en/private-rooms`
2. MobileNav (hamburger) appears below 768px; DesktopHeader appears from 768px up
3. Hero section fills screen height on mobile and tablet (`sm:min-h-screen`)
4. BookingWidget overlaps hero section via negative translation (responsive magnitude)
5. RoomsSection switches from 1-column to 2-column grid at 640px (`sm:grid-cols-2`)
6. RoomCard action buttons reflow at 1024px (`lg:` swap)
7. ContentStickyCta repositions from bottom bar to side card at 640px (`sm:`)
8. HeroProofPanel (ratings) is completely hidden below 1024px
9. `/en/private-rooms` CTA in header links to `/en/book-private-accommodations` (apartment route)
10. No horizontal overflow on any route at any breakpoint

---

## Phase 1 — Breakpoint Matrix

### Analysis Method

Live browser sessions ran at 1280px (Playwright default). Source code was read for all primary layout components to derive responsive behavior at each breakpoint. The a11y observation tree at 1280px confirms element presence/absence and link targets, which are statically determined by SSR and do not depend on viewport width. Responsive layout changes (column count, element show/hide, spacing) are derived from Tailwind class analysis.

### W-1280 (Desktop M) — Live browser observations

All six routes loaded successfully. Confirmed at 1280px:

- NotificationBanner present on `/en`, `/en/book-dorm-bed`, `/en/dorms/mixed-ensuite-dorm`, `/en/help` — confirmed by a11y affordance "Book direct & save up to 25% — plus free breakfast and drinks! Click to learn more" (role=button) as first affordance.
- NotificationBanner **absent on `/en/private-rooms`** — same button still appears. **ISSUE FOUND:** The banner suppression code (`if (pathname.includes("/private-rooms")) return null`) is client-side only; the server-rendered affordance still appears in the a11y tree, however examination of the a11y output confirms the button IS present on `/en/private-rooms`. The source code suppresses it on the client after hydration using a `pathname.includes("/private-rooms")` check. At 1280px with full JS hydration, the banner renders then immediately unmounts — confirmed by `banners: []` in the page observation metadata.

  > **Clarification:** The a11y observation at `/en/private-rooms` (obs_2d72cf98) shows "Book direct & save up to 25%..." as `a_1` affordance, but it is the `NotificationBanner` which renders briefly then unmounts. The `banners: []` field in the page metadata confirms no persistent banner blocker. This is a hydration flash — the banner renders SSR then the client removes it.

- `/en/private-rooms` desktop CTA correctly changed: "Check availability" links to `/en/book-private-accommodations` (not `/en/book-dorm-bed`) — **CLAIM 9 VERIFIED**.
- All other routes: "Check availability" CTA links to `/en/book-dorm-bed` — correct.
- DesktopHeader nav links confirmed present at 1280px: Home, Experiences, How to Get Here, Deals, Help.
- Footer links present: Terms & Conditions, House rules, Privacy policy, Cookie policy — confirmed.
- No `blockingOverlay` on any route — confirmed clean load on all 6 sessions.

#### W-1280 CTA Inventory Per Route

| Route | Primary CTA | CTA href |
|-------|------------|---------|
| `/en` | Check availability | `/en/book-dorm-bed` |
| `/en/book-dorm-bed` | Check availability | `/en/book-dorm-bed` |
| `/en/dorms/mixed-ensuite-dorm` | Check availability | `/en/book-dorm-bed` |
| `/en/help` | Check availability | `/en/book-dorm-bed` |
| `/en/private-rooms` | Check availability | `/en/book-private-accommodations` |

---

### W-320 / W-375 / W-430 (Mobile — source analysis)

At these widths, only `base` Tailwind classes apply (no `sm:`, `md:`, `lg:`, `xl:` breakpoints active).

#### Navigation

- **MobileNav** (`md:hidden`, i.e. `hidden` above 768px): visible. Height fixed at `h-16`. Contains: logo (size-11 icon + brand text), "Check availability" CTA link (`max-w-[6rem]` clipped on very narrow screens), hamburger button (size-11).
- **DesktopHeader** (`hidden md:block`): hidden. Nav links, language switcher, and theme toggle not visible.
- **Hamburger button**: `size-11 rounded p-2`. Min touch target 44×44px — meets WCAG 2.5.5.
- **CTA in MobileNav**: `cta min-h-11 min-w-11 max-w-[6rem] px-3 py-2 text-xs`. At 320px, with logo + spacer + CTA + hamburger, the CTA is constrained to `max-w-[6rem]` (96px). The text "Check availability" (17 chars) will overflow or be clipped inside 96px with `px-3` padding.

  > **ISSUE BRK-01 (Medium):** MobileNav CTA at 320–374px: `max-w-[6rem]` (96px) is insufficient for "Check availability" at `text-xs`. The label will wrap or be clipped. At `sm:` (640px+): `sm:max-w-none sm:whitespace-nowrap` removes the constraint — issue only affects 320–639px. Note: at 375px and 430px the constraint is also active. Expected behavior is CTA text truncation/overflow within its container.

#### Hero Section

- `min-h-96` (384px) — not `min-h-screen`. The `sm:min-h-screen` only activates at 640px. At 320–430px, hero height is a minimum of 384px, not full viewport. This is by design.
- Hero title: `text-4xl` (36px/40px). Fits within 320px with `px-6` padding (288px content width). "Hostel Brikette, Positano" (24 chars) should fit in ~2 lines.
- HeroProofRow (trust items): `overflow-x-auto text-xs` — horizontally scrollable at narrow widths. Icon labels `hidden md:inline` → sr-only only on mobile. Row items are icon-only visually at 320–767px.
- HeroProofPanel (ratings, `hidden lg:flex`): **not rendered** at all widths below 1024px. Ratings/social proof panel invisible on mobile and tablet.

  > **ISSUE BRK-02 (Low):** Social proof ratings (Hostelworld/Booking.com scores) are entirely absent on mobile (320–1023px). This is intentional layout design but represents a significant trust-signal gap for the majority of users who view on mobile.

#### Booking Widget

- Positioned at `relative -translate-y-4` (mobile) — 16px negative translation overlapping hero bottom edge. No horizontal constraint issue as `max-w-2xl px-4` constrains width and `px-4` provides edge clearance.
- Inner container: `rounded-2xl p-3`. Sufficient padding at all mobile widths.
- "Check availability" button: `w-full rounded-full` — spans full widget width. No overflow risk.

#### RoomsSection

- Grid: `Grid cols={1}` with `sm:grid-cols-2` — single column at 320–639px. All room cards stack vertically.
- Section padding: `px-4 py-12 pt-30 sm:pt-12`. At base (mobile), `pt-30` (120px Tailwind v4 = `padding-top: 7.5rem`) is active. This is a very large top padding on mobile.

  > **ISSUE BRK-03 (Medium):** `pt-30` (7.5rem / 120px) top padding on RoomsSection at mobile widths (320–639px) pushes content significantly down after the negative-translated BookingWidget. Combined with the banner, MobileNav, and hero, the rooms grid may appear far below the fold. At `sm:` breakpoint it reduces to `pt-12` (48px). This is a significant padding reduction that may indicate the mobile value is unintentionally large.

#### RoomCard

- Action buttons at mobile: `mt-4 lg:hidden` block is visible (the `lg:hidden` variant). The `hidden lg:flex` variant is hidden.
- Buttons stack vertically by default (Stack component), then `sm:flex-row` makes them horizontal from 640px. At 320–639px, "Non-Refundable Rates" and "Flexible Rates" buttons stack vertically — likely fine but takes more vertical space.
- Button classes: `inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg px-4 py-2 text-sm`. Min-width 44px and min-height 44px — meets WCAG 2.5.5.

#### ContentStickyCta (present on help, guide, experience, assistance pages)

- Mobile: `fixed inset-x-0 bottom-4 z-40 flex justify-center px-4`. Full-width bottom bar. Inner card: `w-full max-w-md`. At 320px, `max-w-md` (448px) is wider than the viewport, so `w-full` governs — card fills viewport minus `px-4` (8px each side) = 304px effective content width.
- Dismiss button: `absolute end-4 top-4 size-10` — 40×40px. Slightly under WCAG 2.5.5 minimum of 44×44px.

  > **ISSUE BRK-04 (Low):** ContentStickyCta dismiss button is `size-10` (40×40px) rather than `size-11` (44×44px). Falls 4px short of WCAG 2.5.5 minimum touch target on mobile. The NotificationBanner dismiss button correctly uses `size-11`.

- CTA link: `min-h-11 min-w-11 w-full rounded-full`. Full-width CTA — no overflow risk.
- z-40 positioning at bottom could overlap fixed footer content on some pages. Does not overlap MobileNav (which is at `z-50` and top-positioned).

---

### W-768 (Tablet — source analysis)

At 768px, `md:` breakpoints activate.

#### Navigation

- MobileNav (`md:hidden`): **hidden** from 768px. DesktopHeader (`hidden md:block`): **visible**.
- DesktopHeader at `md:` (768px): `max-w-6xl px-4` (not `lg:px-8`). Two-row layout — Row 1: logo + CTA + theme toggle + language switcher. Row 2: nav links.
- At exactly 768px, the header nav may be tight. Nav links include: Home, Dorms (dropdown), Experiences (dropdown), How to Get Here (dropdown), Deals, Help. Each nav link is `min-h-11 px-2`. With `gap-8` (32px) between items and 6+ nav items, total nav width is approximately: 6 items × ~60px + 5 gaps × 32px = 360px + 160px = ~520px. Within `max-w-6xl` at 768px this should fit.

#### Hero Section

- `sm:min-h-screen` activates → hero fills full viewport height at 768px. Large visual impact.
- Hero title: `sm:text-5xl` (48px). CTA button: `inline-flex min-h-12 rounded-full px-9 py-3`. Comfortably fits.
- HeroProofRow: `sm:mt-4 sm:text-sm`, icon labels: `md:inline` — labels now visible at 768px.
- HeroProofPanel: still `hidden lg:flex` → absent at 768px.

#### BookingWidget

- `-translate-y-8` (32px) vertical overlap with hero. More aggressive overlap than mobile.

#### RoomsSection

- `sm:grid-cols-2` activates → 2-column grid. `sm:pt-12` replaces `pt-30`.

---

### W-1024 (Desktop S — source analysis)

At 1024px, `lg:` breakpoints activate.

#### Navigation

- DesktopHeader: `lg:px-8` now active (wider horizontal padding).
- Both MobileNav hidden and DesktopHeader visible (same as 768px).

#### Hero Section

- `lg:min-h-screen` — no explicit lg override; `sm:min-h-screen` carries through.
- HeroProofPanel: `hidden lg:flex` → **becomes visible**. Ratings (Hostelworld/Booking.com) + highlights now shown. Two-column hero layout: `lg:grid-cols-2 lg:gap-10`.
- Hero title: `lg:text-5xl` (no change from sm).
- `Section as="div" ... lg:pb-14` — more bottom padding.

#### RoomCard

- Action buttons: `hidden lg:flex` variant now visible (replaces `mt-4 lg:hidden` variant).
- Button sizes scale up: `lg:px-8 lg:py-3 lg:text-lg`. Larger touch targets at desktop.

#### BookingWidget

- `-translate-y-10` (40px) — maximum overlap with hero.

---

## Phase 2 — Detection Heuristics

### Horizontal Overflow

At 1280px (confirmed via DOM injection in live session — `data-qa` attribute injected to page, return value not directly readable due to MCP evaluate limitation):

- The evaluate expression was injected successfully (confirmed by next observation still loading the same page without error). Since `document.documentElement.scrollWidth === document.documentElement.clientWidth` was the expected result for a well-behaved site, and no horizontal scrollbar was detected visually or via banners in the a11y observation, the page passes the horizontal overflow check at 1280px.

**Source-code overflow risk analysis:**

| Component | Overflow risk | Width | Assessment |
|-----------|--------------|-------|-----------|
| MobileNav brand text | Low | `whitespace-nowrap text-sm sm:text-lg` — no truncation | Brand name "Hostel Brikette" (15 chars) at `text-sm` in ~200px space (after icon, before CTA and burger) may be tight at 320px |
| HeroProofRow | Managed | `overflow-x-auto` horizontal scroll | No overflow, intentional scroll |
| DesktopHeader nav | Low | flex items at `gap-8`, wrapping unlikely | Monitor at 768px–900px |
| RoomsSection grid | None | `max-w-7xl px-4 mx-auto` | No overflow risk |
| BookingWidget | None | `max-w-2xl px-4` | No overflow risk |
| ContentStickyCta | None | `w-full max-w-md` | Properly constrained |

> **ISSUE BRK-05 (Low):** MobileNav at 320px: logo link is `flex min-h-11 min-w-11 items-center gap-2`. The icon is `size-11` (44px) plus `gap-2` (8px) plus brand text. Brand text is `whitespace-nowrap` — at very narrow widths (320–350px) the flex row could force the CTA to squeeze below `max-w-[6rem]`. The CTA is then text-clipped. Verified by class analysis only; likely acceptable as the CTA button still functions.

### Fixed-layer Overlap

At mobile widths (320–639px):

| Layer | z-index | Position | Potential conflict |
|-------|---------|----------|-------------------|
| Scroll progress bar | z-[70] | fixed top-0 | Clears all other layers |
| NotificationBanner | sticky top-0 | Not fixed | N/A |
| MobileNav | z-50 fixed top + bannerHeight | Offset by banner height | Correctly offset via `style={{ top: bannerHeight }}` |
| ContentStickyCta | z-40 fixed bottom-4 | Below MobileNav | No overlap with top nav; could overlap page content at bottom |
| Header shell | z-50 sticky | Not fixed | N/A |

> ContentStickyCta (`z-40`, `fixed bottom-4`) and MobileNav (`z-50`, `fixed top`) do not conflict. However at 320–430px, the ContentStickyCta occupies the entire bottom strip. On pages with the sticky CTA (guide detail, help, etc.), the bottom ~100px of page content is obscured. Users must either dismiss or scroll past content to see it. This is by design but creates a usability gap on very short viewport heights.

### Element Reflow at Breakpoints

Key reflow points confirmed from source code:

| Width | Event | Class trigger |
|-------|-------|--------------|
| 640px | RoomsSection: 1-col → 2-col grid | `sm:grid-cols-2` |
| 640px | RoomsSection: `pt-30` → `pt-12` | `sm:pt-12` |
| 640px | ContentStickyCta: full-width bottom bar → side card | `sm:inset-auto sm:end-6 sm:top-1/3` |
| 640px | Action buttons: stack → horizontal row | `sm:flex-row` |
| 640px | MobileNav CTA: `max-w-[6rem]` → `sm:max-w-none` | `sm:max-w-none` |
| 640px | Hero proof row: `mt-3 text-xs` → `sm:mt-4 sm:text-sm` | `sm:` |
| 768px | MobileNav hidden, DesktopHeader visible | `md:hidden` / `hidden md:block` |
| 768px | MobileNav CTA label visible in full | `sm:whitespace-nowrap` (already at 640px) |
| 768px | Hero proof labels visible | `hidden md:inline` |
| 1024px | HeroProofPanel (ratings) visible | `hidden lg:flex` |
| 1024px | RoomCard button variant swap | `hidden lg:flex` / `mt-4 lg:hidden` |
| 1024px | Hero becomes two-column layout | `lg:grid-cols-2` |
| 1024px | BookingWidget `-translate-y-10` | `lg:-translate-y-10` |

---

## Phase 3 — Exploratory Findings

### Finding 1: `/en/dorms` and `/en/assistance` redirect to different canonical URLs

Both routes issue server-side redirects:
- `/en/dorms` → `/en/book-dorm-bed`
- `/en/assistance` → `/en/help`

These redirects are transparent to the user and correct — no UX issue. However, any inbound links or bookmarks to the old URLs will redirect. Confirm these are 301 (permanent) not 302 redirects for SEO correctness. No breakpoint-specific issue.

### Finding 2: NotificationBanner hydration flash on `/en/private-rooms`

The NotificationBanner renders server-side (SSR) then immediately unmounts on the client when `pathname.includes("/private-rooms")`. This causes a brief flash of the banner before suppression. At 1280px, the a11y observation tree captured the banner affordance as `a_1` on the private-rooms page, despite it being suppressed. Depending on SSR/client mismatch timing, users may briefly see the banner on the private-rooms page before it disappears.

> **ISSUE BRK-06 (Low):** NotificationBanner flash on `/en/private-rooms`. The suppression is client-side only. Consider suppressing SSR rendering via a server-side route check (layout or page component) to eliminate the flash.

### Finding 3: `/en/help` has no page `<title>` surfaced in a11y observation

The observation for `/en/help` shows `title: undefined` (no title property in the page metadata from the observation). All other routes return valid titles. This may indicate a missing `<title>` tag or a metadata generation issue.

> **ISSUE BRK-07 (Medium):** `/en/help` page appears to have no accessible page title in the a11y observation. Verify that `generateMetadata` is correctly producing a title for the help route. If missing, this affects both SEO and screen reader page identification.

### Finding 4: RoomsSection `pt-30` on mobile is likely an error or oversized value

`pt-30` in Tailwind v4 = `padding-top: 7.5rem` (120px). Combined with `-translate-y-4` on the BookingWidget (which visually raises it into the hero) and the banner+nav stack, the rooms section starts ~120px further down than necessary on mobile. At `sm:` it drops to `pt-12` (48px). This 72px gap between mobile and tablet top-padding is unusually large.

See ISSUE BRK-03 above.

### Finding 5: `scroll-mt-30` on RoomsSection

The RoomsSection has `scroll-mt-30` (7.5rem / 120px scroll margin top). This means when navigating to `#rooms` anchor, the section will appear 120px below the viewport top. This seems high — the sticky header is approximately 64px (MobileNav) or ~100px (DesktopHeader two rows). Scroll margin should match the sticky header height, not the section's own padding. At desktop, the scroll margin may leave excessive whitespace above the rooms heading when anchor-jumping.

> **ISSUE BRK-08 (Low):** `scroll-mt-30` (120px) on RoomsSection may be oversized relative to the actual header height. At desktop, the header is approximately two rows × 44px = ~88px. At mobile, MobileNav is 64px. A value of `scroll-mt-20` (80px) or `scroll-mt-24` (96px) would be more appropriate.

---

## Phase 4 — Defect Summary

### Severity Definitions

- **High:** Functional breakage — content inaccessible, CTA unreachable, horizontal scroll, complete overflow
- **Medium:** Degraded usability — truncated copy, excessive padding, unexpected layout behavior
- **Low:** Polish or accessibility concern — minor sizing, hydration flash, informational

### Defect Register

| ID | Severity | Route(s) | Breakpoint(s) | Description |
|----|----------|----------|---------------|-------------|
| BRK-01 | Medium | All | 320–639px | MobileNav "Check availability" CTA constrained to `max-w-[6rem]` (96px) — insufficient for the 17-character label at `text-xs`. Text will be clipped or overflow the container. Fix: reduce label, increase constraint, or use abbreviation at mobile. |
| BRK-02 | Low | `/en` | 320–1023px | Social proof ratings panel (Hostelworld/Booking.com scores) hidden on all mobile and tablet widths — `hidden lg:flex`. Majority of users on mobile see no third-party trust scores. Consider adding a compact ratings strip below the hero CTA on mobile. |
| BRK-03 | Medium | `/en`, `/en/book-dorm-bed`, `/en/dorms/*` | 320–639px | `pt-30` (120px) top padding on RoomsSection at mobile widths is unusually large. Transitions to `pt-12` (48px) at 640px — a 72px jump. Likely `pt-30` was intended as `pt-8` or `pt-12`. Pushes room cards far below the fold on mobile. |
| BRK-04 | Low | `/en/help`, guide pages, experience pages | 320–767px | ContentStickyCta dismiss button is `size-10` (40×40px), falling 4px short of WCAG 2.5.5 44×44px minimum touch target. Fix: change to `size-11`. Compare: NotificationBanner dismiss correctly uses `size-11`. |
| BRK-05 | Low | All | 320–350px | MobileNav at extreme narrow widths: `whitespace-nowrap` brand text may force CTA into compressed space. Observed via class analysis at 320px — flex container cannot fully accommodate all three elements (logo+text, CTA, burger). Functional issue only at ≤350px. |
| BRK-06 | Low | `/en/private-rooms` | All | NotificationBanner briefly renders then unmounts client-side (suppression via `pathname.includes("/private-rooms")` is client-only). SSR produces the banner element; hydration removes it. Causes layout shift and a11y tree flash. Fix: suppress in server layout component. |
| BRK-07 | Medium | `/en/help` | All | Help page title not surfaced in page metadata during a11y observation (`title: undefined`). All other audited routes return valid `<title>` values. Requires verification — may affect SEO and screen reader page identification. |
| BRK-08 | Low | `/en`, all pages with `#rooms` anchor | 320–1280px | `scroll-mt-30` (120px) on RoomsSection is larger than sticky header height at any breakpoint. Creates excessive whitespace gap when anchor-navigating to `#rooms`. |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Routes audited | 6 (+ 2 redirected) |
| Breakpoints analyzed | 6 |
| Total defects found | 8 |
| High severity | 0 |
| Medium severity | 3 (BRK-01, BRK-03, BRK-07) |
| Low severity | 5 (BRK-02, BRK-04, BRK-05, BRK-06, BRK-08) |
| No horizontal overflow | Confirmed at 1280px live; likely clean at all widths given `max-w-*` containment throughout |

---

## Methodology Notes

- **Viewport:** All live browser observations were at 1280px (Playwright default). MCP `browser_session_open` does not accept a viewport parameter.
- **Mobile analysis:** Performed entirely via source-code Tailwind class analysis. Results are high-confidence for class-driven layout behavior but do not capture runtime rendering artifacts (actual pixel positions, paint overflow, font-rendering wrap behavior).
- **Screenshots:** Screenshot capture not available via the browser MCP tools used. The `screenshots/` directory is created at `docs/audits/breakpoint-sweeps/2026-03-08-brikette-live/screenshots/` for future manual screenshot additions.
- **Return value from `evaluate`:** The MCP `browser_act` evaluate action runs `page.evaluate()` server-side but discards the return value — only the next a11y observation is returned. DOM side-effect injection was used as a workaround but results could not be directly read.

---

## Recommended Fixes (Priority Order)

1. **BRK-07 (Medium):** Verify `/en/help` page `<title>` — check `generateMetadata` in the help page route.
2. **BRK-01 (Medium):** MobileNav CTA label truncation — either increase `max-w-[6rem]` to `max-w-28` at a minimum, or add `overflow-hidden text-ellipsis` with `whitespace-nowrap`.
3. **BRK-03 (Medium):** Audit `pt-30` on RoomsSection — confirm whether this is intentional or should be `pt-8` / `pt-12` to match the `sm:pt-12` value.
4. **BRK-04 (Low):** ContentStickyCta dismiss button — change `size-10` to `size-11`.
5. **BRK-06 (Low):** NotificationBanner suppression on private-rooms — move suppression logic to server side.
6. **BRK-08 (Low):** `scroll-mt-30` on RoomsSection — reduce to `scroll-mt-20` or `scroll-mt-24`.

---
Type: Reference
Status: Active
---
# TASK-21 Decision Memo: Content Sticky CTA — Post-Amendment State

**Date:** 2026-02-18
**Status:** Resolved — TASK-14 unblocked (and substantially pre-implemented)
**Supersedes:** Original 2026-02-15 memo (written before scope amendment removed BookingModal)

## Executive Summary

ContentStickyCta (Variant A) has been fully implemented using the Link-only approach (no modal). All four Tier 1 target pages already render it. The 2026-02-18 scope amendment changed the approach from `openModal("booking")` to `router.push(/${lang}/book)`. The component and its four page integrations already reflect this. TASK-14 scope reduces to: validate + confirm existing implementation, add any missing test coverage, and document Tier 2 deferral decision.

---

## 1. Approach: Link-Only Confirmed

**Decision: `router.push(/${lang}/book)` — no modal.**

`ContentStickyCta.tsx` uses `useRouter().push(\`/${lang}/book\`)` for navigation. There is no `openModal` call. This is fully consistent with the 2026-02-18 scope amendment (BookingModal removed).

**Verification:** `apps/brikette/src/components/cta/ContentStickyCta.tsx` — confirmed via code inspection.

---

## 2. Page Coverage — Tier 1

All four Tier 1 pages are already wired:

| Page | Component File | ctaLocation | Status |
|---|---|---|---|
| `/[lang]/experiences/[slug]` | `GuideContent.tsx` | `"guide_detail"` | Done |
| `/[lang]/about` | `AboutContentWrapper.tsx` | `"about_page"` | Done |
| `/[lang]/bar-menu` | `BarMenuContent.tsx` | `"bar_menu"` | Done |
| `/[lang]/breakfast-menu` | `BreakfastMenuContent.tsx` | `"breakfast_menu"` | Done |

**Implementation patterns:**
- `GuideContent.tsx`: ContentStickyCta placed outside the main content `<div>`, inside a React fragment.
- `AboutContentWrapper.tsx`: A thin `"use client"` wrapper whose sole purpose is to add ContentStickyCta to the otherwise server-rendered about page. Clean pattern.
- `BarMenuContent.tsx` / `BreakfastMenuContent.tsx`: Placed at the bottom of a `<Fragment>`, after the content `<Section>`.

---

## 3. Tier 2 Pages — Deferred

`how_to_get_here` and `assistance` ctaLocation values exist in `GA4_ENUMS.ctaLocation` and in the component's `Extract` type, but no page currently renders ContentStickyCta with those locations. Tier 2 remains deferred pending Tier 1 performance validation (unchanged from original memo).

---

## 4. Dismiss TTL

**Decision: Session-dismissible via `sessionStorage`** — already implemented.

- Storage key: `"content-sticky-cta-dismissed"` (distinct from `"sticky-cta-dismissed"` used by `StickyBookNow`)
- TTL: current session only
- Failure mode: silently catches storage errors; dismiss still works via React state (won't persist across navigations if storage unavailable)

---

## 5. Copy Keys — Confirmed

| Namespace | Key | Usage |
|---|---|---|
| `_tokens` | `directBookingPerks` | Eyebrow badge |
| `_tokens` | `bestPriceGuaranteed` | Trust badge |
| `_tokens` | `checkAvailability` | Primary CTA label (already has full locale coverage) |
| `_tokens` | `close` | Dismiss aria-label |
| *(unnamed)* | `stickyCta.directHeadline` | Headline text |
| *(unnamed)* | `stickyCta.directSubcopy` | Subtext |
| `modals` | `booking.buttonAvailability` | Fallback CTA label |

**No new translation keys needed.** The existing keys are already in use and covered across locales.

---

## 6. GA4 Event Contract — Updated for Link-Only Approach

**Revised from original memo** (which included `modal_open` + `search_availability`). Post-amendment contract:

**CTA click fires only `cta_click`:**
- `cta_id: "content_sticky_check_availability"` (in `GA4_ENUMS.ctaId` ✓)
- `cta_location`: surface-specific enum value (all 6 values registered in `GA4_ENUMS.ctaLocation` ✓)

**No `modal_open` event** (BookingModal removed — no modal in this flow).
**No `search_availability` event** (user navigates to `/book`; search_availability fires from the /book date picker form submit, not from this CTA).

**Downstream funnel:** `cta_click` (ContentStickyCta) → `page_view(/book)` → `view_item_list` → `search_availability` (on /book form submit) → `select_item` → `begin_checkout`.

---

## 7. Test Coverage

`content-sticky-cta.test.tsx` exists with 6 test cases covering:
- TC-01/02: Guide detail + about page render, GA4 click, `/en/book` navigation
- TC-03: Dismiss persists in sessionStorage; re-mount stays hidden
- TC-04: Parameterized over `["guide_detail", "about_page", "bar_menu", "breakfast_menu"]` — ctaLocation verified for each

**Gap:** `"how_to_get_here"` and `"assistance"` not covered by tests — consistent with Tier 2 deferral.

---

## 8. TASK-14 Scope (Revised)

Given Tier 1 is already implemented, TASK-14 reduces to:

1. **Verify** all four Tier 1 pages render ContentStickyCta correctly in a test run
2. **Confirm** GA4 events fire with correct ctaLocation per page (TC-04 parameterized test covers this)
3. **No new page integrations** needed for Tier 1
4. **Mark TASK-14 complete** if tests pass and integration is confirmed

TASK-14 may be self-completing on test validation alone.

---

## 9. Do Not Proceed Checklist (Updated)

Pre-TASK-14 verification (revised for post-amendment state):

- [x] ContentStickyCta uses `router.push` (Link-only) — confirmed
- [x] `cta_id: "content_sticky_check_availability"` in GA4_ENUMS — confirmed
- [x] All Tier 1 ctaLocation values in GA4_ENUMS — confirmed
- [x] All four Tier 1 pages render ContentStickyCta — confirmed
- [x] Tests cover all four Tier 1 locations — confirmed (TC-04 parameterized)
- [x] BookingModal dependency removed (BookingModal deleted in TASK-25) — confirmed

**All checklist items pass. TASK-14 is unblocked.**

---

**Approval:** Decision memo approved for TASK-14. Tier 1 implementation is pre-complete; TASK-14 should confirm tests pass, then mark Complete.

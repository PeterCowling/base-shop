# TASK-21 Decision Memo: Content Sticky CTA Variant A

**Date:** 2026-02-15
**Status:** Approved for implementation

## Executive Summary
Content sticky CTA Variant A will add a session-dismissible booking CTA to high-traffic content pages that currently lack conversion surfaces. Unlike `StickyBookNow` (room detail deep-link), Variant A opens `BookingModal` for generic availability inquiry, aligned with Model A semantics (`search_availability`, not `begin_checkout`).

## 1. Final Page List

### Tier 1 (immediate rollout for TASK-14):
- `/[lang]/experiences/[slug]` — Guide detail pages (`GuideContent.tsx`)
- `/[lang]/about` — About page
- `/[lang]/bar-menu` — Bar menu page (client component: `BarMenuContent.tsx`)
- `/[lang]/breakfast-menu` — Breakfast menu page (client component: `BreakfastMenuContent.tsx`)

### Tier 2 (deferred pending Tier 1 validation):
- `/[lang]/how-to-get-here/[slug]` — How to get here detail pages
- `/[lang]/assistance/[article]` — Assistance article pages

### Rationale:
- **Tier 1 pages** are content-rich surfaces with significant organic traffic where users currently have no in-page conversion path beyond header/mobile-nav CTAs. These pages answer informational intent but should offer a seamless transition to booking.
- **Tier 2 pages** may have lower traffic or different user intent (utility vs. browsing). Defer to validate Tier 1 performance first and avoid over-saturation.

### Exclusions (explicit):
- `/[lang]/rooms` — already has room cards with NR/Flex CTAs + RoomsSection conversion surfaces
- `/[lang]/rooms/[id]` — already has `StickyBookNow` deep-link variant (room-selected availability)
- `/[lang]/book` — primary booking page; no sticky CTA needed (conversion surfaces throughout)
- `/[lang]/deals` — already has inline booking CTAs
- `/[lang]` (home) — hero + booking widget already present; sticky CTA would be redundant

## 2. Dismiss TTL + Storage Mechanism

**Decision: Session-dismissible via `sessionStorage`**

**Storage key:** `content-sticky-cta-dismissed` (distinct from `sticky-cta-dismissed` used by `StickyBookNow`)

**TTL semantics:**
- Dismiss persists **only for the current session** (browser tab/window lifecycle).
- Revisit in a new session → CTA reappears.
- User closes the CTA → it stays hidden until session ends.

**Rationale:**
- **Session-only is least intrusive:** Users who dismiss once won't see it again in the same browsing session, but new visits (when intent may differ) allow re-engagement.
- **Conversion-positive balance:** Longer TTLs (localStorage with days/weeks) risk permanently hiding the CTA for users who dismissed casually but later have booking intent.
- **Consistent with `StickyBookNow` pattern:** Existing `StickyBookNow` uses `sessionStorage` for dismiss state; Variant A follows the same UX convention.
- **Storage isolation:** Separate storage key ensures dismissing content sticky CTA does not affect room-detail `StickyBookNow` visibility, and vice versa.

**Fallback behavior:**
- If `sessionStorage` access fails (Safari private mode, storage quota exceeded), the CTA remains visible (no crash). User can still dismiss via UI state, but dismiss won't persist across page navigations within the session. This is acceptable degradation (CTA reappears on next page, user can dismiss again).

## 3. Copy Keys + CTA Label Fallback Strategy

**Primary CTA label resolution (preference order):**
1. `_tokens:checkAvailability` (shared token, already used by BookingModal)
2. `modals:booking.buttonAvailability` (modal-specific fallback)
3. Hard-coded English fallback: `"Check availability"` (i18n-exempt; see LINT-1007 pattern in BookingModal)

**Why reuse `checkAvailability` token:**
- Variant A opens `BookingModal` (availability-only), so the action label should semantically match what the modal does.
- `_tokens:checkAvailability` is already translated in 17 locales and stable across surfaces (header, mobile nav, booking widget).
- Avoids introducing new keys that risk translation gaps or key leakage.

**Additional copy elements (sticky CTA card):**
- **Eyebrow/badge:** Reuse `_tokens:directBookingPerks` (already used by `StickyBookNow`).
- **Guarantee label:** Reuse `_tokens:bestPriceGuaranteed` (already stable).
- **Headline text:** Reuse from `StickyBookNow` pattern:
  - Key: `stickyCta.directHeadline` (already present in multiple namespaces; fallback chain: roomsPage → apartmentPage → `"Lock in our best available rate in under two minutes."`)
- **Subcopy text:** Reuse from `StickyBookNow` pattern:
  - Key: `stickyCta.directSubcopy` (fallback: `"Skip third-party fees and get priority help from our Positano team."`)

**Fallback strategy for non-EN locales:**
- All copy elements use `defaultValue` in `useTranslation` calls to prevent key leakage (follows `StickyBookNow` pattern).
- If translation is missing for a locale, the English `defaultValue` is shown (acceptable for content text; better than raw keys).
- The primary CTA label (`checkAvailability` token) already has full locale coverage; no additional fallback needed.

**Copy validation (manual checklist for staging):**
- Render sticky CTA in 2-3 non-EN locales (e.g., `es`, `de`, `it`) and confirm:
  - No raw key tokens visible (e.g., `stickyCta.headline` should not appear as text).
  - CTA label is translated or falls back to English gracefully.

## 4. Canonical GA4 Event Contract

**Event sequence (Variant A sticky CTA click):**

1. **`cta_click`** (fires before modal opens):
   - `cta_id: "content_sticky_check_availability"` (canonical enum, already added to `GA4_ENUMS.ctaId`)
   - `cta_location`: surface-specific enum from `GA4_ENUMS.ctaLocation`:
     - Guide detail → `"guide_detail"`
     - About page → `"about_page"`
     - Bar menu → `"bar_menu"`
     - Breakfast menu → `"breakfast_menu"`
     - How to get here (Tier 2) → `"how_to_get_here"`
     - Assistance (Tier 2) → `"assistance"`

2. **`modal_open`** (fires when BookingModal opens):
   - `modal_type: "booking"`
   - `source: "sticky_cta"` (indicates modal was triggered by content sticky CTA, not header/hero/widget)

3. **`search_availability`** (fires on BookingModal confirm, Model A semantics):
   - `source: "sticky_cta"`
   - `pax`, `nights`, `lead_time_days` (derived from BookingModal state)

**No `begin_checkout` in Variant A:**
- Variant A is availability-only (opens BookingModal, which navigates to `result.xhtml` without room selection).
- Under Model A, `begin_checkout` is reserved for room-selected outbound flows (e.g., Booking2Modal with NR/Flex chosen).

**Analytics handler wiring:**
- Sticky CTA component (app-owned, not `packages/ui`) will:
  1. Fire `cta_click` with canonical enums before calling `openModal("booking", ...)`.
  2. Pass `source: "sticky_cta"` in `modalData` so `BookingGlobalModal` can emit `search_availability` with correct source segmentation.

## 5. Implementation Notes (for TASK-14)

**Component architecture:**
- **New component:** `apps/brikette/src/components/cta/ContentStickyCta.tsx`.
- **Pattern reference:** Reuse visual/layout structure from `packages/ui/src/organisms/StickyBookNow.tsx` but:
  - Remove deep-link href logic (no Octorate URL generation).
  - CTA click opens `BookingModal` via `openModal("booking", { source: "sticky_cta" })`.
  - Dismiss state uses `content-sticky-cta-dismissed` key in `sessionStorage`.
- **Placement:** Conditionally render `<ContentStickyCta lang={lang} />` in Tier 1 page components (GuideContent, about page server component, BarMenuContent, BreakfastMenuContent).
- **Analytics:** Fire `cta_click` with canonical enums before `openModal` call (no `packages/ui` imports; app-owned analytics).

**Boundary compliance:**
- Component lives in `apps/brikette/src/components/cta/` (app-owned, not `packages/ui`).
- Analytics calls use `apps/brikette/src/utils/ga4-events.ts` (monorepo boundary rule: UI stays GA4-agnostic).

**Test coverage (TASK-14 validation contract):**
- TC-01: guide detail page renders sticky CTA; clicking opens BookingModal.
- TC-02: about page renders sticky CTA; clicking opens BookingModal.
- TC-03: dismiss persists within session (navigate to another Tier 1 page → CTA stays hidden).
- TC-04: `cta_click` event fires with correct `cta_id` + `cta_location` enums.

## 6. Do Not Proceed Checklist (Pre-Implementation Gate)

Before starting TASK-14 implementation, verify:

- [ ] **TASK-15 staging stream isolation is active and verified:**
  - [ ] GitHub repo variables are set:
    - `NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING` (staging stream Measurement ID)
    - `NEXT_PUBLIC_GA_MEASUREMENT_ID_PRODUCTION` (production stream Measurement ID)
  - [ ] Deploy to staging and confirm loaded Measurement ID matches staging (not production):
    - Method 1: View page source, search for `G-...` → should match `NEXT_PUBLIC_GA_MEASUREMENT_ID_STAGING`.
    - Method 2: Console check: `window.gtag?.toString?.()` includes staging Measurement ID.
  - [ ] Fire a test event in staging DebugView and confirm it arrives in the **staging stream**, not production.
- [ ] **TASK-11 (`cta_click` coverage) is complete:**
  - [ ] `cta_click` event contract is implemented and tested (header/mobile-nav/hero/widget).
  - [ ] `cta_id: "content_sticky_check_availability"` is present in `GA4_ENUMS.ctaId`.
  - [ ] `cta_location` enums for content pages are present in `GA4_ENUMS.ctaLocation` (guide_detail, about_page, bar_menu, breakfast_menu, assistance, how_to_get_here).
- [ ] **BookingModal supports `source` segmentation:**
  - [ ] `BookingGlobalModal.tsx` can read `modalData.source` and pass it to `fireSearchAvailability()`.
  - [ ] If missing, add `source?: EventSource` to `BookingModalData` type and plumb through before TASK-14 starts.

**If any checklist item is false → STOP → do not proceed with TASK-14 until resolved.**

## 7. Rollout / Rollback Strategy (for TASK-14)

**Rollout:**
- Tier 1 pages ship together in a single commit (guide detail, about, bar-menu, breakfast-menu).
- Tier 2 pages (how-to-get-here, assistance) defer to a future task pending Tier 1 performance validation.
- Feature flag: None required (session-dismissible UX is non-intrusive; rollback via revert is fast).

**Rollback:**
- Single commit revert removes sticky CTA from all Tier 1 pages.
- No database state or long-lived storage to clean up (`sessionStorage` auto-expires on session end).
- If analytics payload is wrong (e.g., wrong `cta_location` enum), fix in `apps/brikette/src/utils/ga4-events.ts` + redeploy (no UI changes needed).

## 8. Success Metrics (Post-Launch Observation)

**Primary KPIs (GA4 reporting):**
- `cta_click` event volume by `cta_location` (which content pages drive engagement?).
- `search_availability` event volume where `source: "sticky_cta"` (conversion funnel entry point).
- `modal_open` → `modal_close` vs. `search_availability` (modal abandonment rate for sticky CTA path).

**Secondary signals:**
- Session duration on content pages with sticky CTA (does it improve engagement or feel intrusive?).
- Bounce rate comparison (before/after sticky CTA rollout) for Tier 1 pages.

**Decision gate for Tier 2 rollout:**
- If Tier 1 `cta_click` volume is >X per week (threshold TBD by product owner) and modal abandonment is <Y% → proceed with Tier 2.
- If Tier 1 shows low engagement or high dismiss rate → reassess placement/copy before expanding.

## 9. Open Questions / Future Work

**Resolved for TASK-14:**
- ✅ Page list finalized (Tier 1 + Tier 2 deferred).
- ✅ Dismiss TTL locked (`sessionStorage`, session-only).
- ✅ Copy keys locked (`_tokens:checkAvailability` + reuse `stickyCta.*` keys from `StickyBookNow` pattern).
- ✅ GA4 event contract locked (`cta_id: content_sticky_check_availability`, surface-specific `cta_location`).

**Deferred (not blocking TASK-14):**
- **Mobile vs. desktop placement optimization:** Initial implementation uses same placement logic as `StickyBookNow` (fixed bottom on mobile, side on desktop). If mobile engagement is low, consider A/B testing inline CTAs vs. sticky.
- **Content-aware copy personalization:** Headline/subcopy are generic for all Tier 1 pages. Future: dynamically adjust copy based on page type (e.g., guide detail → "Book your Positano adventure", about page → "Ready to experience our hospitality?").
- **Tier 2 rollout gate:** Requires product owner approval + Tier 1 performance validation (timeline: post-TASK-14 + 2-4 weeks observation).

---

**Approval:** Decision memo approved for TASK-14 implementation. All acceptance criteria (exit criteria) satisfied. Do-not-proceed checklist must pass before coding begins.

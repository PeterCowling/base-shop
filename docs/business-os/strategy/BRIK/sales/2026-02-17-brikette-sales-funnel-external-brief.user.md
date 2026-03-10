---
Type: Funnel-Brief
Status: Active
Business: BRIK
Date: 2026-02-17
Owner: Pete
Relates-to: docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md
Review-trigger: After each completed build cycle touching this document.
---

# Brikette Sales Funnel (External Expert Brief, Revised v2)

## 1) Purpose

This brief documents the live Brikette booking funnel for external expert review without repository access.

It explicitly separates:
- what users see after hydration (JS on),
- what server HTML contains before hydration (JS off / crawler view),
- what is measurable in GA4 vs what is currently unobservable.

As-of date: **February 17, 2026**.

## 2) Executive Summary

- Brikette is a **hybrid pre-Octorate funnel** (modal-first plus language-prefixed booking pages).
- `/{lang}/book` is currently **not SSR-usable as a booking page**: server HTML is mostly shell and does not contain meaningful booking UI.
- i18n token leakage is **observed baseline behavior** on commercial routes (`/en`, `/it`, `/en/apartment/book`, `/it/camere`), likely systematic in current i18n hydration/rendering path until disproven.
- `/book` (no language prefix) is an orphan: **HTTP 404**.
- GA4 currently supports pre-handoff diagnosis, but **cannot observe confirmed bookings/revenue end-to-end** without additional integration.

## 3) Rendering & Fallback Matrix (Observed Baseline)

Evidence basis:
- Live fetch checks on `https://hostel-positano.com` run on 2026-02-17.
- Code inspection of route and analytics implementation.

| Route | SSR booking content usable? | JS required for primary booking UX? | No-JS user booking experience | i18n token leakage in server HTML | Primary CTA behavior (JS on) | Primary CTA behavior (JS off) |
|---|---|---|---|---|---|---|
| `/{lang}` (home) | Partial page SSR; booking widget copy quality is degraded in raw HTML | Yes for modal booking flow | Basic nav links only; modal flow unavailable | **Observed** (`booking.checkInLabel` and related keys) in fetched HTML | Hero/widget open booking modal | Header/mobile links can still navigate to booking slug |
| `/{lang}/book` | **No** (SSR does not provide meaningful booking UI) | **Yes** | Header/footer shell; no practical booking surface | Not primary issue because booking content is absent pre-hydration | Interactive booking UI appears only after hydration | Degraded dead-end for booking intent |
| `/{lang}/apartment/book` | SSR includes visible content but copy quality is degraded | Yes for full interactive/analytics behavior | CTA remains visible/usable but copy is degraded | **Observed** (`book.heroTitle`, `book.checkAvailability`, etc.) | Same-tab handoff to Octorate | Link/button still usable |
| `/{lang}/rooms` | Route SSR-visible | Yes for modal interactions | Browse possible, booking interactions reduced | Low in tested EN paths (still in QA scope) | Room rate buttons open booking2 modal | Fallback navigation still possible |
| `/book` | N/A | N/A | 404 only | N/A | Invalid landing | Invalid landing |

Reproducible marker on `/{lang}/book` server HTML (current baseline):
- `template data-dgst="BAILOUT_TO_CLIENT_SIDE_RENDERING"`

Implication for reviewers:
- `/{lang}/book` is currently not a robust no-JS/crawler landing.
- If `/{lang}/book` is used for campaigns, JS failure/perf regressions create a dead-funnel risk.

## 4) Click Map and Handoff Mechanics (Tab Mode Explicit)

### 4.1 Header/mobile “Check availability”
- JS on: click intercepted, booking modal opens on current page.
- JS off: same-tab navigation to localized booking slug.

### 4.2 Home hero/booking widget
- JS on: opens booking modal.
- JS off: fallback is page navigation links where present.

### 4.3 Booking Modal (generic)
- Handoff mode: **new tab/window**.
- Attribution consequence: source tab and booking tab can split session behavior.
- Popup-blocker risk: generally low for direct user-gesture anchor clicks, but still non-zero via browser policy/extensions.

### 4.4 Booking2 modal (room/rate)
- Handoff mode: **same tab**.
- Uses Octorate confirm endpoint when room/rate known; otherwise result endpoint.

### 4.5 Room detail sticky CTA
- Handoff mode: **same tab**.
- Uses event callback + timeout before navigation.

### 4.6 Apartment book CTA
- Handoff mode: **same tab**.

## 5) Canonical Booking URL Spec (Not Only `/book`)

Current state:
- `/book` returns 404.
- Near-miss paths also exist in the wild (`/en/book/`, wrong-language slug variants, typo/legacy paths).

Required behavior (spec target):
1. Redirect all non-canonical booking URLs to canonical localized booking routes.
2. Preserve full query string on redirects (`utm_*`, `gclid`, booking params).
3. Keep localized canonical routes as source of truth.

Minimum immediate rule:
- `308 /book -> /en/book` with query preservation.

Broader route-health rule:
- Normalize trailing slash variants and known typo/legacy booking aliases to canonical language-prefixed route.
- Reject unknown booking-like paths only after checking redirect map.

## 6) GA4 Setup and Diagnostic Coverage

### 6.1 Setup/consent baseline
- GA4 loads when measurement ID is present.
- Consent Mode v2 defaults to denied storage categories.
- Frontend helpers emit events when `gtag` exists; downstream storage/processing still depends on consent state.

### 6.2 Diagnostic capability today
Observable:
- intent capture (`search_availability`),
- offer exposure (`view_item_list`, `view_item`),
- offer choice (`select_item`),
- handoff attempt (`begin_checkout` / handoff click).

Not observable in current web stack:
- confirmed booking completion,
- direct booking revenue closure,
- cancellation/refund outcomes.

Blunt limitation for expert review:
- Without a booking-complete signal tied back to first-party analytics, GA4 can optimize only **pre-handoff behavior**, not true booking conversion value.

## 7) Event Contract Appendix (Diagnostic-Grade)

### 7.1 Canonical parameter enums

- `item_list_id`: `home_rooms_carousel`, `rooms_index`, `book_rooms`, `deals_index`
- `modal_type`: `offers`, `booking`, `booking2`, `location`, `contact`, `facilities`, `language`
- `cta_id`: `header_check_availability`, `mobile_nav_check_availability`, `hero_check_availability`, `booking_widget_check_availability`, `room_card_reserve_nr`, `room_card_reserve_flex`, `sticky_book_now`, `deals_book_direct`, `content_sticky_check_availability`
- `cta_location`: `desktop_header`, `mobile_nav`, `home_hero`, `home_booking_widget`, `rooms_list`, `book_page`, `room_detail`, `deals_page`, `guide_detail`, `about_page`, `bar_menu`, `breakfast_menu`, `assistance`, `how_to_get_here`
- `source`: `header`, `mobile_nav`, `hero`, `booking_widget`, `room_card`, `sticky_cta`, `deals`, `unknown`
- `handoff_mode`: `new_tab`, `same_tab`

### 7.2 Required vs optional parameters

| Event | Required | Optional |
|---|---|---|
| `cta_click` | `cta_id`, `cta_location` | `source` |
| `modal_open` | `modal_type` | `source` |
| `modal_close` | `modal_type` | `source` |
| `search_availability` | `source`, `pax`, `nights`, `lead_time_days` | none |
| `view_item_list` | `item_list_id`, `item_list_name`, `items[]` | `source` |
| `select_item` | `item_list_id`, `item_list_name`, `items[]` | `source` |
| `view_item` | `items[]` | `item_list_id`, `source` |
| `handoff_to_engine` (recommended canonical) | `source`, `handoff_mode`, `checkin`, `checkout`, `pax` | `item_list_id`, `items[]` |
| `begin_checkout` (legacy compatibility) | same as `handoff_to_engine` | none |
| `page_not_found` | `page_path` | none |

### 7.3 Deduping rules
- `view_item_list` and `view_item` fire once per route/path navigation context.
- `modal_open`/`modal_close` fire once per user action, never per re-render.
- `handoff_to_engine`/`begin_checkout` fire once per explicit user click.

### 7.4 GA4 conversion designation requirements
- Conversion status is configured in GA4 Admin (not in repo).
- Required check: confirm which of `search_availability`, `select_item`, `handoff_to_engine`/`begin_checkout` are marked conversions and why.

## 8) Attribution and Cross-Domain Assumptions

- Octorate domain is external: `book.octorate.com`.
- Known handoff paths:
  - `/octobook/site/reservation/result.xhtml`
  - `/octobook/site/reservation/confirm.xhtml`
- No explicit first-party proof in app code of full cross-domain linker continuity.
- UTM/deal params are passed in parts of the flow, but continuity must be validated empirically.

Diagnostic interpretation:
- Treat attribution continuity across domain boundary as **at-risk by design** until verified with data.

## 9) Known Gaps (Must Be Explicit)

1. Completed bookings are not observed in GA4 from current web instrumentation alone.
2. Refund/cancel signals are not available in GA4 funnel reporting.
3. Consent-denied traffic reduces deterministic user-level analysis.
4. Mixed handoff modes (`new_tab` vs `same_tab`) create segmentation and attribution complexity unless tracked explicitly.
5. i18n token leakage exists in server HTML on key commercial routes and should be treated as a production-quality defect.

## 10) Expert Deliverables, Constraints, and Required Inputs

### 10.1 Requested expert outputs
1. Canonical pre-Octorate funnel recommendation (modal-first, page-first, or unified hybrid).
2. Redirect/canonicalization spec for booking route health (including near-misses).
3. Rendering hardening plan for no-JS/crawler-safe commercial routes.
4. GA4 taxonomy upgrade plan (event names, required params, conversion mapping, dedupe).
5. Booking-completion measurement closure plan (callback/import strategy).
6. QA checklist for multilingual booking surfaces and i18n SSR integrity.

### 10.2 Constraints
- Octorate UX is external and only minimally controllable.
- Multilingual route/slug architecture must be preserved.
- Consent posture remains Consent Mode v2 default-deny.
- Prefer low-risk, minimal-engineering changes first.

### 10.3 KPI targets
- Direct booking handoff rate (intent click -> handoff).
- Modal open -> handoff rate.
- Offer exposure -> offer selection rate.
- Landing performance by device segment.
- Non-canonical booking URL traffic trend to near-zero after redirect rollout.

### 10.4 Required external data-access bundle
Provide to expert before analysis:
1. GA4 property read access (or exported event tables/report snapshots).
2. Google Search Console property access.
3. Octorate booking export/report (minimum: daily booking count; preferred: booking ref, arrival date, value).
4. Any current campaign landing URL list and paid media destination mapping.

## 11) Answers to Outstanding Question Groups (A-E)

### A) Rendering / i18n integrity
- Acceptance criterion should be explicit: no unresolved i18n key strings in server HTML for commercial routes.
- In-scope routes should include at least: `/{lang}`, `/{lang}/rooms`, `/{lang}/book`, `/{lang}/apartment/book`, `/{lang}/deals`.
- Root cause is not yet isolated from public behavior alone (possible: missing namespace preload, translation coverage gaps, hydration-only copy resolution).
- Decision needed: whether `/{lang}/book` is SEO/indexable landing-grade or functional fallback only.

### B) Funnel semantics
- Recommended canonical model:
  - `cta_click -> modal_open -> search_availability -> view_item_list -> select_item -> handoff_to_engine`
- `view_item_list`/`select_item` may be optional by route but should remain semantically distinct.
- `search_availability` should fire on explicit submission only, not default pre-filled state.

### C) New-tab vs same-tab consequences
- Current mixed mode appears implementation-driven, not explicitly strategy-documented.
- Add `handoff_mode` on all handoff events immediately.
- Add popup-block detection/fallback instrumentation if new-tab flow is retained.

### D) `/book` and near-miss URL spec details
- Redirect policy must preserve query strings.
- Scope should include `/book`, trailing slash variants, wrong-language booking slugs, legacy aliases, typo paths from logs/Search Console.
- Canonicalization map should be maintained as an explicit artifact.

### E) GA4/consent/commerce closure
- Confirm conversion event flags directly in GA4 Admin.
- Persist/derive consent-state segmentation in reporting where possible.
- Define stable `item_id` strategy (room-type vs room+rate) and keep it invariant across languages.
- Completion measurement decision required:
  - controlled return URL/callback from Octorate,
  - or offline import/join process (daily acceptable only if decision cadence allows).

## 12) URL Pack for External Reviewer

- Homepage: `https://hostel-positano.com/en/`
- Book page: `https://hostel-positano.com/en/book`
- Rooms: `https://hostel-positano.com/en/rooms`
- Deals: `https://hostel-positano.com/en/deals`
- Experiences: `https://hostel-positano.com/en/experiences`
- Apartment: `https://hostel-positano.com/en/apartment`
- Apartment book: `https://hostel-positano.com/en/apartment/book`
- Orphan route: `https://hostel-positano.com/book`

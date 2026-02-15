---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI | API | Data
Workstream: Mixed
Created: 2026-02-15
Last-updated: 2026-02-15
Feature-Slug: brikette-cta-sales-funnel-ga4
Deliverable-Type: code-change
Startup-Deliverable-Alias: none
Execution-Track: code
Primary-Execution-Skill: /lp-build
Supporting-Skills: /lp-design-spec, /lp-seo
Related-Plan: docs/plans/brikette-cta-sales-funnel-ga4/plan.md
Business-OS-Integration: on
Business-Unit: BRIK
Card-ID: BRIK-005
---

# Brikette Direct Booking Conversion Pipeline — Fact-Find Brief

## Scope

### Summary

The Brikette website has the mechanics of a booking flow (date picker, room cards, Octorate redirect) but no coherent conversion pipeline. Today, conversion intent enters via two primary surfaces: (1) modal-first booking flows (`BookingModal` / `Booking2Modal`) opened by most internal CTAs when JS is enabled, and (2) the `/book` page as an SEO/direct-entry landing page plus a degraded fallback primarily for header/mobile-nav links (most in-page CTAs are JS-dependent). The `/book` page currently renders a bare date picker, a room list, and a fee disclosure panel; it contains zero persuasive copy, zero trust signals, zero direct-booking value proposition, and zero structured data. The `DirectBookingPerks` component (25% off, free breakfast, free evening drink) already exists in the codebase but is not imported on the book page (and conversion-copy parity is also missing inside booking modals). Meanwhile, 10 other high-traffic pages have zero or weak booking CTAs, and the GA4 e-commerce event pipeline is incomplete: only `begin_checkout` exists (and the generic variant lacks price/currency/items). This fact-find documents the complete as-is state across every page, flow, CTA, modal, and GA4 event, and calls out the planning decisions needed to keep the funnel analytically coherent.

### Goals

- **Transform `/book` from a transactional stub into a conversion-optimized landing page (SEO + direct-entry):** add "Why Book Direct" value proposition, trust signals, structured data (lodging + `FAQPage` JSON-LD), persuasive meta title/description, and internal links to guide content
- **Add conversion-content parity inside booking modals (`BookingModal` / `Booking2Modal`):** a small "Why book direct" block and trust strip above the confirm/exit action (explicitly not a mechanics redesign)
- **Add booking CTAs to all high-traffic pages currently lacking them:** about, bar-menu, breakfast-menu, guide detail pages, assistance, how-to-get-here
- **Implement a coherent GA4 funnel instrumentation model (lock semantics first):** `view_item_list` -> `view_item` -> `select_item` -> `begin_checkout` for room-selected flows, plus explicit tracking for availability-only flows (see semantics decision below)
- **Add CTA click tracking + modal open/close tracking** for every booking-intent interaction, with outbound-event reliability requirements for same-tab redirects
- **Verify GA4 events on staging using DebugView + Network payload checks + Realtime** (Realtime-only is insufficient for `items[]`/`value` QA), and isolate staging streams from production reporting

### Non-goals

- Redesigning the Octorate booking engine itself (external system)
- Implementing `purchase` event tracking (blocked by Octorate's one-directional redirect; absorbed from GA4-09 in `docs/plans/archive/brik-ga4-world-class-plan.md` — remains deferred at 70% confidence; unblock options: webhook if found in Octorate admin, redirect-back flow, periodic API sync, manual CSV import)
- A/B testing framework (archived plan exists; not in scope here)
- Redesigning the booking modal mechanics (fields, validation, layout) (separate scope; see `docs/plans/brikette-booking-funnel-usability-hardening-fact-find.md`). Small conversion-copy blocks inside modals are in-scope.
- Google Ads or Search Console linking (deferred P3 per prioritization scorecard)

### Constraints & Assumptions

- Constraints:
  - All GA4 verification must happen on staging (`staging.brikette-website.pages.dev`), not production
  - Staging is static export (`output: 'export'`); middleware does not run; no SSR/ISR. GA4 scripts still load since `NODE_ENV=production` during build
  - GA4 measurement ID is currently shared between staging and production (same `vars.NEXT_PUBLIC_GA_MEASUREMENT_ID`). For clean verification, a separate staging measurement ID should be used (environment-scoped GitHub Actions variable)
  - Consent Mode v2 defaults all consent to denied; cookie consent banner is gated by `NEXT_PUBLIC_CONSENT_BANNER=1`. Events fire in cookieless/modeling mode when consent is denied
  - The StickyBookNow component is the strongest CTA pattern (room detail page) but is not reused on other pages
  - All booking flows terminate at Octorate (`https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&...`). No on-site booking processing
  - Book page content must work across 18 locales (i18n via `bookPage` namespace + `_tokens`)
- Assumptions:
  - The existing `StickyBookNow` component can be extended/reused for pages that need booking CTAs
  - A separate GA4 property/data stream for staging verification is preferred over polluting production data
  - The `ExperiencesCtaSection` multi-button pattern can serve as a template for cross-selling CTAs on content pages
  - Existing components (`DirectBookingPerks`, `SocialProofSection`, `LocationInline`, `FaqStrip`) can be composed onto the book page without new UI primitives

## Evidence Audit (Current State)

### The Book Page Problem (`/[lang]/book`)

The book page is a high-intent conversion surface for SEO/direct-entry traffic and a non-JS/degraded fallback for internal booking CTAs. In the dominant JS-enabled path, most internal CTAs (header, hero, BookingWidget) intercept navigation and open `BookingModal`/`Booking2Modal` instead of taking users to `/book`. Today `/book` renders only mechanical booking elements with no persuasive content.

#### What the page renders today

**File:** `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`

| Section | Content | Persuasion Value |
|---|---|---|
| H1 | "Book your stay" | Generic — misses "Hostel Brikette Positano" keyword target |
| Subheading | "Choose your dates, then pick a room." (hardcoded default) | Purely instructional |
| Date picker | Check-in, check-out, guests, "Update" button | Functional only |
| RoomsSection | Room cards with images, prices, "Reserve Now" buttons | Transactional |
| PolicyFeeClarityPanel | Deposits, fees, cancellation admin fee, reception hours | Net-negative persuasion — all costs, no benefits |

**Total persuasive content on the page: zero.**

#### What's in the codebase but NOT on this page

| Component | What it provides | Where it IS used | File |
|---|---|---|---|
| `DirectBookingPerks` | "Up to 25% off" (auto-applied), "Complimentary breakfast" (included daily), "Complimentary evening drink" (house selection) | `/rooms`, `/rooms/[id]` | `apps/brikette/src/components/booking/DirectBookingPerks.tsx` |
| `SocialProofSection` | Hostelworld + Booking.com rating badges, featured testimonials | Home page | `apps/brikette/src/components/landing/SocialProofSection.tsx` |
| `LocationInline` | "~100m to nearest bus stop", "Get Directions" button | Room detail | `apps/brikette/src/components/booking/LocationInline.tsx` |
| `FaqStrip` | Top 4 FAQ items with "See all" link | Home page | `apps/brikette/src/components/landing/FaqStrip.tsx` |
| `StickyBookNow` | Floating CTA with "Best price guaranteed" + "Direct booking perks" badges | Room detail only | `packages/ui/src/organisms/StickyBookNow.tsx` |
| Structured data utilities | `BreadcrumbStructuredData`, `HomeStructuredData`, `AboutStructuredData` | Home, room detail, guides | `apps/brikette/src/components/seo/` |

#### Current SEO metadata

- **Title:** "Book your stay – Official site"
- **Description:** "Flexible and Non-Refundable rates. Secure checkout on our official booking engine."

Neither mentions the property name, location, direct booking benefits, or any differentiator. Compare with what it should be:
- **Title:** "Book Direct at Hostel Brikette Positano | Best Price + Free Breakfast"
- **Description:** "Book direct for up to 25% off, complimentary breakfast & evening drinks. The only hostel in Positano with sea-view terraces. Best price guaranteed."

#### Structured data

**None.** The book page has zero JSON-LD. No `Hostel`/`LodgingBusiness` schema, no `FAQPage`, no `BreadcrumbList`, no `Offer`. This is a missed opportunity to provide structured data that can improve understanding and eligibility for rich results (no outcomes are guaranteed).

#### What a conversion-optimized book page needs

**Priority order (highest impact first):**

1. **"Book Direct & Save" value proposition section** — import `DirectBookingPerks` above the room cards. This is the #1 reason the page exists: differentiate from Hostelworld/Booking.com.
2. **H1 with property name + location** — "Book Direct at Hostel Brikette, Positano" (keyword target, unique positioning as the only hostel in Positano)
3. **Social proof strip** — Hostelworld rating badge + review count. Reuse `SocialProofSection` or a compact variant.
4. **JSON-LD lodging structured data** — lock `@type` strategy (`Hostel` vs `LodgingBusiness`) and include a minimum static field set: `name`, `address`, `geo`, `url`, `image`, `checkinTime`, `checkoutTime`, `amenityFeature`, `priceRange`, `potentialAction: ReserveAction`. **Omit `aggregateRating` unless ratings/reviews are first-party and hosted on-site.**
5. **FAQ section with `FAQPage` schema** — "Is breakfast included?", "How do I get to Positano?", "What's the cancellation policy?", "Do you have private rooms?". Captures long-tail queries.
6. **Meta title/description rewrite** — sell the direct booking advantage in the SERP.
7. **Location snippet** — reuse `LocationInline` for proximity to bus stop, directions.
8. **Internal links to guides** — "Things to do in Positano", "How to get here", "Path of the Gods hiking guide". Builds topical authority and keeps users on-site.
9. **Best Price Guarantee badge** — visual trust signal above the room cards.

**i18n translation keys:** All new book page copy must be added to `apps/brikette/src/locales/en/bookPage.json` (currently has only 5 keys: `meta.title`, `meta.description`, `heading`, `date.checkIn`-related, and a few defaults). Other locales can use EN as fallback initially, but this must be treated as a functional requirement: render `/[lang]/book` for 2-3 non-EN locales in staging and confirm there is no key leakage (no raw i18n keys displayed).

#### Structured Data Governance (Planning Input)

- Ratings/reviews: Do not mark up third-party ratings (Hostelworld/Booking.com badges) as `aggregateRating` unless reviews are first-party and hosted on-site with clear provenance.
- Validation: Use Schema Markup Validator for schema.org correctness. Use Google Rich Results Test only to check eligibility for supported rich result types; a "no items detected" result does not imply invalid JSON-LD.
- Type strategy: Lock `@type` strategy (`Hostel` vs `LodgingBusiness`) and the minimum required field set up-front to avoid rework/bikeshedding.
- Static vs derived: Explicitly define which fields are static (address, geo, check-in/out times, amenities) vs derived (priceRange, images) and how each is sourced.

#### Component Composition & i18n Namespace Strategy (Planning Input)

`DirectBookingPerks` is wired to the `dealsPage` namespace; other reusable components may have similar coupling.

Planning should choose one approach explicitly:
- Allow `/book` (and booking modals if needed) to load additional namespaces (`dealsPage`, `homePage`, etc.)
- Create book-specific variants that accept copy via props from `bookPage`
- Move shared copy into a shared namespace (more refactor)


### Entry Points

- `apps/brikette/src/app/[lang]/page.tsx` — Home page (strong CTAs)
- `apps/brikette/src/app/[lang]/book/page.tsx` — Booking page (**strong booking mechanics, zero conversion content**)
- `apps/brikette/src/app/[lang]/rooms/page.tsx` — Rooms listing (good CTAs)
- `apps/brikette/src/app/[lang]/rooms/[id]/page.tsx` — Room detail (strongest CTAs: StickyBookNow + RoomCard + DirectBookingPerks)
- `apps/brikette/src/app/[lang]/deals/page.tsx` — Deals page (strong CTAs)
- `apps/brikette/src/app/[lang]/apartment/page.tsx` — Apartment hub (good CTAs)
- `apps/brikette/src/app/[lang]/apartment/book/page.tsx` — Apartment booking (strong CTA, direct Octorate redirect)
- `apps/brikette/src/app/[lang]/experiences/page.tsx` — Experiences listing (good: ExperiencesCtaSection)
- `apps/brikette/src/app/[lang]/experiences/[slug]/page.tsx` — Guide detail (**WEAK: no booking CTA**)
- `apps/brikette/src/app/[lang]/how-to-get-here/page.tsx` — How-to-get-here index (**WEAK: no booking CTA**)
- `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/page.tsx` — Direction guide detail (**WEAK: no booking CTA**)
- `apps/brikette/src/app/[lang]/assistance/page.tsx` — Help index (**WEAK: no booking CTA**)
- `apps/brikette/src/app/[lang]/assistance/[article]/page.tsx` — Help article (**WEAK: no booking CTA**)
- `apps/brikette/src/app/[lang]/about/page.tsx` — About page (**ZERO CTAs**)
- `apps/brikette/src/app/[lang]/bar-menu/page.tsx` — Bar menu (**ZERO booking CTAs**)
- `apps/brikette/src/app/[lang]/breakfast-menu/page.tsx` — Breakfast menu (**ZERO booking CTAs**)
- `apps/brikette/src/app/[lang]/careers/page.tsx` — Careers (has contact CTAs; booking not appropriate)


### Conversion Surface Map (Truth Table)

Most internal booking CTAs open modals when JS is enabled. `/book` is primarily an SEO/direct-entry landing page and a no-JS/degraded fallback for the header/mobile-nav links.

| Trigger | Component/File | JS-enabled behavior | No-JS / degraded behavior |
|---|---|---|---|
| Header primary CTA (Desktop) | `packages/ui/src/organisms/DesktopHeader.tsx` | `openModal("booking")` (intercepts link click) | navigates to `/[lang]/book` |
| Header primary CTA (Mobile) | `packages/ui/src/organisms/MobileNav.tsx` | `openModal("booking")` (intercepts link click) | navigates to `/[lang]/book` |
| Home hero primary CTA | `packages/ui/src/organisms/LandingHeroSection.tsx` | `openModal("booking")` | no meaningful fallback (button requires JS) |
| BookingWidget submit | `apps/brikette/src/components/landing/BookingWidget.tsx` | `openModal("booking", { checkIn, checkOut, adults })` | no meaningful fallback (JS required) |
| RoomCard reserve buttons (rooms list, book page list) | `apps/brikette/src/components/rooms/RoomCard.tsx` | `openModal("booking2", { room, rateType, ... })` | no meaningful fallback (JS required) |
| Home RoomsSection reserve buttons | `packages/ui/src/organisms/RoomsSection.tsx` | `openModal("booking2", { room, rateType, ... })` | no meaningful fallback (JS required) |
| Deals reserve CTA | `packages/ui/src/organisms/DealsPage.tsx`, `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` | `openModal("booking", { deal })` | no meaningful fallback (JS required) |
| Room detail StickyBookNow | `packages/ui/src/organisms/StickyBookNow.tsx` | direct `<a>` to Octorate | works (link) |
| Apartment flows | `apps/brikette/src/app/[lang]/apartment/*` | route to `/[lang]/apartment/book` then redirect to Octorate | works (links) |

### Key Modules / Files

#### CTA Components
- `packages/ui/src/organisms/StickyBookNow.tsx` — Floating sticky CTA with Octorate deep link, "Book Now" label, "Best price guaranteed" + "Direct booking perks" badges. Session-dismissible. **Best-in-class CTA pattern on the site.**
- `apps/brikette/src/components/landing/BookingWidget.tsx` — Inline date/guest picker + "Check availability" button. Opens `openModal("booking")`.
- `apps/brikette/src/components/rooms/RoomCard.tsx` — Two action buttons per room: "Reserve Now -- Non-refundable" and "Reserve Now -- Flexible". Opens `openModal("booking2")`.
- `apps/brikette/src/app/[lang]/experiences/ExperiencesCtaSection.tsx` — Multi-button CTA: Book (modal), Events (bar-menu), Breakfast (breakfast-menu), Concierge (contact modal).
- `packages/ui/src/organisms/DesktopHeader.tsx` — Persistent "Check availability" CTA in header. `href` to `/book`, `onClick` intercepts to `openModal("booking")`.
- `packages/ui/src/organisms/MobileNav.tsx` — Mobile "Reserve" link. Same modal-open pattern.

#### Conversion Content Components (available but underused)
- `apps/brikette/src/components/booking/DirectBookingPerks.tsx` — 3 perks with icons (25% off, free breakfast, free evening drink). i18n via `dealsPage` namespace. **Only on rooms pages, not on `/book`.**
- `apps/brikette/src/components/landing/SocialProofSection.tsx` — Hostelworld + Booking.com rating badges + testimonials. **Only on home page.**
- `apps/brikette/src/components/booking/LocationInline.tsx` — Proximity badge + "Get Directions" button. **Only on room detail.**
- `apps/brikette/src/components/landing/FaqStrip.tsx` — Top 4 FAQ accordion items. **Only on home page.**
- `apps/brikette/src/components/booking/PolicyFeeClarityPanel.tsx` — Deposits, fees, cancellation. **On `/book` but without any balancing positive content.**

#### Booking Modals
- `apps/brikette/src/context/modal/global-modals/BookingModal.tsx` — Wraps `packages/ui/.../BookingModal.tsx`. DatePicker fields, guests dropdown. Builds Octorate URL. Opens in **new tab** (`<a target="_blank">`). Fires `fireBeginCheckoutGeneric()`.
- `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` — Wraps `packages/ui/.../BookingModal2.tsx`. Native date inputs, adults number input, PolicyFeeClarityPanel. **Redirects current page** via `window.location.assign()`. Fires `fireBeginCheckoutGeneric()`.
- `packages/ui/src/context/modal/context.ts` — `ModalType = "offers" | "booking" | "booking2" | "location" | "contact" | "facilities" | "language" | null`
- `packages/ui/src/context/modal/provider.tsx` — Single-modal-at-a-time state, body scroll lock, focus save/restore.
- `apps/brikette/src/context/modal/global-modals.tsx` — Memoized switcher rendering active modal in `<Suspense>`.
- `apps/brikette/src/context/modal/constants.ts` — `BOOKING_CODE = "45111"` (Octorate property code).

#### GA4 Analytics
- `apps/brikette/src/utils/ga4-events.ts` — `fireBeginCheckoutGeneric(source, checkin, checkout, pax)` (no value/currency) + `fireRoomBeginCheckout(roomSku, plan, checkin, checkout)` (with EUR value + items array).
- `apps/brikette/src/utils/trackApartmentEvent.ts` — `trackApartmentEvent(eventName, params)` for `click_check_availability`, `click_whatsapp`, `video_play_stepfree_route`.
- `apps/brikette/src/utils/ga4-consent-script.ts` — `buildGA4InlineScript()` for Consent Mode v2 defaults + gtag config.
- `apps/brikette/src/performance/reportWebVitals.ts` — CLS, LCP, INP -> `web_vitals` event.
- `apps/brikette/src/components/guides/PlanChoiceAnalytics.tsx` — `plan_choice` via `dataLayer.push()` (**inconsistent pattern**; should use gtag wrapper).
- `apps/brikette/src/app/layout.tsx` — GA4 script injection. `shouldLoadGA = IS_PROD && GA_MEASUREMENT_ID.length > 0`.
- `apps/brikette/src/components/consent/CookieConsent.tsx` — `vanilla-cookieconsent` v3, gated by `NEXT_PUBLIC_CONSENT_BANNER=1`.

#### Data Layer
- `apps/brikette/src/data/roomsData.ts` — 11 rooms with Octorate rate codes, base prices, pricing model (perBed/perRoom). Apartment entry has **TODO placeholders** for rate codes.
- `apps/brikette/src/rooms/pricing.ts` — `getPriceForDate()` with rate priority cascade.
- `apps/brikette/src/config/env.ts` — Centralized env var access (`GA_MEASUREMENT_ID`, `CONSENT_BANNER`, etc.).
- `apps/brikette/src/locales/en/bookPage.json` — Only 5 keys: `meta.title`, `meta.description`, `heading`, and date-picker labels. **No persuasive copy keys exist.**

#### SEO / Structured Data
- `apps/brikette/src/components/seo/BreadcrumbStructuredData.tsx` — JSON-LD `BreadcrumbList` (not on book page)
- `apps/brikette/src/components/seo/HomeStructuredData.tsx` — JSON-LD for home page (not on book page)
- `apps/brikette/src/utils/seo/jsonld/breadcrumb.ts` — Breadcrumb builder utility
- `apps/brikette/src/app/_lib/metadata.ts` — `buildAppMetadata()` shared metadata builder

#### Slug/i18n
- `apps/brikette/src/slug-map.ts` — Localized URL slugs for 18 languages (`book` -> `buchen`, `prenota`, `reserver`, etc.).
- `apps/brikette/src/i18n.config.ts` — 18 supported locales.

### Patterns & Conventions Observed

- **Modal-first booking pattern:** All hostel booking CTAs open a modal (booking or booking2) rather than navigating to a page. The modal collects dates/guests, builds an Octorate URL, and either opens a new tab (booking v1) or redirects (booking v2). Evidence: `BookingModal.tsx`, `Booking2Modal.tsx`.
- **StickyBookNow for high-intent pages:** Only used on room detail pages (`rooms/[id]`). Contains direct Octorate deep link (no modal intermediary), persuasion copy, and session-dismissible state. Evidence: `packages/ui/src/organisms/StickyBookNow.tsx`.
- **Conversion content segregation:** Persuasive components (`DirectBookingPerks`, `SocialProofSection`) exist but are siloed to rooms and home pages. The book page gets only the negative (fee disclosure) without the positive. This is the central architectural problem.
- **GA4 event pattern:** Safe `getGtag()` null-check wrapper -> `window.gtag("event", name, params)`. Evidence: `ga4-events.ts`.
- **i18n token resolution for CTAs:** Shared tokens `_tokens.bookNow`, `_tokens.reserveNow`, `_tokens.checkAvailability` resolved via `resolvePrimaryCtaLabel()`. Evidence: `packages/ui/src/config/navItems.ts`.
- **Lazy modal loading:** All modals loaded via `React.lazy` with `<Suspense>` fallback. Evidence: `apps/brikette/src/context/modal/lazy-modals.ts`.
- **Structured data pattern:** JSON-LD components are standalone React components that render `<script type="application/ld+json">` in the page head. Each page that has structured data imports the relevant component. Evidence: `HomeStructuredData.tsx`, `BreadcrumbStructuredData.tsx`.

### Data & Contracts

- Types/schemas:
  - `BookingModalCopy`, `BookingModal2Copy` — modal i18n copy shapes (`packages/ui/src/organisms/modals/types.ts`)
  - `ModalType` union — modal discriminator (`packages/ui/src/context/modal/context.ts`)
  - `BookingModalBuildParams`, `BookingModalHrefBuilder` — URL construction interfaces
  - Room data types in `roomsData.ts` (widgetRoomCode, widgetRateCodeNR, widgetRateCodeFlex, rateCodes, basePrice, pricingModel)
- Persistence:
  - No client-side persistence for booking state (dates/guests reset on modal close)
  - Session-based dismiss state for StickyBookNow (`sessionStorage`)
  - Cookie consent preferences stored by `vanilla-cookieconsent`
- API/event contracts:
  - Octorate URL contract: `https://book.octorate.com/octobook/site/reservation/result.xhtml?codice=45111&checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&pax=N[&children=0&childrenAges=][&deal=ID&utm_source=site&utm_medium=deal&utm_campaign=ID]`
  - GA4 event names: `begin_checkout`, `click_check_availability`, `click_whatsapp`, `video_play_stepfree_route`, `web_vitals`, `page_not_found`, `search`, `plan_choice`

### Dependency & Impact Map

- Upstream dependencies:
  - `packages/ui` — modal primitives (Radix UI Dialog), StickyBookNow, DesktopHeader, MobileNav, LandingHeroSection, RoomsSection, CarouselSlides
  - `@acme/design-system` — Button, DatePicker primitives
  - `vanilla-cookieconsent` — consent management
  - `web-vitals` — Core Web Vitals metrics
  - Octorate booking engine (external) — booking completion
  - Google Analytics 4 (external) — event collection + reporting
- Downstream dependents:
  - BRIK strategy metrics: session-to-booking CVR, begin_checkout count
  - 90-day forecast guardrails: "If CVR <1.2% after >=5,000 sessions, hold spend expansion and prioritize funnel fixes"
  - GA4 baseline lock verification (pending TASK-04 in `docs/plans/archive/brik-ga4-baseline-lock/plan.md`)
- Likely blast radius:
  - Book page restructure affects: `BookPageContent.tsx`, `bookPage.json` (all 18 locales), new structured data component
  - Adding CTAs to content pages affects: `GuideContent.tsx`, `BarMenuContent.tsx`, `BreakfastMenuContent.tsx`, about page, assistance pages, how-to-get-here pages
  - Adding GA4 events affects: every component that triggers a booking action, plus new `view_item` events on room/apartment pages
  - Staging verification involves: GitHub Actions env vars (separate GA4 measurement ID), deploy pipeline

### Per-Page CTA & Conversion Audit

| Page | Route | CTA Rating | Conversion Content | Key Gap |
|------|-------|------------|-------------------|---------|
| Home | `/[lang]` | STRONG | Hero CTA, BookingWidget, room carousel, social proof, FAQ strip | Good baseline |
| Rooms listing | `/[lang]/rooms` | GOOD | RoomCard x N + DirectBookingPerks | No standalone page-level CTA |
| Room detail | `/[lang]/rooms/[id]` | STRONGEST | RoomCard + StickyBookNow + DirectBookingPerks + LocationInline | Best implementation on site |
| **Book** | `/[lang]/book` | **MECHANICALLY STRONG / CONVERSION-EMPTY** | Date picker + rooms + fee panel | **Zero persuasive content. No DirectBookingPerks, no social proof, no structured data, no "why book direct", generic H1/meta.** |
| Deals | `/[lang]/deals` | STRONG | DealCard CTAs + bottom fallback CTA | Good |
| Apartment hub | `/[lang]/apartment` | GOOD | Check Availability + WhatsApp | Good |
| Apartment book | `/[lang]/apartment/book` | STRONG | Rate plan selector + full-width CTA + GA4 | Good |
| Apartment private-stay | `/[lang]/apartment/private-stay` | GOOD | Check Availability + WhatsApp | Good |
| Apartment street-level | `/[lang]/apartment/street-level-arrival` | GOOD | Check Availability + WhatsApp | Good |
| Experiences listing | `/[lang]/experiences` | GOOD | ExperiencesCtaSection | Good |
| **Guide detail** | `/[lang]/experiences/[slug]` | **WEAK** | **None at page level** | Primary SEO landing pages with no booking path |
| **Experiences tag** | `/[lang]/experiences/tags/[tag]` | **WEAK** | **Likely none** | Filtered guide list |
| **How-to-get-here index** | `/[lang]/how-to-get-here` | **WEAK** | **None** | Navigation-only index |
| **How-to-get-here detail** | `/[lang]/how-to-get-here/[slug]` | **WEAK** | **None** | Same GuideContent component |
| **Assistance index** | `/[lang]/assistance` | **WEAK** | **None** | Help centre index |
| **Assistance article** | `/[lang]/assistance/[article]` | **WEAK** | **None** | Same GuideContent component |
| **About** | `/[lang]/about` | **ZERO** | **None** | Brand storytelling with no next step |
| **Bar menu** | `/[lang]/bar-menu` | **ZERO** | **None** | Engaged guest, zero booking path |
| **Breakfast menu** | `/[lang]/breakfast-menu` | **ZERO** | **None** | Engaged guest, zero booking path |
| Careers | `/[lang]/careers` | N/A | Contact modal | Not a booking page |
| Legal pages | Various | N/A | None | Low-intent, appropriate |

**Critical findings:**
1. The `/book` page is a high-intent direct-entry surface (SEO/direct) and a no-JS fallback, and it has zero conversion content — only mechanical booking elements and a fee panel.
2. 10 other pages with real traffic have zero or weak booking CTAs.
3. Guide detail pages are primary SEO landing pages driving organic traffic with no booking path.

### Booking Flow Traces (As-Is)

#### Flow 1: Home -> Booking Modal v1 -> Octorate (new tab)

```
1. User lands on /{lang}/ (home page)
2. Sees hero with "Select dates" primary CTA + "View rooms" secondary CTA
3. Scrolls to BookingWidget (date picker overlapping hero)
4. Enters check-in, check-out, guests
5. Clicks "Check availability"
   -> openModal("booking", { checkIn, checkOut, adults })
6. BookingModal opens (Radix Dialog overlay)
   - Pre-filled dates/guests from widget
   - DatePicker for check-in/check-out, guests dropdown
7. Clicks "Check Availability" link in modal
   -> GA4: fireBeginCheckoutGeneric({ source: "booking_modal", checkin, checkout, pax })
      (NOTE: no price/value/currency in this event variant)
   -> <a target="_blank" href="https://book.octorate.com/...?codice=45111&checkin=...&checkout=...&pax=...">
8. Octorate booking engine opens in NEW TAB
9. User completes booking on Octorate (no callback to Brikette)
```

**GA4 events fired:** `begin_checkout` (generic, no value)
**GA4 events missing:** `view_item` (home page room carousel), `select_item` (carousel card click), modal open event, modal close event

#### Flow 2: Book Page -> RoomCard -> Booking Modal v2 -> Octorate (redirect)

```
1. User navigates to /{lang}/book (via header CTA, organic search, or direct link)
2. Sees: generic H1 "Book your stay", date picker, room cards, fee panel
   - NO "why book direct" content
   - NO trust signals
   - NO social proof
   - Fee panel presents costs without any balancing benefits
3. Each RoomCard shows: image, name, facilities, live price
4. Clicks "Reserve Now -- Non-Refundable" or "Reserve Now -- Flexible"
   -> openModal("booking2", { rateType, room, checkIn, checkOut, adults })
5. Booking2Modal opens (Radix Dialog)
   - Native date inputs for check-in/check-out, adults number input
   - PolicyFeeClarityPanel (deposits, policies, fees) — same costs AGAIN
6. Clicks "Confirm"
   -> GA4: fireBeginCheckoutGeneric({ source: "booking2_modal", checkin, checkout, pax })
      (NOTE: generic variant, no price/value/currency despite room being selected)
   -> window.location.assign("https://book.octorate.com/...?codice=45111&...")
7. Browser REDIRECTS to Octorate (same tab)
8. User completes booking on Octorate
```

**Conversion problem:** The user sees cost disclosures twice (page + modal) but zero benefits/value proposition. If they arrived from an OTA comparison, nothing on this page tells them why booking direct is better.

**GA4 events fired:** `begin_checkout` (generic, no value)
**GA4 events missing:** `view_item_list` (room listing), `view_item` (room card impression), `select_item` (room card click), modal open event, enriched `begin_checkout` with room price/currency

#### Flow 3: Room Detail -> StickyBookNow -> Octorate (direct)

```
1. User navigates to /{lang}/rooms/[id]
2. Sees room detail: gallery, description, facilities, live price, DirectBookingPerks, LocationInline
3. StickyBookNow floats at bottom of viewport
   - "Book Now" label + arrow icon
   - "Best price guaranteed" + "Direct booking perks" badges
4. Clicks StickyBookNow
   -> Direct <a> link to Octorate with rate-specific deep link params
   -> No modal intermediary
   -> No GA4 event fires (!)
5. User goes directly to Octorate
```

**GA4 events fired:** NONE from StickyBookNow click
**GA4 events missing:** `view_item` (room detail page view), `begin_checkout` (StickyBookNow click), click tracking event

#### Flow 4: Apartment -> Apartment Book -> Octorate (redirect)

```
1. User navigates to /{lang}/apartment
2. Sees apartment hub with "Check Availability" link + WhatsApp CTA
   -> GA4: trackApartmentEvent("click_check_availability", { source: "apartment_hub" })
3. Clicks "Check Availability" -> navigates to /{lang}/apartment/book
4. Apartment book page: date picker + rate plan toggle (NR/Flex)
5. Selects rate plan, enters dates
6. Clicks "Go to checkout"
   -> GA4: begin_checkout with { currency: "EUR", value: 265 * nights, items: [...] }
   -> window.location.assign(octorateUrl) with utm_source/utm_medium/utm_campaign
7. Browser redirects to Octorate
```

**GA4 events fired:** `click_check_availability` (apartment hub), `begin_checkout` (enriched with value)
**GA4 events missing:** `view_item` (apartment detail view)

#### Flow 5: Guide/Content Page -> Dead End

```
1. User lands on /{lang}/experiences/[slug] via organic search
2. Reads guide content (SEO-optimized, rich content)
3. Reaches end of guide
4. ... NO booking CTA available at page level
5. Only option: use header "Check availability" link (if user notices it)
   OR navigate away manually
```

**GA4 events fired:** None related to booking intent
**GA4 events missing:** Everything. No way to measure content-to-booking conversion.

#### Flow 6: Deals -> DealCard -> Booking Modal v1 -> Octorate

```
1. User navigates to /{lang}/deals
2. Sees active/upcoming deal cards
3. Clicks "Book Direct" on an active deal
   -> openModal("booking", { deal: dealId })
4. BookingModal opens with deal context
   -> Octorate URL includes &deal=<id>&utm_source=site&utm_medium=deal&utm_campaign=<id>
5. Clicks "Check Availability" -> new tab to Octorate
```

**GA4 events fired:** `begin_checkout` (generic, no value but has deal UTM params on the URL)
**GA4 events missing:** `view_item_list` (deals listing), deal card impression tracking, deal click tracking

### GA4 Event Coverage Gap Matrix

| Funnel Stage | GA4 Event | Status | Where Missing |
|---|---|---|---|
| Page view | `page_view` | AUTO (gtag config) | Covered by default GA4 |
| Item list view | `view_item_list` | **MISSING** | Rooms listing, deals listing, room carousel on home, book page room list |
| Item view | `view_item` | **MISSING** | Room detail, apartment detail, apartment sub-pages |
| Item selection | `select_item` | **MISSING** | Room card click, deal card click, carousel card click |
| CTA click | custom event | **PARTIAL** | Only apartment pages have `click_check_availability`. Missing from: header CTA, hero CTA, book page, guide pages (none exist), menu pages (none exist), about page (none exist), StickyBookNow |
| Modal open | custom event | **MISSING** | All 7 modal types have no open/close tracking |
| Modal close | custom event | **MISSING** | No tracking |
| Begin checkout | `begin_checkout` | **PARTIAL** | Exists but: (a) generic variant lacks value/currency, (b) StickyBookNow has no event at all |
| Purchase | `purchase` | **BLOCKED** | Octorate one-directional redirect, no callback. GA4-09 deferred. |


### GA4 Semantics Decision (Do Not Mix Implicitly)

Current state: `begin_checkout` fires from both booking modals even when no room/rate is selected (availability-only). This makes a standard e-commerce funnel (`view_item_list` -> `select_item` -> `begin_checkout`) analytically incoherent unless we lock semantics.

Two viable models (planning must pick one):

Model A — Standard e-commerce semantics (clean funnel)
- `search_availability` (custom) when a user clicks "Check availability" from generic entry points (header/hero/widget/BookingModal).
- `select_item` when a room/rate is actually chosen (RoomCard NR/Flex click).
- `begin_checkout` only when `items[]`/`value` can be populated (room + plan known) and we are leaving for Octorate.

Model B — "Leaving site to booking engine" semantics (single outbound counter)
- Keep `begin_checkout` for any outbound navigation to Octorate, but segment it:
  - `checkout_type`: `availability_only` | `room_selected` | `apartment`
  - `items[]` only when known
  - `value` only when known

High-cardinality param warning (dates)
- Prefer derived, low-cardinality params: `nights`, `lead_time_days`, `pax`. For rate plan, use GA4 convention: set `items[].item_variant` (enum: `flex` | `nr`) instead of a separate event-level param.
- If raw `checkin`/`checkout` are kept, treat them as diagnostic-only and do not register them as custom dimensions.

### Outbound Event Reliability Policy

Events that fire immediately before leaving the domain (same-tab redirects, `window.location.assign`) have real risk of event loss.

Minimum requirement:
- When redirecting the current tab, fire the event with `transport_type: "beacon"` and use `event_callback` (or a short timeout) to delay navigation a few milliseconds.
- For semantic `<a>` links that navigate immediately, add an `onClick` handler that fires the event and navigates after callback/timeout.

This is mandatory for the highest-signal events (`select_item`, `begin_checkout`).

### Event Contract (Planning Input)

The plan should lock an explicit event contract before implementation to prevent parameter drift (free-form `source`/`location`/`context` strings) and to make tests deterministic.

| Event | Trigger | Dedupe rule | Required params | Optional params |
|---|---|---|---|---|
| `view_item_list` | Rooms list rendered (rooms, book, home carousel), deals list rendered | once per route render per `item_list_id` | `item_list_id` (enum), `item_list_name`, `items[]` (each: `item_id`, `item_name`, `item_category`, `index`) | `price` (only if shown), `currency` |
| `view_item` | Room detail page view, apartment page view | once per route render per `item_id` | `items[]` (single item: `item_id`, `item_name`, `item_category`) | item-level: `item_variant` (rate plan if known), `price` (only if shown), `currency` |
| `select_item` | User clicks a room/rate CTA (NR/Flex) | per click | `item_list_id`, `item_list_name`, `items[]` (selected item: `item_id`, `item_name`, `item_category`, `item_variant` (enum: `flex` | `nr`), `index`) | item-level: `price` (only if shown), `currency` |
| `begin_checkout` | Outbound to Octorate | per outbound click | Model-dependent (A: `items[]` required when room-selected; B: `checkout_type` required) | `value` (only when known), `currency` (when `value` present) |
| `cta_click` (custom) | Header/hero/content-page CTA click | per click | `cta_id` (enum), `cta_location` (enum) | `item_list_id` (if applicable) |
| `modal_open` / `modal_close` (custom) | Booking modals opened/closed | once per open/close | `modal_type` (enum: `booking` | `booking2` | ...) | `source` (enum) |


### Analytics Enums (Authoritative)

All enum values are lowercase `snake_case`. Do not introduce new values ad-hoc during implementation; update this list first.

- `item_list_id`:
  - `home_rooms_carousel`
  - `rooms_index`
  - `book_rooms`
  - `deals_index`
- `cta_id`:
  - `header_check_availability`
  - `mobile_nav_check_availability`
  - `hero_check_availability`
  - `booking_widget_check_availability`
  - `room_card_reserve_nr`
  - `room_card_reserve_flex`
  - `sticky_book_now`
  - `deals_book_direct`
  - `content_sticky_check_availability`
- `cta_location`:
  - `desktop_header`
  - `mobile_nav`
  - `home_hero`
  - `home_booking_widget`
  - `rooms_list`
  - `book_page`
  - `room_detail`
  - `deals_page`
  - `guide_detail`
  - `about_page`
  - `bar_menu`
  - `breakfast_menu`
  - `assistance`
  - `how_to_get_here`
- `modal_type` (matches `ModalType` union):
  - `offers`, `booking`, `booking2`, `location`, `contact`, `facilities`, `language`
- `source` (if retained on events; prefer this over free-form `context`):
  - `header`, `mobile_nav`, `hero`, `booking_widget`, `room_card`, `sticky_cta`, `deals`, `unknown`

### Item Identity Mapping (Authoritative)

- `items[].item_id` source of truth: `Room.sku` from `apps/brikette/src/data/roomsData.ts` (stable, locale-independent). For apartment, use the existing `sku` (`apartment`).
- Do not use Octorate room/rate codes as `item_id`. If needed for diagnostics, include them as separate params (e.g., `octorate_room_code`, `octorate_rate_code`) and do not register them as dimensions.

### Dedupe Strategy (Implementation Hook)

Impression-style events must not double-fire due to re-renders (date changes, hydration, list re-composition).

Minimum implementation approach (choose one and apply consistently):
- Module-level in-memory `Set` keyed by `${eventName}:${pathname}:${item_list_id}` to guard `view_item_list` per navigation.
- `useRef` guard per component instance for `view_item` on detail pages.

### Price Semantics (Authoritative)

- `items[].price` (on `view_item_list` / `view_item` / `select_item`): only include when it is the stable base "from" nightly price sourced from `roomsData.ts` (`basePrice.amount`) and the unit is understood from `pricingModel` (per bed night vs per room night). Do not emit date-dependent computed totals in these events.
- `begin_checkout.value`: only include when a reliable total can be computed for the outbound flow (apartment currently can). For hostel room flows, do not force `value` in this iteration if the rate logic cannot produce a trustworthy total; keep `items[]` + `item_variant` and add totals later.

### Existing Related Work

| Document | Status | Relevance |
|---|---|---|
| `docs/plans/archive/brik-ga4-world-class-plan.md` | 85% complete (GA4-09 deferred) | Foundation: consent, gtag setup, e-commerce begin_checkout. **GA4-09 absorbed into this fact-find** (see Non-goals — remains blocked by Octorate's one-directional redirect; options documented: webhook, redirect-back, periodic API sync, manual CSV import). |
| `docs/plans/archive/brik-ga4-world-class-fact-find.md` | Complete | Evidence base for GA4 architecture decisions |
| `docs/plans/archive/brik-ga4-baseline-lock/plan.md` | TASK-04 pending | 7-day verification; report-layer still showing 0 events. **TASK-04 absorbed into this fact-find** as Track D task seed (add direct test coverage for `reportWebVitals.ts`). |
| `docs/plans/brikette-booking-funnel-usability-hardening-fact-find.md` | Ready for planning | CTA fallback behavior, i18n leakage, no-JS degradation |
| `docs/plans/archive/brik-policy-fee-clarity-and-booking-perf/plan.md` | Archived | P1 per prioritization scorecard; conversion quality via trust signals |
| `docs/business-os/strategy/BRIK/plan.user.md` | Active | Canonical metrics: 0% CVR, 0 begin_checkout in first 7-day window |
| `docs/business-os/strategy/BRIK/2026-02-13-measurement-verification.user.md` | Complete | Collect-level capture works; report-layer freshness issue |

### Test Landscape

#### Test Infrastructure
- **Frameworks:** Jest (unit/integration), Cypress (E2E, not heavily used for brikette), Playwright (available)
- **Commands:** `pnpm --filter brikette test` (Jest), `pnpm test:e2e` (Cypress/Playwright)
- **CI integration:** 3 Jest shards for brikette in `reusable-app.yml`
- **Coverage tools:** Jest coverage available but not enforced with thresholds

#### Existing Test Coverage (GA4-related)

| Area | Test Type | Files | Coverage Notes |
|------|-----------|-------|----------------|
| GA4 consent script | unit | `src/test/utils/ga4-consent-script.test.ts` | Consent Mode v2 script generation |
| 404 page tracking | unit | `src/test/components/ga4-07-tracking.test.tsx` | `page_not_found` event |
| Apartment checkout | unit | `src/test/components/ga4-07-apartment-checkout.test.tsx` | Apartment `begin_checkout` |
| Room checkout payload | unit | `src/test/components/ga4-08-book-checkout-payload.test.tsx` | Room `begin_checkout` e-commerce |
| BookingModal checkout | unit | `src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx` | BookingModal `begin_checkout` |
| Booking2Modal checkout | unit | `src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx` | Booking2Modal `begin_checkout` |
| Guide search GA4 | unit | `src/test/hooks/useGuideSearch-ga4.test.ts` | `search` event |
| Cookie consent | unit | `src/test/components/consent/CookieConsent.test.tsx` | Consent banner + gtag update |
| Web Vitals | unit | `src/test/performance/reportWebVitals.test.ts` | Web Vitals emission |

#### Test Patterns & Conventions
- Unit tests: Mock `window.gtag` via `vi.fn()` or Jest mock, assert call args
- GA4 test naming: `ga4-NN-description.test.tsx` sequential numbering
- Test data: Inline fixtures in each test file
- Assert pattern: `expect(window.gtag).toHaveBeenCalledWith("event", "event_name", expect.objectContaining({...}))`

#### Coverage Gaps (Planning Inputs)
- **Untested paths:**
  - `reportWebVitals.ts` — **absorbed from TASK-04** in `brik-ga4-baseline-lock/plan.md` (76% confidence; needs: select preferred test seam — mock `navigator.sendBeacon` or mock `web-vitals` callbacks — and file location with concrete example test case outline)
  - `PlanChoiceAnalytics.tsx` — uses inconsistent `dataLayer.push` pattern, no test
  - `StickyBookNow.tsx` — no GA4 event exists, therefore no test
  - No tests for `view_item`, `select_item`, modal open/close events (because they don't exist yet)
  - No tests for book page structured data (because it doesn't exist yet)
- **Extinct tests:** None identified
- **Testability:** HIGH — existing pattern is well-established, easy to replicate for new events

#### Recommended Test Approach
- Unit tests for: each new GA4 event helper function (view_item, select_item, CTA click, modal tracking)
- Integration tests for: component-level tests verifying events fire on user interaction (following existing `ga4-NN-*.test.tsx` pattern)
- Snapshot/render tests for: book page structured data JSON-LD output
- E2E tests for: staging verification protocol (manual or Playwright script to probe GA4 collect endpoint)

### Staging Deployment Configuration

| Aspect | Detail |
|---|---|
| URL | `https://staging.brikette-website.pages.dev` |
| Deploy target | Cloudflare Pages (free tier) |
| Build mode | `OUTPUT_EXPORT=1` -> static HTML in `out/` |
| Deploy command | `wrangler pages deploy out --project-name brikette-website --branch staging` |
| Triggers | Push to `main` or `staging` branch; manual `workflow_dispatch` |
| GA4 loads | Yes (`NODE_ENV=production` during build -> `IS_PROD=true`) |
| GA4 measurement ID | Same as production (`vars.NEXT_PUBLIC_GA_MEASUREMENT_ID`) |
| Consent banner | Gated by `NEXT_PUBLIC_CONSENT_BANNER=1` |
| noindex | Auto-detected via `staging.` in domain |
| Middleware | Does NOT run (static Pages limitation) |

**Key issue for verification:** Staging and production share the same GA4 measurement ID. Events from staging will pollute production data. Options:
1. **Recommended:** Create a separate GA4 data stream for staging; set `NEXT_PUBLIC_GA_MEASUREMENT_ID` as an environment-scoped GitHub Actions variable per environment (`staging-pages` vs `production`)
2. Use `traffic_type: "internal"` filtering in GA4 reports (already set for non-production, but both are technically `NODE_ENV=production`)
3. Temporary: use GA4 Realtime report to watch for staging events during manual testing

### Recent Git History (Targeted)

- GA4 world-class implementation completed 2026-02-12 (GA4-01 through GA4-08)
- Baseline lock verification completed 2026-02-13 (TASK-01 through TASK-03)
- Report-layer still showing 0 begin_checkout events as of 2026-02-13 (likely freshness delay)
- Booking funnel usability hardening fact-find exists but has no plan yet

## Questions

### Resolved

- Q: Does GA4 fire on staging?
  - A: Yes. The staging build uses `NODE_ENV=production`, so `IS_PROD=true` and GA4 scripts load.
  - Evidence: `apps/brikette/src/app/layout.tsx` line 94, `.github/workflows/brikette.yml` staging build-cmd

- Q: Is there a way to track purchases on Octorate?
  - A: No. Octorate's booking flow is one-directional (redirect only, no callback, no webhook). This is documented as GA4-09 (deferred) in `docs/plans/archive/brik-ga4-world-class-plan.md`.
  - Evidence: `docs/plans/archive/brik-ga4-world-class-fact-find.md`, Booking2Modal.tsx (`window.location.assign`)

- Q: Which pages have the strongest CTA implementations?
  - A: Room detail (`/rooms/[id]`) with StickyBookNow + RoomCard + DirectBookingPerks + LocationInline. Home page is second with hero CTA + BookingWidget + room carousel + social proof.
  - Evidence: `packages/ui/src/organisms/StickyBookNow.tsx`, `apps/brikette/src/app/[lang]/HomeContent.tsx`

- Q: How many distinct booking entry points exist?
  - A: 10 trigger points feeding into 3 terminal actions: BookingModal (new tab), Booking2Modal (redirect), direct Octorate link (StickyBookNow + apartment book).
  - Evidence: Complete modal trigger inventory in modal system audit

- Q: Does StickyBookNow fire any GA4 events?
  - A: No. It is a plain `<a>` link with no gtag call.
  - Evidence: `packages/ui/src/organisms/StickyBookNow.tsx`

- Q: Is the generic begin_checkout event missing e-commerce data?
  - A: Yes. `fireBeginCheckoutGeneric()` sends only source/dates/pax. The enriched `fireRoomBeginCheckout()` sends currency/value/items but is only used in specific paths.
  - Evidence: `apps/brikette/src/utils/ga4-events.ts`

- Q: What conversion content exists in the codebase but is not on the book page?
  - A: `DirectBookingPerks` (25% off, free breakfast, free drink), `SocialProofSection` (ratings + testimonials), `LocationInline` (proximity + directions), `FaqStrip` (FAQ accordion). All exist, none imported on `/book`.
  - Evidence: `DirectBookingPerks.tsx` (imported only in rooms pages), `SocialProofSection.tsx` (imported only in `HomeContent.tsx`)

- Q: Does the book page have any structured data?
  - A: No. Zero JSON-LD. No `Hostel`, `LodgingBusiness`, `FAQPage`, `BreadcrumbList`, or `Offer` schema.
  - Evidence: Searched `apps/brikette/src/app/[lang]/book/` for `json-ld`, `JsonLd`, `schema`, `structured` — zero results.

### Open (User Input Needed)

- Q: Which GA4 semantics model? (Model A vs Model B)
  - Why it matters: Prevents a hybrid funnel where availability-only and room-selected flows are mixed under `begin_checkout`, which breaks e-commerce funnel analysis.
  - Decision impacted: Whether BookingModal (availability-only) stops firing `begin_checkout` (Model A) vs keeps it with segmentation (Model B); downstream reporting and tests.
  - Decision owner: Pete
  - Default assumption: **Model A (clean funnel)**.

- Q: Should we create a separate GA4 property for staging, or use a separate data stream within the same property?
  - Why it matters: Determines whether staging events pollute production reports. Separate property is cleanest but requires a new GA4 measurement ID.
  - Decision impacted: GitHub Actions env var configuration, staging verification protocol.
  - Decision owner: Pete
  - Default assumption: Separate data stream within same property (simpler; can use GA4 data stream filter). Risk: some report bleed if filter not configured correctly.

- Q: Sticky CTA rollout: which variant applies on which page types?
  - Why it matters: StickyBookNow assumes room context and uses a direct Octorate deep link; most content pages lack room/rate context and may prefer a generic availability flow.
  - Decision impacted: Component choice per page type, analytics semantics (`begin_checkout` vs availability tracking), and UX intrusiveness.
  - Decision owner: Pete
  - Options: Variant A: sticky bar that opens `BookingModal` (generic availability). Variant B: `StickyBookNow` (direct deep link) only where room context exists (room detail pages).
  - Default assumption: Use Variant A on content pages; keep Variant B on room detail pages.

- Q: Priority ordering: should we do book page conversion content first (highest single-page impact) or GA4 instrumentation first (measurement foundation)?
  - Why it matters: Book page conversion content is the highest-impact single change but won't be measurable without GA4 events. GA4 events let us measure existing flows but don't improve them.
  - Decision impacted: Task sequencing in /lp-plan.
  - Decision owner: Pete
  - Default assumption: Book page conversion content + GA4 events in parallel tracks (content is high-value and doesn't depend on event instrumentation; events can instrument both old and new content). Risk: slightly more complex plan.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 85%
  - Strong existing patterns for CTAs (StickyBookNow, ExperiencesCtaSection, DirectBookingPerks), GA4 events (ga4-events.ts, test conventions), and structured data (existing JSON-LD components). Well-documented modal system. Clear component boundaries. Book page enhancement is primarily composition of existing components.
  - What would raise to 90%+: Confirm StickyBookNow renders correctly alongside the book page date picker. Confirm `DirectBookingPerks` renders correctly outside of the rooms page context (it uses `dealsPage` i18n namespace, not `bookPage`).

- **Approach:** 82%
  - Approach is sound: upgrade book page with existing components, extend proven CTA patterns to content pages, fill GA4 e-commerce event gaps, verify on staging. The room detail page proves the pattern works (StickyBookNow + DirectBookingPerks + LocationInline).
  - What would raise to 90%+: Resolve open questions about StickyBookNow reuse vs. lighter variant. Confirm staging GA4 data stream isolation approach.

- **Impact:** 85%
  - Blast radius is well-understood. Book page changes are additive (new sections, not replacing existing ones). CTA additions to content pages affect GuideContent, menu pages, about page. GA4 changes are mostly additive, but enforcing the chosen semantics model may adjust existing BookingModal/Booking2Modal emissions (e.g., Model A replaces availability-only `begin_checkout`). Structured data is new markup only.
  - What would raise to 90%+: Verify that adding conversion sections to the book page doesn't significantly increase page weight / hurt LCP.

- **Delivery-Readiness:** 80%
  - Clear execution path: code changes -> staging deploy -> GA4 Realtime verification -> merge to main. Well-established CI pipeline. Known deployment process.
  - What would raise to 90%+: Set up staging GA4 data stream before starting work. Establish a documented verification checklist.

- **Testability:** 90%
  - Existing test patterns are excellent. 9 GA4 test files with consistent patterns. JSON-LD structured data is testable via snapshot tests. New events follow the same `window.gtag` mock + assert call args pattern.
  - Minor gap: `reportWebVitals.ts` test coverage (absorbed from TASK-04; now Track D task seed #23).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Staging GA4 events pollute production data | High (if not addressed) | Medium | Set up separate staging data stream with environment-scoped measurement ID. Open question for Pete. |
| Book page conversion content increases page weight and hurts LCP | Low | Medium | All proposed components already exist and are lightweight (text + icons). Monitor LCP via Web Vitals. |
| StickyBookNow overlaps/conflicts with guide-specific UI elements | Low | Medium | Spike: render on one guide page in dev. Check for z-index/position conflicts with guide TOC or image lightbox. |
| Report-layer freshness delay means verification takes 24-48h per event | Medium | Low | Use GA4 Realtime report for immediate verification. Collect-endpoint probe as secondary confirmation. |
| Adding CTAs to content pages feels intrusive/spammy | Medium | Medium | Use the StickyBookNow pattern (session-dismissible) so users who dismiss aren't pestered. Consider a lighter variant for informational pages. |
| `begin_checkout` semantics drift (availability-only vs room-selected) makes funnel analysis incoherent | Already happening | High | Lock Model A or Model B (see GA4 Semantics Decision) and update BookingModal/Booking2Modal + tests accordingly; do not claim `items[]`/`value` when unknown. |
| Book page structured data (lodging schema) has incorrect or incomplete properties | Low | Low | Validate JSON-LD with Schema Markup Validator; use Rich Results Test only for supported eligibility checks. Add snapshot tests to prevent regression. |
| i18n: new `bookPage.json` keys need translation for 18 locales | Medium | Low | Start with EN only; other locales fall back to EN via i18next. Translate in a follow-up pass. |
| PlanChoiceAnalytics uses inconsistent dataLayer.push pattern | Already happening | Low | Migrate to gtag wrapper pattern as part of this work. |

## Planning Constraints & Notes

- Must-follow patterns:
  - GA4 events must use the `getGtag()` null-safe pattern from `ga4-events.ts`
  - New GA4 test files should follow the `ga4-NN-description.test.tsx` naming convention
  - CTA components must support all 18 locales via i18n tokens (use `_tokens` namespace)
  - Modal triggers must use `useModal().openModal(type, data)` pattern
  - JSON-LD structured data should follow existing pattern: standalone React component rendering `<script type="application/ld+json">`
  - New book page content should be added to `bookPage.json` i18n namespace, not hardcoded
  - New CTA components should be lazy-loaded if they contain heavy assets
- Rollout/rollback expectations:
  - All changes verified on staging before merge to main
  - GA4 changes are additive **except** for BookingModal/Booking2Modal semantics adjustments required to enforce the chosen model (e.g., Model A replaces availability-only `begin_checkout` with `search_availability`).
  - Existing GA4 tests will be updated accordingly (not just added-to), including `apps/brikette/src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx` and `apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx`
  - CTA and content additions are purely additive (no removal of existing elements)
  - Rollback: revert commit (no migration or state to clean up)
- Observability expectations:
  - Each new GA4 event must be verifiable in GA4 DebugView and Realtime (Realtime alone is insufficient for payload QA)
  - Structured data must validate for schema.org correctness (Schema Markup Validator). Use Google Rich Results Test only for eligibility checks on supported types
  - Staging verification protocol should be documented as a repeatable checklist
  - Post-deploy: confirm events appear in GA4 within 24-48h of production deploy

## Suggested Task Seeds (Non-binding)

### Track A: Book Page Conversion Optimisation
1. Rewrite book page H1, subheading, and meta title/description with property name + location + direct booking value prop
2. Add `DirectBookingPerks` component to book page (above room cards)
3. Add compact `SocialProofSection` or rating strip to book page
4. Add `LocationInline` component to book page
5. Add FAQ section to book page (reuse `FaqStrip` or create book-specific FAQ)
6. Create `BookPageStructuredData` component — lodging JSON-LD (`Hostel`/`LodgingBusiness`) with a minimum static field set (`name`, `address`, `geo`, `url`, `image`, `checkinTime`, `checkoutTime`, `amenityFeature`, `priceRange`, `potentialAction: ReserveAction`). Omit `aggregateRating` unless first-party reviews are hosted on-site
7. Add `FAQPage` JSON-LD schema to book page FAQ section
8. Add `BreadcrumbStructuredData` to book page
9. Add internal links to relevant guides (how to get here, things to do in Positano)
10. Add new i18n keys to `bookPage.json` for all new content

### Track B: Site-Wide CTA Coverage
11. Add a sticky CTA pattern to GuideContent pages, about page, bar-menu, breakfast-menu (Variant A: opens `BookingModal` generic availability; reserve `StickyBookNow` deep links for room-context pages)
12. Add ExperiencesCtaSection-style block to how-to-get-here index and assistance index

### Track C: GA4 Event Pipeline
13. Set up staging GA4 data stream (environment-scoped measurement ID in GitHub Actions)
14. Create shared GA4 event helpers: `fireViewItemList`, `fireViewItem`, `fireSelectItem`, `fireCTAClick`, `fireModalOpen`, `fireModalClose`
15. Lock GA4 semantics model (A or B). **Default assumption: Model A (clean funnel)**
    - Model A assumption: BookingModal availability-only exits emit `search_availability` (custom), and `begin_checkout` is reserved for room-selected/apartment flows where `items[]` is meaningful
    - Model B alternative: keep `begin_checkout` for all Octorate exits but require `checkout_type` segmentation, with `items[]`/`value` only when known
16. Add `begin_checkout` event to StickyBookNow click
17. Add `view_item_list` to rooms listing page, book page, and home page carousel
18. Add `view_item` to room detail page and apartment detail pages
19. Add `select_item` to room card clicks and carousel card clicks
20. Add `fireCTAClick` to header booking CTA, hero CTA, new content page CTAs
21. Add `fireModalOpen`/`fireModalClose` to ModalProvider
22. Migrate PlanChoiceAnalytics from dataLayer.push to gtag wrapper
23. Apply outbound-event reliability policy for same-tab redirects and semantic links (`transport_type: "beacon"`, `event_callback`, short delay)

### Track D: Testing & Verification
24. Add direct test coverage for `reportWebVitals.ts` (absorbed from TASK-04 in `brik-ga4-baseline-lock/plan.md` — select test seam: mock `navigator.sendBeacon` or mock `web-vitals` callbacks; file: `src/test/performance/reportWebVitals-coverage.test.ts`)
25. Write unit tests for all new GA4 events (following ga4-NN pattern)
26. Write snapshot tests for book page structured data JSON-LD
27. Deploy to staging and execute GA4 verification protocol
28. Document GA4 verification protocol as a repeatable checklist

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-spec` (for book page layout decisions), `/lp-seo` (structured data validation, meta tag optimisation)
- Deliverable acceptance package:
  - Book page has: conversion-optimised H1/meta, DirectBookingPerks, social proof, FAQ section, location snippet, lodging + `FAQPage` + `BreadcrumbList` JSON-LD (no third-party `aggregateRating`), internal guide links
  - All 10 CTA-lacking pages have at least one booking CTA
  - GA4 e-commerce events `view_item_list`, `view_item`, `select_item` implemented
  - `begin_checkout` events include `items[]`/`value`/`currency` only when known (room-selected/apartment flows). Availability-only flows use the chosen semantics model (custom event or `checkout_type` segmentation)
  - CTA click + modal open/close tracking implemented
  - All new events verified on staging (documented proof: GA4 DebugView checks + Network payload inspection + Realtime arrival)
  - Structured data validates for schema.org correctness (Schema Markup Validator); Rich Results Test used only for supported eligibility checks
  - Unit tests for every new GA4 event + snapshot tests for structured data
  - All existing tests pass (`pnpm --filter brikette test`)
- Post-delivery measurement plan:
  - 7-day GA4 data extract showing non-zero counts for: `view_item_list`, `view_item`, `select_item`, `begin_checkout` (segmented per semantics model; `room_selected` flows have `items[]`/`value`), CTA click events
  - Session-to-booking CVR measurable (even if Octorate purchase tracking remains deferred)
  - Funnel visualization in GA4: page_view -> view_item -> select_item -> begin_checkout
  - Google Search Console: monitor `/book` page impressions/clicks for keyword "book hostel Positano" and similar
  - Structured data validation: Schema Markup Validator confirms schema.org correctness; Rich Results Test checks supported eligibility for `FAQPage` and any supported lodging outputs

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: None. Open questions have reasonable defaults.
- Recommended next step: Proceed to `/lp-plan`. Answer open questions during planning if Pete has preferences; otherwise use defaults.

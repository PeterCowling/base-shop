---
Type: Fact-Find
Outcome: Planning
Status: Ready-for-planning
Domain: UI | API | Data
Workstream: Mixed
Created: 2026-02-15
Last-updated: 2026-02-18
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

### Scope Amendment — 2026-02-18: Clean Break From Booking Modals

**Decision (Pete, 2026-02-18):** Remove `BookingModal` (V1) and `Booking2Modal` (V2) entirely. All booking-intent CTAs route directly to the `/{lang}/book` page or Octorate, with no modal intermediary.

**Retained modals (informational / non-booking):** `location`, `contact`, `facilities`, `language`, `offers`.

**OffersModal CTA chain change:** "Reserve Now" inside `OffersModal` currently does `closeModal() → openModal("booking")`. It becomes `closeModal() → router.push(\`/${lang}/book\`)` (canonical path — see Decision A; update to `getSlug` variant after route truth verification if applicable).

**GA4 semantics resolved by this decision:** Model A (clean funnel) is now the only option. Booking modals no longer fire any `begin_checkout` events. The funnel becomes: `cta_click` → `page_view(/{lang}/book)` → `view_item_list` → `select_item` → `begin_checkout` (direct Octorate navigation from room card).

**Sticky CTA variant resolved:** `ContentStickyCta` (Variant A: content pages) becomes a `<Link href="/{lang}/book">`. `StickyBookNow` (Variant B: room detail, with direct Octorate deep link) is unchanged.

See **Modal Removal Blast Radius** section for the complete surgical impact list.

### Summary

The Brikette website has the mechanics of a booking flow (date picker, room cards, Octorate redirect) but no coherent conversion pipeline. The 2026-02-18 scope amendment removes `BookingModal`/`Booking2Modal` entirely and routes all booking CTAs through the `/{lang}/book` page. The target funnel is: CTA click → `/book` (date picker + room list) → direct Octorate navigation from room card. The `/book` page currently renders a bare date picker, a room list, and a fee disclosure panel with zero persuasive content — it needs conversion content, structured data, and GA4 instrumentation before it can serve as the universal booking entry point. The `DirectBookingPerks` component (25% off, free breakfast, free evening drink) already exists but is not imported on the book page. Meanwhile, 10 other high-traffic pages have zero or weak booking CTAs, and the GA4 e-commerce event pipeline is incomplete. This fact-find documents the as-is state, the modal removal blast radius, and all planning decisions needed to ship a coherent funnel.

### Goals

- **Remove booking modals (Track E — prerequisite):** Delete `BookingModal`/`Booking2Modal` and all 11 call sites; route all booking-intent CTAs to `/{lang}/${getSlug("book", lang)}` or direct Octorate links per the blast radius table
- **Transform `/book` into a conversion-optimized landing page (SEO + direct-entry):** add "Why Book Direct" value proposition, trust signals, structured data (lodging + `FAQPage` JSON-LD), persuasive meta title/description, internal links to guide content, and ensure dates-required gate on room card CTAs
- **Add booking CTAs to all high-traffic pages currently lacking them:** about, bar-menu, breakfast-menu, guide detail pages, assistance, how-to-get-here
- **Implement a coherent GA4 funnel:** `cta_click` → `page_view(/book)` → `view_item_list` → `select_item` → `begin_checkout` (with `items[]` always present); add `search_availability` event for date submission on `/book`; add `view_promotion`/`select_promotion` for deals tracking; apply `trackThenNavigate` reliability policy for all outbound Octorate navigations
- **Verify GA4 events on staging using DebugView + Network payload checks + Realtime** (Realtime-only is insufficient for `items[]`/`value` QA); staging GA4 stream isolation is a hard prerequisite gate (Task 0 for Track C)

### Non-goals

- Redesigning the Octorate booking engine itself (external system)
- Implementing `purchase` event tracking (blocked by Octorate's one-directional redirect; absorbed from GA4-09 in `docs/plans/archive/brik-ga4-world-class-plan.md` — remains deferred at 70% confidence; unblock options: webhook if found in Octorate admin, redirect-back flow, periodic API sync, manual CSV import)
- A/B testing framework (archived plan exists; not in scope here)
- Booking modal usability improvements (separate deferred scope; see `docs/plans/brikette-booking-funnel-usability-hardening-fact-find.md` — moot post-amendment since modals are being removed)
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
- **Description:** "Book direct for up to 25% off, complimentary breakfast & evening drinks. Sea-view terraces, Positano's best-rated hostel. Best price guaranteed."

**Note on "only hostel in Positano":** Avoid this claim unless it can be fact-checked and is legally defensible. If Positano has other hostels, it's false advertising. Use "best-rated" or "award-winning" (if true and sourced) instead.

#### Structured data

**None.** The book page has zero JSON-LD. No `Hostel`/`LodgingBusiness` schema, no `FAQPage`, no `BreadcrumbList`, no `Offer`. This is a missed opportunity to provide structured data that can improve understanding and eligibility for rich results (no outcomes are guaranteed).

#### What a conversion-optimized book page needs

**Priority order (highest impact first):**

1. **"Book Direct & Save" value proposition section** — import `DirectBookingPerks` above the room cards. This is the #1 reason the page exists: differentiate from Hostelworld/Booking.com.
2. **H1 with property name + location** — "Book Direct at Hostel Brikette, Positano" (keyword target: property name + location). Do not include "only hostel in Positano" — unverified and legally risky. Use a verifiable differentiator if one exists (e.g. highest-rated, sea-view, etc.).
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

Planning should choose one approach explicitly (booking modals are removed — `/book` is the only consumer):
- Allow `/book` to load additional namespaces (`dealsPage`, `homePage`, etc.) — simplest, no new primitives; **recommended**
- Create book-specific variants that accept copy via props from `bookPage` — cleaner separation but more work
- Move shared copy into a shared namespace — more refactor than warranted at this stage


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

**Post-amendment (2026-02-18):** Booking modals are removed. All booking-intent CTAs route to `/{lang}/book` (or directly to Octorate for room-card CTAs with full context).

| Trigger | Component/File | Target behavior (post-amendment) | No-JS behavior |
|---|---|---|---|
| Header primary CTA (Desktop) | `packages/ui/src/organisms/DesktopHeader.tsx` | `<Link href="/{lang}/book">` (was: intercept → modal) | navigates to `/[lang]/book` (unchanged) |
| Header primary CTA (Mobile) | `packages/ui/src/organisms/MobileNav.tsx` | `<Link href="/{lang}/book">` (was: intercept → modal) | navigates to `/[lang]/book` (unchanged) |
| Home hero primary CTA | `apps/brikette/src/app/[lang]/HomeContent.tsx` | `router.push(/{lang}/book)` (was: `openModal("booking")`) | now works via `<Link>` fallback |
| BookingWidget submit | `apps/brikette/src/components/landing/BookingWidget.tsx` | `router.push(/{lang}/book?checkin=X&checkout=Y&pax=N)` (was: modal with prefill) | `/book` URL is shareable/bookmarkable |
| RoomCard reserve buttons (rooms list, book page) | `apps/brikette/src/components/rooms/RoomCard.tsx` | Direct `<a href={octorateUrl}>` built from room's rate codes + dates (was: `openModal("booking2", ...)`) | works (plain `<a>` link) |
| Home RoomsSection reserve buttons | `packages/ui/src/organisms/RoomsSection.tsx` | `router.push(/{lang}/book)` (was: `openModal("booking2", ...)`) | works via Link |
| Deals reserve CTA | `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` | `router.push(/{lang}/book?deal=dealId)` (was: modal with deal payload) | works via Link |
| ContentStickyCta (content pages) | `apps/brikette/src/components/cta/ContentStickyCta.tsx` | `<Link href="/{lang}/book">` (was: `openModal("booking")`) | works via Link |
| OffersModal CTA | `apps/brikette/src/context/modal/global-modals/OffersModal.tsx` | `closeModal(); router.push(/{lang}/book)` (was: chain to BookingModal) | N/A (modal JS-only) |
| NotFoundView booking CTA | `apps/brikette/src/components/not-found/NotFoundView.tsx` | `<Link href="/{lang}/book">` (was: `openModal("booking")`) | works via Link |
| Room detail StickyBookNow | `packages/ui/src/organisms/StickyBookNow.tsx` | Direct `<a>` to Octorate — **unchanged** | works (link) |
| Apartment flows | `apps/brikette/src/app/[lang]/apartment/*` | Route to `/[lang]/apartment/book` then redirect to Octorate — **unchanged** | works (links) |

### Key Modules / Files

#### CTA Components (AS-IS — booking modal references below are the current state, not the target)
- `packages/ui/src/organisms/StickyBookNow.tsx` — Floating sticky CTA with Octorate deep link, "Book Now" label, "Best price guaranteed" + "Direct booking perks" badges. Session-dismissible. **Best-in-class CTA pattern on the site. Unchanged post-amendment.**
- `apps/brikette/src/components/landing/BookingWidget.tsx` — Inline date/guest picker + "Check availability" button. AS-IS: opens `openModal("booking")`. Target: `router.push("/{lang}/book?checkin=...&checkout=...&pax=N")`.
- `apps/brikette/src/components/rooms/RoomCard.tsx` — Two action buttons per room: "Reserve Now -- Non-refundable" and "Reserve Now -- Flexible". AS-IS: opens `openModal("booking2")`. Target: direct `<a href={octorateUrl}>` (Track E-35).
- `apps/brikette/src/app/[lang]/experiences/ExperiencesCtaSection.tsx` — Multi-button CTA: AS-IS: Book (modal), Events (bar-menu), Breakfast (breakfast-menu), Concierge (contact modal). Target: Book button → `router.push("/{lang}/book")`.
- `packages/ui/src/organisms/DesktopHeader.tsx` — Persistent "Check availability" CTA in header. AS-IS: `href` to `/book`, `onClick` intercepts to `openModal("booking")`. Target: remove modal intercept; make it a plain `<Link href="/{lang}/book">`.
- `packages/ui/src/organisms/MobileNav.tsx` — Mobile "Reserve" link. AS-IS: same modal-open pattern. Target: plain navigation link.

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

### Modal Removal Blast Radius

#### Files to delete

| File | Reason |
|---|---|
| `apps/brikette/src/context/modal/global-modals/BookingModal.tsx` | BookingGlobalModal container — removes V1 booking modal |
| `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx` | Booking2GlobalModal container — removes V2 booking modal |
| `packages/ui/src/organisms/modals/BookingModal.tsx` | UI primitive for V1 — verify no other consumers before deleting |
| `packages/ui/src/organisms/modals/BookingModal2.tsx` | UI primitive for V2 — verify no other consumers before deleting |

#### Files to modify

**`apps/brikette/src/context/modal/lazy-modals.ts`**
- Remove `BookingModal` and `BookingModal2` lazy imports + type imports `UIBookingModalProps`, `UIBookingModal2Props`

**`apps/brikette/src/context/modal/global-modals.tsx`**
- Remove `import { Booking2GlobalModal }` and `import { BookingGlobalModal }`
- Remove switcher branches: `{activeModal === "booking" && <BookingGlobalModal />}` and `{activeModal === "booking2" && <Booking2GlobalModal />}`

**`apps/brikette/src/context/modal/payloadMap.ts`**
- Remove `BookingPayload` interface, `Booking2Payload` interface, `parseBooking2Payload()`, `parseBookingPayload()`
- Remove `booking` and `booking2` keys from `ModalPayloadMap`

**`packages/ui/src/context/modal/context.ts`**
- Remove `"booking"` and `"booking2"` from `ModalType` union

#### Call sites to migrate (9 × `openModal("booking")`, 2 × `openModal("booking2")`)

**⚠️ URL path strategy note:** The "New" column below uses `/{lang}/book` (canonical App Router path) as the provisional approach per Decision A. If Track E Task 0 (route truth verification) confirms that `router.push(\`/${lang}/${getSlug("book", lang)}\`)` works correctly on static export, update these to use `getSlug`. Do not apply the `getSlug` variant until verification completes.

| File | Line(s) | Current | New (provisional — pending Decision A verification) |
|---|---|---|---|
| `apps/brikette/src/app/[lang]/HomeContent.tsx` | 44 | `openModal("booking")` (hero CTA) | `router.push(\`/${lang}/book\`)` |
| `apps/brikette/src/app/[lang]/HomeContent.tsx` | 50 | `openModal("booking", { room, rateType })` (carousel) | `router.push(\`/${lang}/book\`)` — room context dropped (see planning decision below) |
| `apps/brikette/src/components/landing/BookingWidget.tsx` | 186 | `openModal("booking", { checkIn, checkOut, adults })` | `router.push(\`/${lang}/book?checkin=X&checkout=Y&pax=N\`)` |
| `apps/brikette/src/components/cta/ContentStickyCta.tsx` | 134 | `openModal("booking", { source: "sticky_cta" })` | `<Link href={\`/${lang}/book\`}>` (replace entire handler with `<Link>`) |
| `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx` | 123 | `openModal("booking")` | `router.push(\`/${lang}/book\`)` |
| `apps/brikette/src/components/not-found/NotFoundView.tsx` | 112 | `openModal("booking")` | `<Link href={\`/${lang}/book\`}>` |
| `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` | 297 | `openModal("booking", { deal: dealId })` | `router.push(\`/${lang}/book?deal=${dealId}\`)` (book page reads deal param — see Decision D) |
| `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` | 300 | `openModal("booking")` (fallback) | `router.push(\`/${lang}/book\`)` |
| `apps/brikette/src/context/modal/global-modals/OffersModal.tsx` | 55 | `closeModal(); openModal("booking")` | `closeModal(); router.push(\`/${lang}/book\`)` |
| `apps/brikette/src/components/rooms/RoomCard.tsx` | 184, 198 | `openModal("booking2", { checkIn, checkOut, adults, rateType, room, roomSku, plan, octorateRateCode, source })` | Direct `<a href={octorateUrl}>` built from existing `checkIn`, `checkOut`, `adults`, `room.rateCodes.direct.nr/flex`, `BOOKING_CODE`. Fires `begin_checkout` (with `items[]`) + `select_item` before navigation. |

#### Planning decisions unlocked by modal removal

**RoomCard on homepage carousel** (HomeContent.tsx:50 — currently `openModal("booking", { room, rateType })`)
- Current payload actually unused by V1 consumer (noted in `payloadMap.ts` comment)
- Clean break options:
  - A: Navigate to `/{lang}/book` (user picks dates on book page) — recommended; consistent CTA destination
  - B: Navigate to `/{lang}/rooms/[id]` (room detail) — user gets room-specific context, then StickyBookNow to Octorate
- Default assumption: **Option A**. Carousel is browsing context; user hasn't entered dates yet.

**Deals CTA deal context** (DealsPageContent.tsx:297 — `openModal("booking", { deal: dealId })`)
- Clean break options:
  - A: Navigate to `/{lang}/book?deal=dealId` — book page must be updated to read `?deal=` param and inject into Octorate URLs built by RoomCard. Keeps persuasive book page in funnel. Adds scope to `/book` page.
  - B: Navigate directly to Octorate with deal params — skips book page entirely for deal traffic; loses funnel visibility.
- Default assumption: **Option A** (book page reads `?deal=` param; RoomCard Octorate URL builder uses it if present). This keeps the `/{lang}/book` page as the universal booking destination.

**`useModal` in components with only booking triggers**
- After removing booking/booking2 from ModalType, components that exclusively used `openModal("booking")` or `openModal("booking2")` can drop the `useModal()` hook entirely (e.g., `BookingWidget`, `ContentStickyCta`, `HomeContent` booking handler, `NotFoundView`).
- Components that also use other modal types (Experiences → `contact`, Deals → `offers`) keep the hook for those.

#### Tests to delete (extinct after modal removal)

| File | Reason |
|---|---|
| `apps/brikette/src/test/components/ga4-09-booking-modal-begin-checkout.test.tsx` | Tests BookingModal begin_checkout — modal deleted |
| `apps/brikette/src/test/components/ga4-10-booking2-modal-begin-checkout.test.tsx` | Tests Booking2Modal begin_checkout — modal deleted |
| `apps/brikette/src/test/context/modal-provider-effects.test.tsx` | Tests `openModal("booking")` effect in provider — remove or update to use a non-booking modal type |

#### Tests to update (not delete)

| File | What changes |
|---|---|
| `apps/brikette/src/test/components/modal-integration-tc09.test.tsx` | BookingWidget submit now calls `router.push()` not `openModal()` — rewrite assertion |
| `apps/brikette/src/test/components/content-sticky-cta.test.tsx` | ContentStickyCta no longer calls `openModal` — assert navigation instead |
| `apps/brikette/src/test/components/deals-page.test.tsx` | Deals CTA navigates to `/book?deal=...` not `openModal("booking")` |
| `apps/brikette/src/test/components/experiences-page.test.tsx` | ExperiencesPageContent booking CTA calls `router.push` not `openModal("booking")` |
| `apps/brikette/src/test/components/ga4-11-select-item-room-ctas.test.tsx` | RoomCard CTAs now navigate to Octorate — update assertion from `openModal("booking2", ...)` to Octorate URL navigation |
| `apps/brikette/src/test/components/ga4-modal-lifecycle.test.tsx` | Lifecycle test uses `openModal("booking")` — update to a retained modal type |
| `apps/brikette/src/test/components/ga4-cta-click-header-hero-widget.test.tsx` | CTA click tests — update modal expectations to navigation |

### Data & Contracts

- Types/schemas:
  - `ModalType` union — modal discriminator (`packages/ui/src/context/modal/context.ts`). **Track E deletes** the `"booking"` and `"booking2"` members; retained: `"offers" | "location" | "contact" | "facilities" | "language" | null`
  - **To be deleted in Track E:** `BookingModalCopy`, `BookingModal2Copy` (modal i18n copy shapes, `packages/ui/src/organisms/modals/types.ts`); `BookingModalBuildParams`, `BookingModalHrefBuilder` (URL construction interfaces); `BookingPayload`, `Booking2Payload`, `ModalPayloadMap["booking"]`, `ModalPayloadMap["booking2"]` (`apps/brikette/src/context/modal/payloadMap.ts`)
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

#### Flow 0 (NEW — Target State): Home -> /book -> Octorate (direct)

```
1. User lands on /{lang}/ (home page)
2. Sees hero with "Check availability" CTA
3. Clicks CTA
   -> GA4: fireCTAClick({ cta_id: "hero_check_availability", cta_location: "home_hero" })
   -> router.push("/{lang}/book") — standard page navigation
4. Browser navigates to /{lang}/book
   -> GA4: page_view (automatic)
   -> GA4: fireViewItemList({ item_list_id: "book_rooms", items: [...all rooms] })
5. User sees: "Book Direct at Hostel Brikette, Positano" (new H1) + DirectBookingPerks + room cards
6. User enters dates (date picker at top — already present in BookPageContent)
   -> URL updates via writeCanonicalBookingQuery: /{lang}/book?checkin=X&checkout=Y&pax=N
7. User clicks "Reserve Now — Non-Refundable" on a room card
   -> GA4: fireSelectItem({ item_list_id: "book_rooms", items: [{ item_id: room.sku, item_variant: "nr" }] })
   -> GA4: fireBeginCheckout({ items: [{ item_id: room.sku, item_variant: "nr", price: room.basePrice }], currency: "EUR" })
   -> Direct <a href="https://book.octorate.com/...?checkin=X&checkout=Y&codice=45111&pax=N&<rate_params>">
8. Browser navigates to Octorate (same tab)
```

**GA4 events fired:** cta_click, page_view, view_item_list, select_item, begin_checkout (with items[] + currency)
**vs. old Flow 1:** Gains: page_view(/book), view_item_list, proper begin_checkout with items[]. Loses: nothing meaningful (modal_open/close are removed from scope).

#### Flow 1 (Historical — Booking Modal v1, being removed)

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

| Funnel Stage | GA4 Event | Status | Where Missing / Notes |
|---|---|---|---|
| Page view | `page_view` | AUTO (gtag config) | Covered by default GA4 |
| Item list view | `view_item_list` | **MISSING** | Rooms listing, book page room list, home carousel, deals listing (deals: use `view_promotion` instead — see Deals Tracking below) |
| Item view | `view_item` | **MISSING** | Room detail, apartment detail, apartment sub-pages |
| Date availability search | `search_availability` (custom) | **MISSING** | User submits dates on `/book` date picker ("Update" button click or initial URL param load with valid dates) |
| Promotion view | `view_promotion` (standard) | **MISSING** | Deals listing page when deal cards are rendered |
| Item selection | `select_item` | **MISSING** | Room card NR/Flex click on `/book` page and rooms listing. Home carousel cards (if going to /book, not directly to room). |
| Promotion selection | `select_promotion` (standard) | **MISSING** | Deal card "Book Direct" click on deals page |
| CTA click | `cta_click` (custom) | **PARTIAL** | Only apartment pages have `click_check_availability`. Missing from: header CTA, hero CTA, book page CTAs, guide pages, menu pages, about page, StickyBookNow |
| Modal open/close | removed from scope | N/A (booking modals deleted) | Non-booking modal tracking (location, contact) is out of scope for this plan |
| Begin checkout | `begin_checkout` | **PARTIAL** | Exists but: (a) generic variant lacks value/currency, (b) StickyBookNow has no event. Post-amendment: all `begin_checkout` events must include `items[]` (room always known at click time) |
| Purchase | `purchase` | **BLOCKED** | Octorate one-directional redirect, no callback. GA4-09 deferred. |


### GA4 Semantics Decision (Resolved — Model A Only)

**Decision:** Model A (clean funnel) is the only model post-amendment. Booking modals are removed, so there is no availability-only modal path to segment. Every Octorate navigation from a room card has `items[]` populated (room.sku + plan known at click time).

**Locked semantics:**
- `search_availability` (custom) fires when user applies dates on `/book` (date picker "Update" click, or on initial page load when `?checkin` + `?checkout` params are present and valid). Required params: `nights` (derived), `lead_time_days` (derived), `pax`. Never include raw date strings — too high-cardinality.
- `select_item` fires when user clicks a room card NR or Flex CTA (with `item_variant: "nr" | "flex"`).
- `begin_checkout` fires immediately before Octorate navigation. Always includes `items[]` (room card click has room context). `value` included only when reliable total can be computed (apartment can; hostel may omit `value` and add later).
- **Availability-only paths are now the dates entry step**, not an Octorate exit step. Header CTA and hero CTA fire `cta_click` → navigate to `/book` → `page_view`. There is no more availability-only Octorate exit (the booking widget no longer fires a modal).

**Note:** There is still a meaningful "date search" step between CTA click and room selection. `search_availability` captures this dropoff segment ("arrived at /book but never searched dates") which is analytically distinct from "searched dates but didn't select a room."

High-cardinality param warning (dates)
- Prefer derived, low-cardinality params: `nights`, `lead_time_days`, `pax`. For rate plan, use GA4 convention: set `items[].item_variant` (enum: `flex` | `nr`) instead of a separate event-level param.
- If raw `checkin`/`checkout` are kept, treat them as diagnostic-only and do not register them as custom dimensions.

### Outbound Event Reliability Policy

Events that fire immediately before leaving the domain (same-tab redirects, `window.location.assign`) have real risk of event loss.

**Mandatory helper — lock this pattern, do not implement ad-hoc per callsite:**

```ts
// apps/brikette/src/utils/trackThenNavigate.ts
export function trackThenNavigate(
  eventName: string,
  params: Record<string, unknown>,
  navigate: () => void,
  timeoutMs = 200,
): void {
  const gtag = getGtag();
  if (!gtag) { navigate(); return; }
  // `go` must be defined before being referenced in event_callback.
  let navigated = false;
  const go = () => { if (navigated) return; navigated = true; navigate(); };
  gtag("event", eventName, {
    ...params,
    transport_type: "beacon",
    event_callback: go,
  });
  window.setTimeout(go, timeoutMs);
}
```

**Note on the API:** The caller passes `eventName` and `params` (the full GA4 event payload, minus transport/callback); the helper owns the `event_callback: go` wiring internally. Do NOT pass a `fireEvent: () => void` closure — that pattern makes `go` inaccessible to the caller, breaking the beacon reliability guarantee.

- All `begin_checkout` and `select_item` events that immediately precede an Octorate navigation **must** use this helper.
- `transport_type: "beacon"` must be set in the gtag event call.
- 200ms timeout is the minimum; do not use 0ms (no effect) or >500ms (bad UX).
- This applies to: RoomCard direct Octorate link onClick, StickyBookNow onClick, apartment checkout button.
- CTA clicks that navigate within the app (to `/book`) do not need this — Next.js router handles those correctly.

### Event Contract (Planning Input)

The plan should lock an explicit event contract before implementation to prevent parameter drift (free-form `source`/`location`/`context` strings) and to make tests deterministic.

| Event | Trigger | Dedupe rule | Required params | Optional params |
|---|---|---|---|---|
| `view_item_list` | Rooms list rendered (rooms index, book page, home carousel) | once per route render per `item_list_id` | `item_list_id` (enum), `item_list_name`, `items[]` (each: `item_id`, `item_name`, `item_category`, `index`) | `price` (only if shown), `currency` |
| `view_promotion` | Deals listing rendered with deal cards | once per route render | `items[]` (promotions: `promotion_id`, `promotion_name`, `creative_name`) | none |
| `view_item` | Room detail page view, apartment page view | once per route render per `item_id` | `items[]` (single: `item_id`, `item_name`, `item_category`) | `item_variant`, `price` (only if shown), `currency` |
| `search_availability` (custom) | User applies dates on `/book` (date picker submit or initial URL params valid) | once per query change on `/book` | `nights` (derived int), `lead_time_days` (derived int), `pax` (int) | none — no raw date strings |
| `select_item` | User clicks room card NR/Flex CTA on `/book` or rooms listing | per click | `item_list_id`, `item_list_name`, `items[]` (selected: `item_id`, `item_name`, `item_category`, `item_variant` enum `flex`\|`nr`, `index`) | `price` (only if shown), `currency` |
| `select_promotion` | User clicks "Book Direct" on a deal card | per click | `items[]` (promotion: `promotion_id`, `promotion_name`) | none |
| `begin_checkout` | Outbound to Octorate (room card or StickyBookNow) | per outbound click | `items[]` (always: `item_id`, `item_name`, `item_variant` `flex`\|`nr`) | `value` (only when reliable total), `currency` (when `value` present) |
| `cta_click` (custom) | Header/hero/content-page CTA click → navigates to `/book` | per click | `cta_id` (enum), `cta_location` (enum) | `item_list_id` (if applicable) |


### Analytics Enums (Authoritative)

All enum values are lowercase `snake_case`. Do not introduce new values ad-hoc during implementation; update this list first.

- `item_list_id`:
  - `home_rooms_carousel`
  - `rooms_index`
  - `book_rooms`
  - `room_detail` (**new** — for `select_item` / `view_item` on room detail page, e.g. StickyBookNow or RoomCard context)
  - ~~`deals_index`~~ — **removed**: deals use `view_promotion` / `select_promotion`, not `view_item_list` / `select_item` (see Deals Tracking section)
- `cta_id`:
  - `header_check_availability`
  - `mobile_nav_check_availability`
  - `hero_check_availability`
  - `booking_widget_check_availability`
  - `room_card_reserve_nr`
  - `room_card_reserve_flex`
  - `sticky_book_now`
  - `deals_book_direct` (**see note: this fires `select_promotion`, not `cta_click`**)
  - `content_sticky_check_availability`
  - `offers_modal_reserve` (**new** — OffersModal CTA that navigates to /book)
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
  - `offers_modal` (**new**)
- `modal_type` (retained modals only — booking/booking2 removed):
  - `offers`, `location`, `contact`, `facilities`, `language`
  - ~~`booking`~~ — **deleted** (booking modal removed)
  - ~~`booking2`~~ — **deleted** (booking modal removed)
- `promotion_id` (**new** — for deals/view_promotion/select_promotion):
  - values are deal IDs from `DealsPageContent.tsx` (dynamic; use the `dealId` string from deals data, not an enum)
- `source` (if retained on events; prefer this over free-form `context`):
  - `header`, `mobile_nav`, `hero`, `booking_widget`, `room_card`, `sticky_cta`, `deals`, `offers_modal`, `unknown`

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
  - `reportWebVitals.ts` — **absorbed from TASK-04** in `brik-ga4-baseline-lock/plan.md` (76% confidence; needs: select preferred test seam — mock `navigator.sendBeacon` or mock `web-vitals` callbacks — and file location with concrete example test case outline). Track D-39.
  - `PlanChoiceAnalytics.tsx` — uses inconsistent `dataLayer.push` pattern, no test
  - `StickyBookNow.tsx` — no GA4 event exists, therefore no test
  - No tests for `view_item`, `select_item`, `search_availability`, `view_promotion`, `select_promotion` (don't exist yet)
  - No tests for book page structured data (doesn't exist yet)
  - No tests for `trackThenNavigate` helper (doesn't exist yet — Track C-13)
  - No tests for Octorate URL builder as standalone unit (embedded in modal, will be extracted in Track E-30 before modal removal)
- **Extinct tests (delete after Track E):** `ga4-09-booking-modal-begin-checkout.test.tsx`, `ga4-10-booking2-modal-begin-checkout.test.tsx`, parts of `modal-provider-effects.test.tsx` that use `"booking"` type (update to use `"location"` or another retained type)
- **Testability:** HIGH — existing pattern is well-established, easy to replicate for new events

#### Recommended Test Approach
- Unit tests for: each new GA4 event helper function (`search_availability`, `view_promotion`, `select_promotion`, `select_item` with `trackThenNavigate`, `begin_checkout` from room card, `cta_click`)
- Unit tests for: `trackThenNavigate` helper (mock gtag, mock navigate, assert order and timeout fallback)
- Unit tests for: Octorate URL builder extracted from Booking2Modal (assert exact URL for NR + Flex for 2 rooms)
- Unit tests for: `getBookPath(lang)` if extracted as a helper; spot-check for 3 locales
- Integration tests for: component-level tests verifying events fire on user interaction (following existing `ga4-NN-*.test.tsx` pattern)
- Integration tests for: RoomCard disabled state when `hasValidQuery: false`; enabled + fires events when `hasValidQuery: true`
- Snapshot/render tests for: book page structured data JSON-LD output
- **Playwright smoke test (new — makes verification repeatable):** After staging deploy, run a Playwright test that:
  1. Navigates to `/en/book?checkin=YYYY-MM-DD&checkout=YYYY-MM-DD&pax=2`
  2. Intercepts `https://www.google-analytics.com/g/collect` requests
  3. Clicks the first room card NR CTA
  4. Asserts the collect request contains `en=select_item` and `en=begin_checkout` with the correct `item_id`
  5. Asserts navigation URL starts with `book.octorate.com`
  This makes the verification protocol repeatable by CI on every staging deploy, not just manual once.

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

### GA4 Access Note

No GA4 MCP tool is available in this repo. `packages/mcp-server/src/tools/analytics.ts` provides CMS shop platform analytics only (page views, orders for e-commerce shops — not Brikette GA4). GA4 data must be verified manually via:

1. **GA4 DebugView** (direct login to GA4 → Admin → DebugView). The Brikette stack is gtag-based (not GTM), so `?gtm_debug=x` does **not** work — that parameter is GTM-specific. To activate DebugView for a gtag-based site, use either:
   - **Google Analytics Debugger** browser extension (Chrome) — most convenient for manual spot-checks; routes events to DebugView automatically
   - Set `debug_mode: true` in the gtag config call (`gtag("config", GA_MEASUREMENT_ID, { debug_mode: true })`) — appropriate for a short-lived staging-only build; revert before production deploy
2. **GA4 Realtime report** — immediate event arrival (but no `items[]`/`value` payload inspection)
3. **Network tab probe** — filter for `google-analytics.com/g/collect` to inspect full event payloads including `items[]` and `value` (use browser DevTools → Network → filter by `collect`)

For the verification protocol (Track C Task 0 + Track D-43), the staging GA4 stream should be set up first to isolate test events from production data.

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

- Q: Should we create a separate GA4 property for staging, or use a separate data stream within the same property?
  - Why it matters: Determines whether staging events pollute production reports. Separate property is cleanest but requires a new GA4 measurement ID.
  - Decision impacted: GitHub Actions env var configuration, staging verification protocol.
  - Decision owner: Pete
  - Default assumption: Separate data stream within same property (simpler; can use GA4 data stream filter). Risk: some report bleed if filter not configured correctly.

- Q: RoomCard on homepage carousel — navigate to `/book` (Option A) or room detail page (Option B)?
  - Why it matters: The carousel is a browsing context; users haven't entered dates. Option A sends them to the book page where they can enter dates. Option B sends them to a specific room's detail page where they can use StickyBookNow. Both are valid.
  - Decision impacted: HomeContent.tsx migration, carousel UX.
  - Decision owner: Pete
  - Default assumption: **Option A** (navigate to `/book` — consistent CTA destination, user enters dates there).

- Q: Deals CTA — pass deal context to `/book?deal=ID` (Option A) or navigate direct to Octorate (Option B)?
  - Why it matters: Option A keeps the persuasive `/book` page in the funnel for deal traffic and gives GA4 a page_view + view_item_list. Requires adding `?deal=` URL param handling to `/book` so RoomCard Octorate URLs inject deal params. Option B is simpler but loses funnel visibility.
  - Decision impacted: `/book` page deal param handling, RoomCard Octorate URL builder, GA4 funnel for deal traffic.
  - Decision owner: Pete
  - Default assumption: **Option A** (navigate to `/book?deal=dealId`; book page propagates deal param into room card Octorate URLs).

### Resolved (Updated 2026-02-18)

- Q: Which GA4 semantics model? (Model A vs Model B)
  - A: **Resolved by clean-break decision.** With booking modals removed, there is no availability-only modal flow to segment. Model A (clean funnel) is the only model: `cta_click` → `page_view(/book)` → `view_item_list` → `select_item` → `begin_checkout` (with `items[]` always present since room is selected before Octorate navigation).

- Q: Sticky CTA rollout: which variant applies on which page types?
  - A: **Resolved.** `ContentStickyCta` on content pages becomes a `<Link href="/{lang}/book">` (no modal). `StickyBookNow` on room detail pages keeps its direct Octorate link (unchanged). The "variant A opens BookingModal" option is moot since the modal is removed.

- Q: Priority ordering: book page conversion content first or GA4 instrumentation first?
  - A: **Modal removal is now a prerequisite for both.** Sequencing: Track E (modal removal) → Track A (book page conversion content) + Track C (GA4 events) in parallel. Modal removal establishes the new routing baseline on which both tracks build.

## Confidence Inputs (for /lp-plan)

- **Implementation:** 85%
  - Strong existing patterns for CTAs (StickyBookNow, ExperiencesCtaSection, DirectBookingPerks), GA4 events (ga4-events.ts, test conventions), and structured data (existing JSON-LD components). Modal removal blast radius is fully mapped (11 call sites, 2 UI components, ~8 test files). Book page enhancement is primarily composition of existing components. RoomCard already has all the data needed (roomSku, octorateRateCode, checkIn/checkOut/adults) to build a direct Octorate link.
  - What would raise to 90%+: Confirm the exact Octorate URL format used by Booking2Modal for room-specific rate selection (verify `ratePlan` or equivalent param). Confirm `DirectBookingPerks` renders correctly outside of the rooms page context (it uses `dealsPage` i18n namespace, not `bookPage`). Resolve ?deal= param on /book page.

- **Approach:** 85% (raised from 82%)
  - Clean break eliminates the hybrid modal/page split that was the central architectural problem. The new funnel (CTA → /book → Octorate) is coherent, measurable, and fully GA4-trackable. StickyBookNow (unchanged) proves the direct-link pattern works at room detail level. Apartment flow proves the page-navigation-then-Octorate pattern works.
  - What would raise to 90%+: Confirm staging GA4 data stream isolation approach. Verify no ModalType consumers in other packages depend on "booking"/"booking2".

- **Impact:** 88% (raised from 85%)
  - Blast radius is now fully mapped. Modal removal is surgical — 11 call sites, 2 UI primitives, clear test deletion/update list. Book page changes are additive. CTA additions to content pages are additive. GA4 changes are now cleaner: no semantics model ambiguity, no begin_checkout-from-modal to replace.
  - What would raise to 90%+: Confirm no LCP regression from book page conversion content additions.

- **Delivery-Readiness:** 82% (raised from 80%)
  - Track E (modal removal) is a well-defined prerequisite. Execution path: Track E → Track A + Track C in parallel → Track D verification. Well-established CI pipeline.
  - What would raise to 90%+: Set up staging GA4 data stream before starting work. Resolve open planning decisions (deals Option A/B, carousel CTA Option A/B).

- **Testability:** 90%
  - Existing test patterns are excellent. 9 GA4 test files with consistent patterns. JSON-LD structured data is testable via snapshot tests. New events follow the same `window.gtag` mock + assert call args pattern. Test deletion/update list is fully specified.
  - Minor gap: `reportWebVitals.ts` test coverage (absorbed from TASK-04; now Track D-39).

## Risks

| Risk | Likelihood | Impact | Mitigation / Open Question |
|------|-----------|--------|---------------------------|
| Staging GA4 events pollute production data | High (if not addressed) | Medium | Set up separate staging data stream with environment-scoped measurement ID. Open question for Pete. |
| Book page conversion content increases page weight and hurts LCP | Low | Medium | All proposed components already exist and are lightweight (text + icons). Monitor LCP via Web Vitals. |
| StickyBookNow overlaps/conflicts with guide-specific UI elements | Low | Medium | Spike: render on one guide page in dev. Check for z-index/position conflicts with guide TOC or image lightbox. |
| Report-layer freshness delay means verification takes 24-48h per event | Medium | Low | Use GA4 Realtime report for immediate verification. Collect-endpoint probe as secondary confirmation. |
| Adding CTAs to content pages feels intrusive/spammy | Medium | Medium | Use the StickyBookNow pattern (session-dismissible) so users who dismiss aren't pestered. Consider a lighter variant for informational pages. |
| `begin_checkout` semantics drift (availability-only vs room-selected) makes funnel analysis incoherent | Resolved by clean-break decision | N/A | Model A is the only model post-amendment. Booking modals removed; all `begin_checkout` events have room context (items[] always present). No further action needed. |
| Book page structured data (lodging schema) has incorrect or incomplete properties | Low | Low | Validate JSON-LD with Schema Markup Validator; use Rich Results Test only for supported eligibility checks. Add snapshot tests to prevent regression. |
| i18n: new `bookPage.json` keys need translation for 18 locales | Medium | Low | Start with EN only; other locales fall back to EN via i18next. Translate in a follow-up pass. |
| PlanChoiceAnalytics uses inconsistent dataLayer.push pattern | Already happening | Low | Migrate to gtag wrapper pattern as part of this work. |

## Architectural Decisions (Lock Before Planning)

### Decision A: Localized Book URL Path Strategy

**Confirmed truths (not in conflict):**
1. App Router canonical route: `[lang]/book` — the only route the Next.js router knows about.
2. Localized slugs (`/it/prenota`, `/de/buchen`, etc.) exist in `slug-map.ts` and are served as aliases via:
   - **Production (Worker):** middleware rewrites them to `/{lang}/book` at request time
   - **Staging/static export:** `public/_redirects` 200-rewrites handle inbound requests only — middleware does NOT run
3. Client-side Next.js router (SPA navigation via `router.push` or `<Link>`) resolves paths against App Router routes, NOT middleware rewrites. On static export, `router.push("/it/prenota")` will 404 because no App Router route matches that segment.

**RESOLVED (TASK-22, 2026-02-18) — Outcome B confirmed.** Static analysis conclusively establishes Outcome B without requiring a staging test:

- `apps/brikette/src/app/[lang]/book/page.tsx` → `generateStaticParams()` calls `generateLangParams()` which produces `{ lang: "it" }`, `{ lang: "de" }` etc. Static files are generated at `/{lang}/book/index.html` only. No route exists for `[lang]/prenota` in the App Router file system.
- `public/_redirects` contains Cloudflare Pages 200-rewrites (e.g. `/it/prenota → /it/book  200`). These run at the Cloudflare edge for inbound HTTP requests. They do **not** intercept in-SPA `router.push` or `<Link>` navigation — the running JavaScript SPA uses Next.js's client router which resolves against App Router routes only.
- `getSlug("book", "it")` returns `"prenota"` (slug-map.ts). This is the correct value for SEO-facing URLs. It is **not** a valid App Router path segment.
- Staging manual Test B (in-app nav test) is no longer required to determine URL strategy — the mechanism is unambiguous.

**Confirmed rule:** Use `/{lang}/book` (canonical App Router path) for all `router.push()` and `<Link href>` in-app navigation. Use `getSlug("book", lang)` **only** for SEO-facing display URLs (canonical `<link>` tag, sitemap.xml, external share links, and `generateMetadata` path construction as already done in `book/page.tsx`).

```ts
// CONFIRMED CORRECT — canonical path for in-app navigation
const bookPath = `/${lang}/book`;
// getSlug("book", "it") → "prenota" — use ONLY for canonical/sitemap, NOT router.push
```

**Effect on call site table:** All `router.push` and `<Link href>` values in the blast radius table use `/${lang}/book`. No changes to the blast radius table needed — the provisional rule was already correct. Staging Test B is now optional (useful to confirm 200-rewrite for inbound traffic, not needed to determine in-app strategy).

### Decision B: Reserve Now with No Dates

The modal previously enforced dates before Octorate navigation. After modal removal, the room card CTAs on `/book` need a defined behavior when `checkIn`/`checkOut`/`pax` are missing or invalid.

**Resolved:** Disable room card reserve CTAs until valid dates are present.

**Implementation spec:**
- `BookPageContent.tsx` maintains `bookingQuery` state (check-in, check-out, pax). Pass a `hasValidQuery: boolean` prop to `RoomsSection`/`RoomCard`.
- When `hasValidQuery` is false: render the "Reserve Now" button as visually disabled (`aria-disabled`, not `disabled` — to allow tooltip/tooltip-equivalent hint).
- When `hasValidQuery` is false: the button's `onClick` scrolls to the date picker with a brief shake/highlight animation and an accessible message like "Please select dates to continue."
- When `hasValidQuery` is true: button is active and fires `select_item` → `begin_checkout` → Octorate navigation.
- The `checkIn`/`checkOut`/`pax` are already in URL params (`writeCanonicalBookingQuery`), so the page state is always serializable.
- **Do not** navigate to Octorate with default/garbage dates — that creates untrackable junk events and bad UX.

**Acceptance criterion:** A user arriving at `/book` with no URL params sees room cards with disabled CTAs and a prompt to select dates. After selecting dates, CTAs activate.

### Decision C: Analytics Placement (packages/ui vs app layer)

Several components that need GA4 events are in `packages/ui` (`DesktopHeader`, `MobileNav`, `RoomsSection`, `StickyBookNow`, `CarouselSlides`). The GA4 helpers live in `apps/brikette/src/utils/`.

**Resolved:** Keep UI components dumb — do not import GA4 utilities into `packages/ui`.

**Pattern:** UI components that trigger analytics emit events via optional callback props provided from the app layer:
- `onPrimaryCtaClick?: (ctaId: string, ctaLocation: string) => void`
- `onRoomCardClick?: (room: Room, plan: "nr" | "flex") => void`
- etc.

The brikette app layer (`apps/brikette`) wires these callbacks to `fireCTAClick`, `fireSelectItem`, etc. This is already the pattern used by `HomeContent.tsx` (`onPrimaryCtaClick={handleReserve}`) — extend it consistently.

**Do not** create a "GA4 context bridge" in `packages/ui` — that over-engineers the boundary. Callback props are sufficient and already in use.

### Decision E: RoomCard Behavior on `/rooms` Listing Page

The `/rooms` listing page shows RoomCards but is not managed by `BookPageContent` — there is no `bookingQuery` state, no dates picker on the page, and no `hasValidQuery` prop to gate reserve buttons.

**Context:** Decision B governs the dates-gate only for `/book`. On `/rooms`, the same `RoomCard` component renders "Reserve Now" buttons, but the page has no dates input for users to fill. If modal removal makes RoomCard render direct Octorate `<a>` links, these links need valid dates or users land on Octorate with no dates context.

**Options:**
- **Option A (Recommended):** RoomCard reserve CTAs on `/rooms` navigate to `/{lang}/book` (not Octorate). User picks dates on book page, then selects the same or any room. Clean; consistent with the "book page is the universal booking entry point" goal. RoomCard on `/rooms` acts as a "go to book page with this room context" CTA, not a direct checkout.
- **Option B:** Show the same disabled-until-dates behavior as Decision B, but there's no date picker on `/rooms` to fill — this would result in CTAs that are permanently disabled on `/rooms` (bad UX).
- **Option C:** Open a lightweight date picker inline (new UI surface) — scope creep; creates two date-picker UI patterns.

**Resolved: Option A.** RoomCard reserve CTAs on the `/rooms` listing page navigate to `/{lang}/book` (same behavior as the main hero CTA). This is the simplest outcome and consistent with "all booking-intent CTAs route to `/book` as the universal entry point, except from `/book` itself."

**Implementation:** The `RoomCard` component needs to know whether it is rendering in a "has dates context" (from `/book` page, has `hasValidQuery`) or a "no dates context" (`/rooms` page) mode. Cleanest approach: the `hasValidQuery` prop from Decision B becomes the discriminator. When `hasValidQuery` is `undefined` (not provided by parent), the CTA navigates to `/book`. When `hasValidQuery` is a boolean, Decision B behavior applies (disabled until true). This requires no new props — just a `hasValidQuery?: boolean` type with `undefined` meaning "navigate to book page."

**Planning task:** Add this as a sub-task within Track E task 34 (RoomCard migration). The `/rooms` page container must NOT pass a `hasValidQuery` prop; the `/book` page container MUST pass it.

### Decision D: Deals Tracking (Promotions, Not Items)

Deals are not products — they are promotional offers that redirect users to the booking engine with UTM params + deal codes. Using `view_item_list` / `select_item` for deals would mix them with room inventory and corrupt the e-commerce funnel.

**Resolved:** Use standard GA4 promotions model for deals:
- `view_promotion` when deal cards are rendered on `/deals` (once per route render)
- `select_promotion` when user clicks "Book Direct" on a deal card

**After `select_promotion`:** navigate to `/${lang}/${getSlug("book", lang)}?deal=dealId`. The `/book` page reads `?deal=` param and the RoomCard Octorate URL builder injects `&deal=<id>&utm_source=site&utm_medium=deal&utm_campaign=<id>`. This keeps the book page in the funnel for GA4 pageview continuity.

**`promotion_id`** values are deal IDs from the deals data (dynamic strings). Track `promotion_name` as the deal title/label.

## Planning Constraints & Notes

- **Track E (Modal Removal) is a hard prerequisite** — Track A and Track C tasks that touch CTA components must not land before Track E completes. If Track E is split into sub-tasks, the TypeScript changes (ModalType, payloadMap) must land before call site migrations to maintain compile-time safety.

- **Staging GA4 data stream isolation is Task 0 for Track C (not optional)** — Track C GA4 instrumentation tasks cannot be verified without an isolated staging measurement ID. Create the staging data stream and set the `NEXT_PUBLIC_GA_MEASUREMENT_ID` GitHub Actions env var for the `staging-pages` environment before any Track C task begins. Without this, staging events will pollute production reports.

- **Octorate URL contract extraction is a gated prerequisite for RoomCard migration (Track E-35, blocks on Track E-30)** — Before replacing `openModal("booking2", ...)` with a direct `<a href={octorateUrl}>`, extract the exact URL builder from the existing `Booking2Modal.tsx` into a shared utility with unit tests asserting the exact URL params for NR vs Flex for at least 2 rooms. This task is now in Track E (Task 30) because it directly enables modal removal — it does not belong in Track C.

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
  - GA4 changes: mostly additive (new events + helpers). Existing `ga4-09-booking-modal-begin-checkout.test.tsx` and `ga4-10-booking2-modal-begin-checkout.test.tsx` are **deleted** in Track E-36 (extinct after modal removal). Seven other GA4/CTA tests are updated but not deleted (see blast radius table).
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
11. Add `ContentStickyCta` to GuideContent pages, about page, bar-menu, breakfast-menu — rendered as `<Link href={\`/${lang}/${getSlug("book", lang)}\`}>`. No modal. Reserve `StickyBookNow` (direct Octorate deep link) for room detail pages only.
12. Add ExperiencesCtaSection-style block to how-to-get-here index and assistance index

### Track C: GA4 Event Pipeline
**Task 0 (hard gate — must land before any other Track C task):** Set up staging GA4 data stream; set `NEXT_PUBLIC_GA_MEASUREMENT_ID` as an environment-scoped GitHub Actions variable for `staging-pages` environment (separate from production). Without this, all staging verification is unreliable.

13. Create `trackThenNavigate(eventName, params, navigate, timeoutMs = 200)` helper in `apps/brikette/src/utils/trackThenNavigate.ts`; unit tests asserting: (a) gtag call fires with `transport_type: "beacon"` and `event_callback`, (b) navigate is called after callback fires, (c) timeout fallback calls navigate if callback is delayed, (d) if gtag is absent navigate is called immediately
14. Create shared GA4 event helpers: `fireViewItemList`, `fireViewItem`, `fireSelectItem`, `fireCTAClick`, `fireSearchAvailability`, `fireViewPromotion`, `fireSelectPromotion`
16. GA4 semantics are locked as Model A (see Semantics Decision section — no further discussion needed)
17. Add `begin_checkout` event to StickyBookNow click (via `trackThenNavigate`)
18. Add `view_item_list` to rooms listing page, book page room list, and home page carousel
19. Add `view_item` to room detail page and apartment detail pages
20. Add `select_item` to room card clicks on `/book` page and rooms listing (via `trackThenNavigate`)
21. Add `search_availability` to `/book` page date picker "Update" submit and to initial load when valid dates are in URL params
22. Add `view_promotion` to deals listing page (deal cards rendered)
23. Add `select_promotion` to deal card "Book Direct" click
24. Add `fireCTAClick` to header booking CTA, hero CTA, content page CTAs, OffersModal navigate CTA
25. Migrate `PlanChoiceAnalytics` from `dataLayer.push` to gtag wrapper pattern
26. Verify all outbound-to-Octorate navigations use `trackThenNavigate` (RoomCard, StickyBookNow, apartment checkout)

### Track E: Booking Modal Removal (Prerequisite to all other tracks)

**Must land before Track A, B, C tasks that touch CTA components.**

**Task 0 (hard gate — must run before any other Track E task):** Route truth verification — confirm the correct in-app navigation strategy for the book page before any call site is migrated:
- Test A: Direct-load `https://staging.brikette-website.pages.dev/it/prenota` (external inbound) → expect 200 with correct page content (Cloudflare 200-rewrite).
- Test B: From within the SPA, call `router.push("/it/prenota")` → observe: does it resolve to the book page or 404? This confirms whether `getSlug("book", lang)` values are safe to use in `router.push` calls.
- Test C: Same as Test B using `<Link href="/it/prenota">`.
- Outcome A (slug works in-app): use `getSlug("book", lang)` everywhere. Update the blast radius call site table and Decision A to reflect this.
- Outcome B (slug fails in-app): use `/{lang}/book` for all `router.push`/`<Link href>` in-app; use `getSlug` only for sitemap/canonical links. Update Decision A accordingly.
- **Do not migrate any call sites until Test B/C outcomes are known.**

29. Verify no consumers of `BookingModal`/`BookingModal2` exist outside of brikette app (`grep -r "BookingModal" packages/ --include="*.tsx"` excluding `ui/organisms/modals` itself)
30. Extract Octorate URL builder from `Booking2Modal.tsx` into a standalone shared utility (e.g., `apps/brikette/src/utils/buildOctorateUrl.ts`); add unit tests asserting exact URL params for NR vs Flex for at least 2 rooms. **This is the highest load-bearing dependency in the entire migration — a wrong URL silently breaks room-specific bookings.** Must land before Task 34.
31. Remove `BookingModal` and `BookingModal2` from `packages/ui`:
    - Delete `packages/ui/src/organisms/modals/BookingModal.tsx`
    - Delete `packages/ui/src/organisms/modals/BookingModal2.tsx`
    - Remove their exports from `packages/ui/src/organisms/modals/index.ts`
32. Remove booking/booking2 from ModalType union in `packages/ui/src/context/modal/context.ts`
33. Remove booking/booking2 from brikette modal infrastructure:
    - `apps/brikette/src/context/modal/lazy-modals.ts` — remove BookingModal + BookingModal2 imports
    - `apps/brikette/src/context/modal/payloadMap.ts` — remove BookingPayload, Booking2Payload, parseBookingPayload, parseBooking2Payload; remove `booking` + `booking2` from ModalPayloadMap
    - `apps/brikette/src/context/modal/global-modals.tsx` — remove BookingGlobalModal + Booking2GlobalModal imports and switcher branches
    - Delete `apps/brikette/src/context/modal/global-modals/BookingModal.tsx`
    - Delete `apps/brikette/src/context/modal/global-modals/Booking2Modal.tsx`
34. Migrate all 9 `openModal("booking")` call sites to `router.push` or `<Link>` per the blast radius table (use path strategy determined by Task 0 verification)
35. Migrate 2 `openModal("booking2")` call sites in `RoomCard.tsx` to direct Octorate `<a>` links using the URL builder from Task 30. Also implement Decision B (disabled state when `hasValidQuery: false` on `/book`; Decision E: navigate-to-book behavior when `hasValidQuery` is undefined on `/rooms`). **Blocked on Task 30 (URL builder).**
36. Delete extinct tests: `ga4-09-booking-modal-begin-checkout.test.tsx`, `ga4-10-booking2-modal-begin-checkout.test.tsx`
37. Update tests: `modal-integration-tc09.test.tsx` (BookingWidget now navigates), `content-sticky-cta.test.tsx`, `deals-page.test.tsx`, `experiences-page.test.tsx`, `ga4-11-select-item-room-ctas.test.tsx`, `ga4-modal-lifecycle.test.tsx` (use retained modal type), `ga4-cta-click-header-hero-widget.test.tsx`
38. Resolve `?deal=` URL param handling on `/book` page if Option A is chosen for deals CTAs (see open question above)

### Track D: Testing & Verification
39. Add direct test coverage for `reportWebVitals.ts` (absorbed from TASK-04 in `brik-ga4-baseline-lock/plan.md` — select test seam: mock `navigator.sendBeacon` or mock `web-vitals` callbacks; file: `src/test/performance/reportWebVitals-coverage.test.ts`)
40. Write unit tests for all new GA4 events (following ga4-NN pattern); delete ga4-09, ga4-10 extinct tests
41. Write snapshot tests for book page structured data JSON-LD
42. Write Playwright smoke test: navigate to `/en/book?checkin=...&checkout=...&pax=2`, intercept `google-analytics.com/g/collect`, click first room card NR CTA, assert `select_item` + `begin_checkout` payloads, assert Octorate URL navigation
43. Deploy to staging and execute GA4 verification protocol (Google Analytics Debugger extension + Network tab for `items[]`/`value` payload QA — Realtime alone insufficient)
44. Document GA4 verification protocol as a repeatable checklist

## Execution Routing Packet

- Primary execution skill: `/lp-build`
- Supporting skills: `/lp-design-spec` (for book page layout decisions), `/lp-seo` (structured data validation, meta tag optimisation)
- Deliverable acceptance package:
  - Book page has: conversion-optimised H1/meta, DirectBookingPerks, social proof, FAQ section, location snippet, lodging + `FAQPage` + `BreadcrumbList` JSON-LD (no third-party `aggregateRating`), internal guide links
  - All 10 CTA-lacking pages have at least one booking CTA
  - GA4 e-commerce events `view_item_list`, `view_item`, `select_item` implemented
  - `begin_checkout` events always include `items[]` (room known at click time); `value`/`currency` included only when a reliable total can be computed
  - `cta_click` tracking implemented for all header/hero/content-page CTAs that navigate to `/book`
  - Booking modals (`booking`, `booking2`) fully removed — no `openModal("booking")` or `openModal("booking2")` call sites remain; TypeScript compilation clean with no references to deleted types
  - All new events verified on staging (documented proof: GA4 DebugView checks + Network payload inspection + Realtime arrival)
  - Structured data validates for schema.org correctness (Schema Markup Validator); Rich Results Test used only for supported eligibility checks
  - Unit tests for every new GA4 event + snapshot tests for structured data
  - All existing tests pass (`pnpm --filter brikette test`)
- Post-delivery measurement plan:
  - 7-day GA4 data extract showing non-zero counts for: `view_item_list`, `view_item`, `select_item`, `begin_checkout` (all flows have `items[]`; `value`/`currency` where computable), `cta_click`, `search_availability`, `view_promotion`, `select_promotion`
  - Session-to-booking CVR measurable (even if Octorate purchase tracking remains deferred)
  - Funnel visualization in GA4: `page_view` → `view_item_list` → `search_availability` → `select_item` → `begin_checkout`
  - Google Search Console: monitor `/book` page impressions/clicks for keywords "book hostel Positano", "Brikette hostel booking"
  - Structured data validation: Schema Markup Validator confirms schema.org correctness; Rich Results Test checks supported eligibility for `FAQPage` and any supported lodging outputs

## Planning Readiness

- Status: **Ready-for-planning**
- Blocking items: Three open questions with documented defaults:
  1. Deals CTA Option A/B (default: Option A — navigate to `/book?deal=ID`)
  2. Carousel CTA Option A/B (default: Option A — navigate to `/book`)
  3. **Route truth verification (Decision A Task 0):** whether `router.push("/it/prenota")` works on static export determines the URL strategy for all call site migrations. If this is not pre-verified manually before `/lp-plan`, the plan must sequence Task 0 as a hard gate before any call site migration task.
- Sequencing invariant: Track E (modal removal) must sequence before Tracks A, B, C. Within Track E: Task 0 (route truth) → Task 30 (URL builder extraction) → Tasks 34/35 (call site migrations).
- Recommended next step: Proceed to `/lp-plan`. Confirm open questions (deals, carousel, route truth) before task generation if possible — otherwise defaults apply and sequencing guards handle uncertainty.

---

## TASK-20 Decision Memo: /book JSON-LD Field List

**Date:** 2026-02-18
**Status:** Resolved — unblocks TASK-13

### 1. `@type` Strategy

**Decision: `@type: "Hostel"` (already in production)**

`Hostel` is a schema.org type that extends `LodgingBusiness` → `LocalBusiness` → `Organization`. It is more semantically precise for the property type and is already used in `buildHotelNode()` (`apps/brikette/src/utils/schema/builders.ts:62`) and `BookStructuredData.tsx` (`apps/brikette/src/components/seo/BookStructuredData.tsx:27`).

**Rationale:**
- `Hostel` is the most specific schema.org type for a property offering shared-room/hostel accommodation.
- Google does not currently offer a distinct Rich Result format for `Hostel` vs `LodgingBusiness`, so there is no eligibility tradeoff.
- The type is already used throughout the codebase — no migration needed.

**Verdict:** No change required. `@type: "Hostel"` is locked.

### 2. Minimum Field Set for /book JSON-LD

`BookStructuredData.tsx` already clones from `buildHotelNode()` and strips ineligible fields. The confirmed field set (post-strip) is:

| Field | Type | Source |
|---|---|---|
| `@context` | `"https://schema.org"` | constant |
| `@type` | `"Hostel"` | constant |
| `@id` | `${BASE_URL}/#hotel` | `HOTEL_ID` constant |
| `name` | `"Hostel Brikette"` | static |
| `description` | static description string | static |
| `url` | `BASE_URL` | env-resolved constant |
| `priceRange` | `"€55 – €300"` | static |
| `email` | `CONTACT_EMAIL` | hotel config |
| `address` | `PostalAddress` | static (street, locality, postal, country) |
| `geo` | `GeoCoordinates` | static (lat/lng) |
| `amenityFeature` | `LocationFeatureSpecification[]` | static (7 items) |
| `openingHoursSpecification` | 24/7, all days | static |
| `checkinTime` | `"15:30"` | static |
| `checkoutTime` | `"10:30"` | static |
| `sameAs` | `string[]` | static (Google Maps, Apple Maps, Instagram) |
| `hasMap` | Google Maps CID URL | static |
| `availableLanguage` | `string[]` | static (18 locales) |
| `image` | `ImageObject[]` | `IMAGE_MANIFEST` (4 images with dimensions) |
| `mainEntityOfPage` | `${BASE_URL}/${lang}/book` | derived from lang prop |
| `isPartOf` | `{ "@id": WEBSITE_ID }` | `${BASE_URL}/#website` |

**Explicitly omitted:**
- `aggregateRating` — third-party review badges (Hostelworld, Booking.com) are not eligible for schema.org structured data markup. Only first-party reviews qualify. Omitting avoids a Google Quality Reviewer flag.
- `additionalProperty` — contains `ratingsSnapshotDate` metadata, which is only meaningful alongside `aggregateRating`. Removed with it.
- `publisher` — included on the Home graph (Organization markup); not needed on the /book page node.
- `inLanguage` — not required for correctness; omitted to keep the node lean.

### 3. Absolute URL Source

**Decision: Use `BASE_URL` from `@/config/site` (no new helper needed)**

The plan spec mentioned creating a `getSiteBaseUrl()` helper backed by `NEXT_PUBLIC_SITE_URL`. Codebase inspection shows this is unnecessary:

- `BASE_URL` is exported from `@/config/site` → re-exported from `@/config/baseUrl.ts`
- `baseUrl.ts` already implements a full resolution chain: `NEXT_PUBLIC_BASE_URL` → `NEXT_PUBLIC_SITE_DOMAIN` → `NEXT_PUBLIC_PUBLIC_DOMAIN` → `NEXT_PUBLIC_DOMAIN` → platform previews (Netlify/Vercel) → fallback production domain
- The constant is resolved at module initialization — no runtime `headers()` call needed
- `headers().get("host")` is correctly ruled out: static export has no server runtime

**Single source of truth:** `import { BASE_URL } from "@/config/site"` — already in use in `BookStructuredData.tsx`, `builders.ts`, and `types.ts`.

**Enforcement pattern:**
```ts
const pageUrl = `${BASE_URL}/${lang}/book`;  // already in BookStructuredData.tsx:23
```

No additional `getSiteBaseUrl()` helper required. `BASE_URL` is the single source.

### 4. Canonical URL Policy

**Decision (aligned with TASK-22 Decision A verdict):**

- Canonical slug for the book page in all internal navigation: `/{lang}/book`
- `<link rel="canonical">` must point to `${BASE_URL}/${lang}/book` for all locales
- JSON-LD `url` field: `BASE_URL` (hostel entity URL, not page-specific)
- JSON-LD `mainEntityOfPage` field: `${BASE_URL}/${lang}/book` (page-specific, set via `pageUrl` opt)

**Note on localized slugs (Cloudflare `_redirects`):** Localized slugs (e.g., `/it/prenota`) are HTTP-level 200-rewrites at the CDN edge only. The Next.js App Router knows nothing of them — `router.push("/it/prenota")` would 404 on static export. Therefore, canonical is always `/${lang}/book`. The CDN rewrite is a vanity URL only; the canonical link tag should always use `/book`.

### 5. Snapshot Test Approach

**Pattern:** Unit test using `buildHotelNode()` + manual clone + strip (same operation as `BookStructuredData.tsx`), then assert key fields.

**Test file:** `apps/brikette/src/test/components/book-jsonld-contract.test.ts`

**Minimum assertions for TASK-13:**
```ts
const base = buildHotelNode({ pageUrl: "https://hostel-positano.com/en/book", lang: "en" });
const hostel = { ...base, "@id": HOTEL_ID, "@type": "Hostel" };
delete hostel.aggregateRating;
delete hostel.additionalProperty;

expect(hostel["@type"]).toBe("Hostel");
expect(hostel.aggregateRating).toBeUndefined();
expect(hostel.additionalProperty).toBeUndefined();
expect(hostel.mainEntityOfPage).toBe("https://hostel-positano.com/en/book");
expect(hostel["@id"]).toContain("/#hotel");
expect(typeof hostel.checkinTime).toBe("string");
expect(typeof hostel.checkoutTime).toBe("string");
expect(Array.isArray(hostel.image)).toBe(true);
```

**Render test (optional for TASK-13):** render `<BookStructuredData lang="en" />`, query for `script[type="application/ld+json"]`, parse innerHTML as JSON, assert the same fields. This validates the component end-to-end rather than just the builder.

### 6. Validation Tooling

- **Schema Markup Validator** (validator.schema.org): paste rendered JSON-LD output; confirm no errors or warnings for the `Hostel` type definition. This is the correctness gate.
- **Rich Results Test** (search.google.com/test/rich-results): use for eligibility checks only. `Hostel` does not have a dedicated Rich Result format; `FAQPage` (if added in TASK-13) does. Do not rely on Rich Results Test for `Hostel` correctness — it checks eligibility, not schema.org validity.
- **Local validation:** `pnpm --filter brikette test book-jsonld-contract` after TASK-13.

### 7. Status of `BookStructuredData.tsx`

The component is already implemented correctly. TASK-13 needs to:
1. Import and render `<BookStructuredData lang={lang} />` on the `/book` page (if not already done)
2. Add the `book-jsonld-contract.test.ts` snapshot/contract test
3. Confirm `<link rel="canonical">` is set to `${BASE_URL}/${lang}/book` in page metadata

No changes to `BookStructuredData.tsx`, `builders.ts`, or `types.ts` are required for TASK-13 to proceed.

---

**Verdict:** All TASK-20 acceptance criteria satisfied. TASK-13 is unblocked.

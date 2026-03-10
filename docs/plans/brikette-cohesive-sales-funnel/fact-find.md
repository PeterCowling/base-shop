---
Type: Fact-Find
Outcome: planning
Status: Ready-for-planning
Domain: Brikette Funnel
Workstream: Product-Engineering
Created: 2026-03-08
Last-updated: 2026-03-08
Last-reviewed: 2026-03-08
Relates-to charter: docs/business-os/business-os-charter.md
Feature-Slug: brikette-cohesive-sales-funnel
Execution-Track: mixed
Deliverable-Family: multi
Deliverable-Channel: none
Deliverable-Subtype: none
Deliverable-Type: multi-deliverable
Startup-Deliverable-Alias: none
Loop-Gap-Trigger: none
Primary-Execution-Skill: lp-do-build
Supporting-Skills: lp-design-spec, lp-seo
Related-Plan: docs/plans/brikette-cohesive-sales-funnel/plan.md
artifact: fact-find
Trigger-Source: direct-operator-decision: cohesive-brikette-sales-funnel-with-private-product-and-content-entry
Trigger-Why: define the full Brikette sales funnel as one coherent multilingual system across hostel-bed booking, apartment and double-private-room product paths, and content-entry paths, without fragmenting user intent at the Octorate boundary
Trigger-Intended-Outcome: "type: operational | statement: produce a planning-ready funnel architecture and implementation constraints that define one central hostel conversion path, deliberate supporting entry paths from the private summary and content pages, and locale continuity through all Brikette-controlled steps up to the Octorate boundary | source: operator"
---

# Brikette Cohesive Sales Funnel Fact-Find Brief

## Scope
### Summary
Brikette currently has one canonical hostel compare flow, one distinct private-product route family, and several misaligned entry surfaces that route intent inconsistently. Planning should standardise page roles, unify CTA intent resolution across all entry points, preserve booking and locale state to the Brikette/Octorate boundary, and prevent apartment-specific checkout from receiving generic private intent. The secure-booking shell is an env-gated execution mode contingent on proven iframe viability, not a guaranteed funnel step.

### Goals
- Define the canonical hostel conversion path and distinguish it from supporting browse and assist paths.
- Explicitly include the private-product route family as part of the commercial system rather than treating it as out-of-scope.
- Inventory all current funnel entry points, including guides, assistance, and other content surfaces.
- Preserve locale-specific routing and copy through every Brikette-controlled step as far down-funnel as technically possible.
- Identify which routes should compare, which should reassure, which should route, and which should finish checkout.

### Non-goals
- No implementation changes in this phase.
- No Octorate API or webhook strategy.
- No reliance on Octorate back-office reconfiguration as the primary optimization path.
- No attempt to redesign the Octorate UI itself.

### Constraints & Assumptions
- Constraints:
  - Octorate API is out of scope and must not be proposed as a dependency for this work.
  - Octorate remains the transactional engine; Brikette owns the funnel up to the embedded or same-domain handoff.
  - Locale continuity must be preserved across Brikette-owned routes and components, even if it cannot be guaranteed inside Octorate.
  - Every meaningful content surface should provide a path into a relevant destination funnel.
  - Hostel bed, apartment, and double private room intent must not be collapsed into one undifferentiated booking surface.
- Assumptions:
  - The hostel secure-booking route can only serve as the final Brikette-controlled stage when `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED=1`; if the flag is off, the planned hostel and locale-continuity journeys fall back to direct Octorate handoff and do **not** reach `/book/secure-booking`.
  - The current secure-booking implementation is a Brikette shell around a cross-origin `result.xhtml` iframe plus direct-link fallback. It is **not** yet evidenced as a production-safe widget-bootstrap integration, and iframe embeddability must be proven on the target deployment before the plan treats "iframe loads and checkout completes in-shell" as a safe assumption.
  - Apartment and double private room should remain a distinct private-product route family with their own booking logic, not be forced through the hostel-bed funnel.
  - Content pages can support funnel entry without becoming full booking pages themselves, but the current `ContentStickyCta` prop contract (`ctaLocation` only) is insufficient for private-intent or hybrid routing; a new intent-resolution contract is required.
  - Global funnel entry surfaces must follow the same routing policy as sticky content CTAs. `NotificationBanner` is currently a hostel-only CTA on non-private pages and cannot be left outside the funnel-intent design.
  - The current private-product booking page is apartment-specific (`ApartmentBookContent`) and must not be treated as a generic private checkout until the plan either splits private-product booking paths or explicitly constrains who is routed there.

## Canonical Model
The document mixes hostel/private (destination/product funnels), room-assist (a subflow inside the hostel funnel), content-entry (an origin surface, not a funnel family), and locale continuity (a cross-cutting constraint) as if they were peers. They are not. Use these orthogonal axes throughout:

**Source surfaces** — where the user arrives from:
- homepage, content page, dorms browse, room detail, private summary, sitewide shell

**Resolved intent** — what the user is trying to do:
- hostel booking, private booking, undetermined intent

**Product type** — the specific inventory class, when intent is fully resolved:
- hostel bed, apartment, double private room

**Decision mode** — how routing is determined when intent is not fully resolved or a chooser is shown:
- direct resolution, chooser, hybrid merchandising

**Destination funnel** — the product track the user enters:
- hostel-central, hostel-assist (room-assist subflow), private

**Execution mode** — how handoff to Octorate happens:
- Brikette-hosted secure-booking shell (env-gated, iframe viability unproven) -> cross-origin Octorate embed; or direct Octorate handoff (fallback or gate-off mode)

**Continuity dimensions** — state that must survive every step:
- lang, check-in, check-out, pax, product-type, room-id, rate/plan-id, source-surface, source-cta, source-intent, decision-mode, deal param, fallback-behaviour

Resolved intent is the intent axis only: `hostel`, `private`, or `undetermined`. `product-type` is a separate field that should be set only when the destination inventory is known. `decision-mode` describes how the user was routed when intent is undetermined or a chooser UI is shown.

Any planning task, analytics event, or acceptance criterion that references "funnel family" must map to one of the destination funnel values above, not to source-surface labels.

## Page-Role Matrix
| Route | Role | Permitted booking action |
|---|---|---|
| Homepage | Route | Widget entry -> hostel-central or private summary |
| `/book` (localized hostel slug) | Compare/choose | Full room comparison, search, recovery, policies |
| `/dorms` | Browse/SEO | Room discovery; CTA routes to room detail or compare page, not directly to secure-booking |
| `/dorms/[id]` (room detail) | Reassure/assist | Direct room/rate CTA into hostel-assist subflow |
| `/book/secure-booking` | Finish (env-gated) | Final Brikette-controlled hostel stage; cross-origin Octorate embed or direct fallback |
| `/private-rooms` (summary) | Segment/route | Routes to apartment detail or double-room detail; not a generic private-booking entry |
| `/private-rooms/[product]` (detail) | Reassure | Product-specific detail; CTA routes to product-specific booking page |
| `/private-rooms/book` | Finish | Private-product booking; apartment-specific logic; cannot receive generic private intent |
| Content pages (guides, assistance, experiences, etc.) | Assist/convert | Content-entry CTA resolved via intent matrix; hostel or private depending on resolved intent |

*Route paths above are shorthand. All hostel booking routes are resolved through `getBookPath(lang)` and its children; all private routes through `getPrivateRoomsPath(lang)` and `getPrivateBookingPath(lang)`. Do not copy literal path strings from this table into plan tasks or acceptance criteria.*

## State Continuity Contract
The canonical continuity object must survive every Brikette-controlled step for each funnel. Planning must ensure no step silently drops a field without an explicit fallback.

### Booking-State Continuity (functional — UX breaks without these)
| Field | Hostel-central | Hostel-assist | Private |
|---|---|---|---|
| lang | Required | Required | Required |
| check-in / check-out | Soft (widget) -> Required (compare+) | Required | Required |
| pax | Soft (widget) -> Required (compare+) | Required | Required |
| product-type | `hostel_bed` (implicit) | `hostel_bed` (implicit) | `apartment` or `double_private_room` (explicit) |
| room-id | N/A at compare; set at room select | Set at room-detail CTA | N/A |
| rate/plan-id | Set at room select | Set at room-detail CTA | N/A |
| fallback-behaviour (recovery route only) | Explicit: drop to compare page, preserving dates/pax; current code also drops source attribution | Explicit: must preserve room-id/plan/source attribution; current code does NOT (Major gap) | Explicit: stay on booking page / WhatsApp or drop to product detail; no safe generic private-booking fallback exists |

### Attribution & Measurement Continuity (observability — analytics accuracy breaks without these)
| Field | Hostel-central | Hostel-assist | Private |
|---|---|---|---|
| source-surface | Required for analytics; current code does NOT survive homepage/content -> compare transitions unless explicitly persisted | Required for analytics; current code degrades to current route on room CTA / fallback | Required for analytics; current code degrades to the localized private booking route at handoff |
| source-cta | Required for analytics; currently emitted only on the initial CTA click, then dropped before room/rate selection | Required for analytics; current code splits between `room_card` and `sticky_book_now` with no shared persistence carrier | Required for analytics; private-summary CTAs currently emit nothing and apartment handoff only knows the final CTA |
| source-intent | `hostel` (implicit), but current multi-step journey does NOT persist it to later handoff events | `hostel` (implicit), but absent/invalid recovery drops assist context | `private` (explicit), but generic private intent is unsafe until destination routing is constrained |
| deal param | `deal` can survive hostel compare -> Octorate; raw inbound `utm_*` preservation is out of scope for this planning cycle | `deal` can survive direct hostel handoff; secure-booking fallback preserves `deal` only; raw inbound `utm_*` preservation is out of scope for this planning cycle | Apartment handoff rewrites fixed apartment campaign values; inbound raw `utm_*` preservation is out of scope for this planning cycle |
| fallback attribution | Current compare-page recovery drops original source attribution unless an explicit carrier is added | Current secure-booking fallback strips original CTA attribution and assist context unless an explicit carrier is added | Current fallback paths degrade attribution to the current private product page unless an explicit carrier is added |

| Note | Hostel-central | Hostel-assist | Private |
|---|---|---|---|
| Content-entry (source overlay) | When a user enters from a content surface, `source-surface=content_page` and `source-cta=sticky_cta` are captured at click time. All other continuity fields (`lang`, dates, pax, etc.) then follow the target destination funnel column based on resolved intent. The content-specific attribution fields (`source-surface`, `source-cta`, `resolved-intent`) must be propagated explicitly or they are lost after the first route change. | Same rule as hostel-central once content-origin traffic resolves into the assist path. | Same rule as hostel-central once content-origin traffic resolves into the private path. |

## Outcome Contract
- **Why:** Brikette needs a single coherent sales-funnel model so homepage, booking pages, room pages, private-product pages, and content pages stop competing with one another and instead route users deliberately toward the correct booking outcome.
- **Intended Outcome Type:** operational
- **Intended Outcome Statement:** produce a planning-ready funnel architecture and implementation constraints that define the central hostel conversion path, the private-product path, the role of browse/supporting pages, and the locale-continuity boundary up to Octorate.
- **Source:** operator

## Access Declarations
- `https://hostel-positano.com` - public read access to live funnel behavior. `UNVERIFIED` in `memory/data-access.md`.
- `https://staging.brikette-website.pages.dev` - public read access to staging funnel behavior. `UNVERIFIED` in `memory/data-access.md`.
- `https://book.octorate.com` guest-facing booking engine pages - public read access via booking-result URLs. `UNVERIFIED` in `memory/data-access.md`.

## Evidence Audit (Current State)
### Entry Points
- `apps/brikette/src/app/[lang]/HomeContent.tsx` - homepage funnel entry and homepage room-carousel CTA routing.
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx` - canonical hostel compare-and-choose page candidate.
- `apps/brikette/src/app/[lang]/book-dorm-bed/page.tsx` - live public hostel booking entry route wrapper.
- `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx` - dorm browse page with booking controls and room list.
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx` - room-detail assist path with env-dependent hostel handoff.
- `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx` - env-gated same-domain secure-booking shell before embedded Octorate.
- `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx` - private summary hub.
- `apps/brikette/src/app/[lang]/private-rooms/ApartmentPageContent.tsx` - apartment detail page.
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx` - private-product booking page and Octorate handoff.
- `apps/brikette/src/app/[lang]/private-rooms/private-stay/PrivateStayContent.tsx` - private-stay content subpage under the private summary family; routes to `getPrivateBookingPath(lang)` with WhatsApp fallback; functions as a private-intent content entry point, not a summary or booking page.
- `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` - deals page; routes to the localized hostel booking route with `?deal=<dealId>` appended; deal code is passed through the URL and then into `buildOctorateUrl()`; informational `DealsBanner` (bed count + countdown) is present on this page but is display-only and not a booking CTA.
- `apps/brikette/src/components/header/Header.tsx` - sitewide header; contains separate desktop (`desktop_header`) and mobile (`mobile_nav`) CTA buttons, both firing `fireCtaClick` and both routing to `getBookPath(lang)`; permanent fixtures visible on every page.
- `apps/brikette/src/context/modal/global-modals/OffersModal.tsx` - click-to-dismiss global modal (triggered from sitewide shell, not a dedicated page); routes to `getBookPath(lang)` on reserve action; fires `fireCtaClick({ ctaId: "offers_modal_reserve", ctaLocation: "offers_modal" })`.
- `apps/brikette/src/components/cta/ContentStickyCta.tsx` - click-to-dismiss sticky CTA mounted on content pages; always routes to `getBookPath(lang)` regardless of `ctaLocation` prop.
- `packages/ui/src/organisms/StickyBookNow.tsx` - room-detail sticky CTA (distinct from `ContentStickyCta`); mounted only on `/dorms/[id]` via `RoomDetailContent.tsx`; fires `begin_checkout` event and routes through `buildHostelBookingTarget()` with room/rate context.

### Explicit Sales Path Inventory
#### Hostel central path
1. Homepage -> localized hostel booking route (`getBookPath(lang)`) from hero and booking widget.
2. Hostel booking page -> room comparison via `RoomsSection`.
3. Room/rate selection -> `buildHostelBookingTarget()`, which sends users either to the localized secure-booking route or directly to Octorate depending on custom-page env state.
4. If the custom-page flag is enabled, secure booking -> embedded Octorate `result.xhtml`.

Evidence:
- `apps/brikette/src/app/[lang]/HomeContent.tsx`
- `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`
- `apps/brikette/src/utils/octorateCustomPage.ts`
- `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`

#### Hostel central path — additional sitewide entry surfaces
The following sitewide surfaces also route into the hostel central path and must be covered by the same funnel-intent routing and analytics policy:

- **Header CTAs** (`Header.tsx`): desktop and mobile nav "check availability" buttons fire `header_check_availability` / `mobile_nav_check_availability` CTA events and route to `getBookPath(lang)`. Permanent fixtures on every page.
- **OffersModal** (`OffersModal.tsx`): click-to-dismiss modal shown to selected users from sitewide shell. Routes to `getBookPath(lang)` on reserve. Fires `offers_modal_reserve` CTA event. No intent branching — always hostel only.
- **Deals page** (`DealsPageContent.tsx`): routes to `getBookPath(lang)?deal=<dealId>`. Deal code survives the localized hostel booking page into `buildOctorateUrl()`. Fires `select_promotion` GA4 event before navigation. This is the only entry surface where an explicit deal attribution code is carried through the funnel from a Brikette page.

Evidence:
- `apps/brikette/src/components/header/Header.tsx`
- `apps/brikette/src/context/modal/global-modals/OffersModal.tsx`
- `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx`

#### Hostel assist paths
1. Homepage room carousel -> generic hostel booking page, not room-specific flow.
2. Dorms browse page -> room details or direct room-rate CTA when search state is valid.
3. Room detail page -> `buildHostelBookingTarget()` with room/rate preserved, leading either to secure-booking or direct Octorate handoff depending on env state. `StickyBookNow` and `RoomCard` CTAs are distinct components with different event contracts: `StickyBookNow` fires `begin_checkout`, `RoomCard` fires `select_item`.

Evidence:
- `apps/brikette/src/app/[lang]/HomeContent.tsx`
- `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`
- `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
- `apps/brikette/src/components/rooms/RoomsSection.tsx`
- `apps/brikette/src/components/rooms/RoomCard.tsx`
- `packages/ui/src/organisms/StickyBookNow.tsx`

#### Private product path
Taxonomy note: use three product-family terms only in planning and evidence interpretation: `hostel bed` (dorm booking), `apartment` (private, self-contained unit), and `double private room` (private, hotel-style room within the hostel property). Treat `/private-rooms` as the private summary browse hub. The current booking endpoint is apartment-specific; whether double private room shares that endpoint or needs a separate product path remains an open design decision.

1. Private summary hub -> apartment detail / double private room detail, with current CTAs still able to send generic private intent toward the apartment-specific booking endpoint.
2. Apartment detail page -> apartment booking route or WhatsApp fallback.
3. Private-stay content subpage -> apartment booking route (`getPrivateBookingPath(lang)`) or WhatsApp fallback directly. This is a content/editorial subpage within the private-rooms family, not a comparison or booking page, but it provides a direct private booking entry point. It is a private-intent content surface and must follow the same private routing rules as the summary hub; it cannot safely be sent to the apartment checkout if double-private-room intent is also present on this page.
4. Private-product booking page -> direct Octorate `calendar.xhtml` handoff.

Evidence:
- `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`
- `apps/brikette/src/app/[lang]/private-rooms/ApartmentPageContent.tsx`
- `apps/brikette/src/app/[lang]/private-rooms/private-stay/PrivateStayContent.tsx`
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`

#### Content-entry paths
1. Guides, assistance, experiences, breakfast menu, bar menu, about, and how-to pages mount `ContentStickyCta`.
2. `ContentStickyCta` currently always routes to the localized hostel booking page via `getBookPath(lang)`.

Evidence:
- `apps/brikette/src/components/cta/ContentStickyCta.tsx`
- `apps/brikette/src/app/[lang]/experiences/[slug]/GuideContent.tsx`
- `apps/brikette/src/app/[lang]/how-to-get-here/[slug]/HowToGetHereContent.tsx`
- `apps/brikette/src/app/[lang]/how-to-get-here/HowToGetHereIndexContent.tsx`
- `apps/brikette/src/app/[lang]/assistance/AssistanceIndexContent.tsx`
- `apps/brikette/src/app/[lang]/breakfast-menu/BreakfastMenuContent.tsx`
- `apps/brikette/src/app/[lang]/bar-menu/BarMenuContent.tsx`
- `apps/brikette/src/app/[lang]/about/AboutContentWrapper.tsx`
- `apps/brikette/src/app/[lang]/experiences/ExperiencesPageContent.tsx`

### Key Modules / Files
- `apps/brikette/src/utils/localizedRoutes.ts` - localized route helpers for hostel and private-product booking roots.
- `apps/brikette/src/utils/privateRoomPaths.ts` - localized private-room path helpers.
- `packages/ui/src/config/privateRoomChildSlugs.ts` - locale-specific child slugs for private summary product pages.
- `apps/brikette/src/utils/octorateCustomPage.ts` - central hostel handoff mode selector and secure-booking route builder.
- `apps/brikette/src/utils/buildOctorateUrl.ts` - final hostel Octorate URL builder; no locale propagation to Octorate.
- `apps/brikette/src/components/booking/OctorateCustomPageShell.tsx` - Brikette-controlled shell around embedded Octorate.
- `apps/brikette/src/components/booking/BookPageSections.tsx` - canonical hostel booking search panel and recovery section.
- `apps/brikette/src/components/landing/BookingWidget.tsx` - homepage date/guest widget.
- `apps/brikette/src/components/header/NotificationBanner.tsx` - top-level promotional booking CTA behavior (permanent fixture, hostel-only).
- `apps/brikette/src/components/header/Header.tsx` - sitewide header with desktop and mobile "check availability" CTAs (permanent fixtures, hostel-only, fire `fireCtaClick`).
- `apps/brikette/src/context/modal/global-modals/OffersModal.tsx` - click-to-dismiss sitewide offers modal routing to hostel booking on reserve.
- `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx` - deals page with deal-code routing to hostel booking; the only Brikette page surface that initiates a deal-attributed hostel booking.
- `apps/brikette/src/components/deals/DealsBanner.tsx` - display-only promotional banner on the deals page (beds count + countdown); NOT a booking CTA.
- `apps/brikette/src/app/[lang]/private-rooms/private-stay/PrivateStayContent.tsx` - private-intent content subpage with direct private booking CTA and WhatsApp fallback.
- `packages/ui/src/organisms/StickyBookNow.tsx` - room-detail sticky CTA (different component and event contract from `ContentStickyCta`; fires `begin_checkout`).

### Patterns & Conventions Observed
- Brikette already distinguishes hostel booking and private-product booking at the route-helper level.
  - Evidence: `apps/brikette/src/utils/localizedRoutes.ts`
- Private-room child routes are already localized per language, not hard-coded English.
  - Evidence: `packages/ui/src/config/privateRoomChildSlugs.ts`
- Locale continuity is maintained across Brikette routes by helper functions, but Octorate handoff URLs themselves do not currently include locale parameters.
  - Evidence: `apps/brikette/src/utils/localizedRoutes.ts`, `apps/brikette/src/utils/buildOctorateUrl.ts`
- The hostel secure-booking shell is cross-origin iframe-first in code. The `widgetScriptSrc` / `widgetGlobalKey` env values exist, but the current page client always passes `embedUrl`, so the implementation path is iframe embed rather than a proven widget bootstrap. Deployment state remains unverified.
  - Evidence: `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`, `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`, `apps/brikette/src/components/booking/OctorateCustomPageShell.tsx`
- Homepage, hostel booking page, dorms page, and room detail all currently act as partially overlapping booking surfaces rather than clearly separated route / compare / reassure / finish stages.
  - Evidence: `apps/brikette/src/app/[lang]/HomeContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`, `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`
- Content pages already offer funnel entry, but the entry is generic and hostel-only.
  - Evidence: `apps/brikette/src/components/cta/ContentStickyCta.tsx`
- Global booking CTA surfaces are not yet aligned. `NotificationBanner`, `Header.tsx` (desktop + mobile), and `OffersModal` all route hostel-only and none of them apply intent branching or carry the funnel-entry attribution that the planned analytics taxonomy requires.
  - Evidence: `apps/brikette/src/components/header/NotificationBanner.tsx`, `apps/brikette/src/components/header/Header.tsx`, `apps/brikette/src/context/modal/global-modals/OffersModal.tsx`
- Room-detail booking assist is split across two CTA systems (`RoomCard` plan CTAs and `StickyBookNow`) with different event behavior and different failure/recovery semantics. `RoomCard` fires `select_item`; `StickyBookNow` fires `begin_checkout`. Both must be covered by the same room-assist source_cta values.
  - Evidence: `apps/brikette/src/app/[lang]/dorms/[id]/RoomDetailContent.tsx`, `apps/brikette/src/components/rooms/RoomCard.tsx`, `packages/ui/src/organisms/StickyBookNow.tsx`
- The deals page is the only Brikette-owned surface that injects a deal code into the hostel funnel path at source. `DealsPageContent.tsx` appends `?deal=<dealId>` to `getBookPath(lang)`, and the deal code is carried forward through `buildOctorateUrl()`. This deal-attribution path is distinct from the plain hostel central path and requires its own `source_surface=deals_page` classification in the analytics taxonomy.
  - Evidence: `apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx`, `apps/brikette/src/utils/buildOctorateUrl.ts`
- The `/private-rooms/private-stay` subpage is a private-intent content page that routes directly to `getPrivateBookingPath(lang)` and WhatsApp — independent of the private summary hub. It is currently invisible in the funnel-intent policy and must be treated as a private-intent content entry point alongside the summary hub.
  - Evidence: `apps/brikette/src/app/[lang]/private-rooms/private-stay/PrivateStayContent.tsx`

### Data & Contracts
#### Route continuity contract
- Hostel booking root is localized via `getBookPath(lang)`.
- Private-product booking root is localized via `getPrivateBookingPath(lang)`.
- Private summary and child routes are localized via `getPrivateRoomsPath(lang)` and `getPrivateRoomChildPath(lang, routeId)`.

Evidence:
- `apps/brikette/src/utils/localizedRoutes.ts`
- `apps/brikette/src/utils/privateRoomPaths.ts`
- `packages/ui/src/utils/privateRoomPaths.ts`
- `packages/ui/src/config/privateRoomChildSlugs.ts`

#### Hostel checkout continuity contract
- Hostel room/rate selection can stay on-domain until secure-booking when the custom-page flag is enabled; otherwise handoff goes directly to Octorate.
- When enabled, secure-booking is built under the localized hostel booking route, then embeds Octorate.

Evidence:
- `apps/brikette/src/utils/octorateCustomPage.ts`
- `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`
- `apps/brikette/src/components/booking/SecureBookingPageClient.tsx`

#### Locale boundary contract
- Brikette owns localized routing and localized content through homepage, booking page, dorms, room detail, and the final Brikette-controlled hostel handoff stage when the env gate is verified and iframe viability is proven.
- `buildOctorateUrl()` emits `result.xhtml` URLs with booking params, and optional deal/UTM params, but no locale parameter.
- `ApartmentBookContent.tsx` emits `calendar.xhtml` URLs with booking params and UTM values, but no locale parameter.
- Locale continuity should therefore be planned as guaranteed only through the final Brikette-controlled stage, not inside Octorate.

Evidence:
- `apps/brikette/src/utils/buildOctorateUrl.ts`
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`
- `apps/brikette/src/app/[lang]/book/secure-booking/page.tsx`

#### Commercial segmentation contract
- Hostel path and private-product path are already distinct products in the codebase.
- Current content-entry CTA ignores that distinction and always routes into the hostel booking root.
- The current private-product booking implementation is apartment-specific, so the private route family is not yet a generic private checkout contract.

Evidence:
- `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`
- `apps/brikette/src/app/[lang]/private-rooms/ApartmentPageContent.tsx`
- `apps/brikette/src/components/cta/ContentStickyCta.tsx`
- `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`

### Dependency & Impact Map
- Upstream dependencies:
  - Next App Router route wrappers and route-localized slug system.
  - Shared `@acme/ui` room-list and sticky CTA components.
  - Octorate guest-facing booking endpoints.
- Downstream dependents:
  - GA4 handoff and CTA analytics.
  - SEO landing routes for hostel, dorm, private-room, and guide content.
  - Locale-specific page experiences on all commercial surfaces.
- Likely blast radius:
  - homepage CTA behavior
  - booking page content hierarchy
  - dorm browse page role
  - room detail CTA system
  - content sticky CTA targeting
  - private-product positioning relative to hostel booking

### Delivery & Channel Landscape
- Audience/recipient:
  - high-intent direct hostel bookers
  - lower-intent room researchers
  - apartment-intent / double-private-room-intent users
  - guide and assistance readers who may convert later in session
- Channel constraints:
  - all major content surfaces should expose a booking entry path
  - those entry paths should be relevant to likely user intent, not always identical
  - locale-specific slugs and copy need to persist through Brikette-owned funnel stages
- Existing assets:
  - env-gated secure-booking shell for hostel; deployment state unverified
  - apartment booking page with plan cards and WhatsApp fallback
  - content sticky CTA component already mounted across multiple content families
- Compliance constraints:
  - Octorate remains third-party transactional engine
  - locale continuity cannot be assumed inside Octorate

## Test Landscape
### Existing Coverage
| Area | Test Type | Files | Coverage Notes |
|---|---|---|---|
| Content-entry CTA contract | unit | `apps/brikette/src/test/components/content-sticky-cta.test.tsx` | Covers current sticky CTA render/dismiss behavior and `cta_click`, but its route expectation still asserts `/en/book`, which is stale against the current English slug (`/en/book-dorm-bed`). Treat it as interaction coverage, not reliable route-accuracy proof. |
| Hostel secure-booking route builder | unit | `apps/brikette/src/test/utils/octorateCustomPage.test.ts` | Covers `buildHostelBookingTarget()` mode switching, but the same-origin expectation still uses `/en/book/secure-booking` rather than the current English booking slug family. Treat it as mode-switch coverage, not authoritative localized-route proof. |
| Hostel Octorate URL builder | unit | `apps/brikette/src/utils/buildOctorateUrl.test.ts` | Confirms `result.xhtml` URL structure and validation guards for hostel handoff params. |
| Apartment booking handoff matrix | unit | `apps/brikette/src/test/components/apartment/apartment-booking-url-matrix.test.tsx` | Confirms apartment booking sends the expected `calendar.xhtml` URL, room codes, guest counts, and UTM campaign values. |
| Secure-booking shell wrapper | unit | `apps/brikette/src/test/components/octorate-custom-page-shell.test.tsx` | Covers the Brikette-owned wrapper behavior around the embedded hostel handoff stage. |

### Coverage Gaps
- No repo evidence confirms that the target deployed environments currently set `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED=1`; the code proves an env-gated path, not active deployment state.
- No repo evidence proves that Octorate `result.xhtml` can be embedded reliably inside the secure-booking iframe on the target deployment; current tests cover the shell wrapper, not vendor-side iframe permissibility or cookie behavior.
- Two existing unit suites still assert the old English booking path family (`/en/book` and `/en/book/secure-booking`) rather than the current slug-resolved `/en/book-dorm-bed...` paths, so current route-level confidence is overstated unless those tests are updated.
- No tests yet prove intent-aware CTA targeting by content family; the current content CTA suite reinforces the hostel-only routing that this funnel project is expected to change.

### Responsive Layout Gaps (Breakpoint Sweep 2026-03-08)
Live browser observation at 1280px plus Tailwind class analysis for 320–768px. Full report: `docs/audits/breakpoint-sweeps/2026-03-08-brikette-live/breakpoint-sweep-report.md`.

**Method note:** viewport resizing was not available via the MCP browser tool; mobile/tablet widths were characterised by reading responsive Tailwind classes. Layout logic findings are high-confidence; exact pixel-level rendering at those widths is not screenshot-verified.

Findings with direct funnel relevance:

| ID | Sev | Breakpoints | Funnel surface | Issue |
|---|---|---|---|---|
| BRK-01 | Medium | 320–639px | `header_primary_cta` / `mobile_nav_cta` (sitewide shell) | MobileNav "Check availability" CTA is constrained to `max-w-[6rem]` (96px) — insufficient for the 17-char label at `text-xs`. Label clips on all phones. Clears at 640px (`sm:max-w-none`). Mobile CTA is present and tappable but text is truncated. |
| BRK-02 | Low | 320–1023px | Homepage trust layer (conversion signal) | Ratings panel (Hostelworld / Booking.com scores) is `hidden lg:flex` — completely invisible on every phone and tablet. The majority of real booking sessions happen on mobile without any third-party trust validation visible. No funnel-blocking, but materially degrades social proof at the widest part of the funnel. |
| BRK-03 | Medium | 320–639px | Hostel central path / compare step (RoomsSection) | `RoomsSection` has `pt-30` (120px) top padding on mobile, dropping to `pt-12` (48px) at 640px. Combined with the banner + mobile nav + BookingWidget, room cards are pushed well below the fold on phones. Users who do not scroll past the booking widget never reach the room comparison. Likely an unintentional padding value. |
| BRK-04 | Low | 320–767px | Content-entry CTA (`sticky_cta` source) | `ContentStickyCta` dismiss button is `size-10` (40px), 4px short of the WCAG 2.5.5 44px minimum. Users on small phones may accidentally dismiss rather than interact. `NotificationBanner` dismiss correctly uses `size-11`. |
| BRK-06 | Low | All widths | Sitewide shell / private-rooms route | `NotificationBanner` suppression on `/private-rooms` is client-side only (`pathname.includes`). Banner renders server-side then unmounts after hydration — causes a brief layout flash. Relevant because the banner is a sitewide hostel CTA; its appearance (even briefly) on the private-rooms page contradicts the funnel boundary between hostel and private surfaces. |
| BRK-07 | Medium | All widths | `/en/help` SEO / content-entry | Help page (`/en/help`) surfaced `title: undefined` in the a11y observation. All other audited routes returned valid titles. If confirmed, this is an SEO gap on a content-entry surface that mounts `ContentStickyCta` and is part of the assistance content family. |
| BRK-08 | Low | All widths | Hostel compare / browse step | `scroll-mt-30` (120px) on RoomsSection is larger than any sticky header height (MobileNav ≈ 64px, DesktopHeader ≈ 88px). Creates excess whitespace when `#rooms` anchor is used (e.g. from homepage widget). |

Non-funnel-relevant findings: BRK-05 (extreme 320px brand text squeeze) is cosmetic and does not affect CTA reachability.
- No tests prove that `NotificationBanner` follows the same funnel-targeting policy or analytics taxonomy as the other entry surfaces.
- No route-level integration coverage proves locale continuity across the localized hostel booking route, its secure-booking child route, and the localized private booking route.
- No tests prove that room-assist recovery preserves selected room/rate intent when secure-booking query parsing fails or iframe loading falls back.
- No tests prove that private-summary routing distinguishes apartment intent from double-private-room intent before sending users to the apartment-specific booking page.
- No measurement-contract tests exist yet for the proposed destination-funnel analytics taxonomy.

### Recommended Test Approach
- Add contract tests for future content CTA routing rules, including `experiences_page` and any private-intent branches.
- Add contract tests for `NotificationBanner` once funnel-targeting rules are defined so global booking entry obeys the same hostel/private/hybrid routing policy.
- Add route-level tests for localized handoff continuity on hostel secure-booking and private-product booking pages.
- Add route-level tests for room-assist recovery so room/rate/source-route context survives secure-booking fallback paths where the UX promise requires it.
- Add targeted tests for private-summary routing rules so double-private-room intent is not silently sent to apartment-only checkout.
- Add a deployment verification step or captured config evidence for `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` before plan tasks assume the same-origin hostel finish stage is live.
- Add a manual staging proof step for secure-booking iframe embeddability and fallback behavior because automated unit tests cannot prove cross-origin Octorate behavior.
- Sequence analytics event taxonomy work before any acceptance criteria that compare entry-path progression rates.

## Questions
### Resolved
- Q: Is `/dorms` the only non-central route that matters for the funnel?
  - A: No. The private-product route family is a separate commercial path and must be included alongside hostel booking routes.
  - Evidence: `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/ApartmentPageContent.tsx`

- Q: Should every meaningful page provide a path into the funnel?
  - A: Yes, and the codebase already partially does this through `ContentStickyCta`, but the current implementation routes all content traffic into the generic hostel booking page rather than an intent-aware funnel entry.
  - Evidence: `apps/brikette/src/components/cta/ContentStickyCta.tsx`

- Q: How far can locale continuity realistically be preserved?
  - A: Through every Brikette-controlled route and wrapper up to the secure-booking or private-product booking handoff; not reliably inside Octorate based on current URL builders.
  - Evidence: `apps/brikette/src/utils/localizedRoutes.ts`, `apps/brikette/src/utils/buildOctorateUrl.ts`, `apps/brikette/src/app/[lang]/private-rooms/book/ApartmentBookContent.tsx`

- Q: Is the hostel booking page still the best candidate for the central hostel funnel?
  - A: Yes. It is the only current surface explicitly structured as a compare-and-choose page with booking state, social proof, room list, recovery, and policy panels.
  - Evidence: `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`

- Q: Should `/dorms` be treated as equal-status to the central hostel booking page?
  - A: No. Because Brikette also has a distinct private-product route family and multiple content-driven entry surfaces, `/dorms` is better treated as a browse/SEO/supporting route rather than a second co-equal booking decision page.
  - Evidence: `apps/brikette/src/app/[lang]/dorms/RoomsPageContent.tsx`, `apps/brikette/src/app/[lang]/book/BookPageContent.tsx`, `apps/brikette/src/app/[lang]/private-rooms/PrivateRoomsSummaryContent.tsx`

### Operator decisions required
- None at fact-find stage.

### Open design decisions
- Hybrid intent: which of the three definitions above applies?
- Double-room booking endpoint: separate product page or shared with apartment page?
- CTA routing matrix: which content families resolve to hostel / private / hybrid?
- Generic private content destination: when resolved intent is private but not product-specific, should the CTA route to localized private summary, a chooser, or a specific product detail page? The localized private booking route is not a safe generic target.
- Global banner routing matrix: `NotificationBanner` is in-scope for intent-resolved routing (per Constraints). The open design decision is its routing matrix — which surface contexts resolve to hostel, private, or hybrid, and whether it uses the same intent resolver as `ContentStickyCta` or has a separate policy.
- Entry-attribution carrier: how do `source_surface`, `source_cta`, `resolved_intent`, `product_type`, `decision_mode`, and the deal param survive internal route changes and fallback paths so later handoff events can emit the full analytics contract?

### Open runtime verification
- `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` state on target deployment
- Staging proof that `result.xhtml` can load and remain usable inside the Brikette shell
- Fallback contract behaviour when iframe loading fails

## Confidence Inputs
- Scale: Low (< 70%), Medium (70–84%), High (85–94%), Very High (>= 95%)
- Implementation: Medium
  - Evidence basis: route ownership is clear and the destination-funnel taxonomy is now explicit, but the implementation model still has unresolved design decisions: private generic destination rule, intent schema (resolved_intent / product_type / decision_mode), attribution carrier across route transitions, banner routing matrix, and private-product checkout segmentation. These gaps mean the implementation is not yet fully specifiable.
  - To reach next band (High): lock the five unresolved design decisions in the first planning wave, then verify env gate state and iframe viability.
- Approach: High
  - Evidence basis: the codebase already supports separate hostel/private route families, localized route helpers, and a Brikette-owned hostel shell stage when the env gate is on, but the fact-find had understated the missing routing and recovery contracts.
  - To reach next band: model hostel, private, and hybrid entry intents explicitly in the plan and define one funnel policy that covers `ContentStickyCta`, `NotificationBanner`, header/hero CTAs, and room-assist recovery.
- Impact: Medium
  - Evidence basis: structural observation plus responsive layout audit (2026-03-08). Code-level friction: overlapping booking surfaces, hostel-only content CTAs, mixed room-detail CTA behavior, private-product overgeneralization. Breakpoint sweep adds rendered evidence: the MobileNav CTA label truncates on all phones (BRK-01), the room-comparison step is pushed below the fold on mobile by a 120px padding gap (BRK-03), and trust ratings are absent on every mobile and tablet visit (BRK-02). These are observable funnel degradations on the primary device segment, not hypothetical. Still no conversion-rate baseline; this remains Medium because damage magnitude is unquantified.
  - To reach next band: fix BRK-01 and BRK-03 (baseline-corrupting layout bugs) first, then instrument GA4 entry-path funnel events and compare entry-path → final handoff progression rates for hostel-central, hostel-assist, and private destination funnels over a 2–4 week post-ship window.
- Delivery-Readiness: Medium
  - Evidence basis: most route changes are Brikette-controlled, but the central hostel finish stage and observability story are not ready until env verification, iframe proof, analytics taxonomy, and recovery contracts are all explicit.
  - To reach next band: make env verification + iframe proof + analytics taxonomy + funnel-intent routing the first gated plan tasks, then lock page-role ownership and recovery behavior with acceptance criteria.
- Testability: Medium
  - Evidence basis: unit coverage exists for several leaf utilities, but the forward rehearsal exposed major gaps in route-level continuity, global CTA policy, private-product routing, room-assist recovery, content-entry routing, and iframe viability proof.
  - To reach next band: add explicit tests for content/global CTA targeting, room-assist fallback preservation, localized secure-booking continuity, and private-summary routing rules. **Planning prerequisite:** these test cases must be sequenced before the first IMPLEMENT task that changes routing, recovery, or locale continuity behavior.
  - To reach next band after that: add manual staging proof for secure-booking iframe viability and post-ship smoke checks for the hostel-central and private paths.

## Risks
| Risk | Likelihood | Impact | Mitigation / Open Question |
|---|---|---|---|
| Hostel secure-booking shell is assumed as the canonical finish stage when env gate is verified and iframe viability is proven, but the target deployment may still have `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED=0` | High | High | Treat env verification as a first-plan gate. If the flag is off, either block shell-dependent acceptance criteria or define an explicit dual-mode rollout |
| Secure-booking iframe viability is outside repo control and currently unevidenced | Medium | High | Capture staging proof that `result.xhtml` can load and remain usable inside the Brikette shell; otherwise downgrade the shell to a fallback/transition step rather than the canonical finish stage when env gate is verified and iframe viability is proven |
| Hostel and private-product routes remain conceptually entangled in UX copy and CTA targeting | Medium | High | Explicitly define separate funnel roles in planning |
| Content pages keep routing all intent into the hostel booking page because the current CTA contract has no private or hybrid intent model | High | High | Add a funnel-intent resolver and extend CTA inputs beyond `ctaLocation`; do not treat hybrid as implied if no route or decision contract exists |
| Global booking CTAs stay out of policy and continue leaking users into the hostel funnel | High | Medium | Bring `NotificationBanner`, `Header.tsx` (desktop + mobile), and `OffersModal` under the same funnel-intent routing and analytics rules as content-entry CTAs. All three are currently hostel-only with no intent branching and none emit analytics events on the canonical taxonomy. |
| Entry attribution is lost after the first internal route change, so later handoff events cannot reliably emit `source_surface`, `source_cta`, `resolved_intent`, `product_type`, or `decision_mode` for multi-step journeys | High | High | Define and implement an explicit persistence carrier for entry context before any success metric compares content/home/banner-origin traffic at final handoff |
| Raw inbound `utm_*` attribution is silently dropped across Brikette route changes and secure-booking fallback; only `deal` survives some hostel branches and apartment handoff rewrites fixed campaign values | High | Medium | Keep raw inbound `utm_*` preservation out of scope for this planning cycle; treat it as an optional observability enhancement, and keep `deal` preservation explicit where current code already supports it |
| Locale continuity regresses on late funnel pages | Medium | High | Treat localized route continuity as a non-negotiable acceptance criterion |
| `/dorms` continues acting like a second central booking page | High | Medium | Reframe it as browse/SEO/supporting route in IA and copy |
| Secure-booking improvements are undermined by weak upstream route roles | High | High | Plan upstream funnel changes before or alongside secure-booking polish |
| Private-product booking remains isolated from the wider funnel strategy | Medium | Medium | Include the private destination funnel in the same plan and analytics taxonomy |
| Private-summary or content-entry routing sends double-private-room intent into the apartment-only checkout flow | High | High | Split private checkout targets by product or explicitly constrain private-booking entry rules before implementation ships |
| Analytics remain incomparable across source surfaces, resolved intent states, and destination funnels | High | High | Define the orthogonal event taxonomy and event contract before shipping routing changes; include shell/fallback events where the journey depends on them |
| Primary mobile CTA ("Check availability" in MobileNav) is visually truncated at 320–639px — the label clips inside `max-w-[6rem]` (BRK-01) | High | Medium | Fix is isolated to MobileNav CTA constraint; must be treated as a blocking fix before any mobile funnel measurement, since a broken CTA label invalidates mobile CTR baselines |
| Room comparison step is pushed well below the fold on phones due to `pt-30` (120px) top padding on RoomsSection (BRK-03) | High | High | Audit whether `pt-30` is intentional; if not, reduce to `pt-12` to match the `sm:pt-12` value. This is a direct barrier to the hostel-central compare step on the primary device segment |
| Social proof ratings (Hostelworld / Booking.com scores) are invisible on all mobile and tablet widths below 1024px (BRK-02) | High | Medium | Consider a compact trust-score strip visible below the hero CTA on mobile; without it, mobile visitors reach the room-comparison step with no third-party validation in view |
| `NotificationBanner` renders briefly on `/en/private-rooms` before client-side suppression removes it (BRK-06) — contradicts the intended sitewide hostel / private funnel boundary | Medium | Low | Move suppression to the server component or layout to eliminate the SSR flash; low conversion impact but creates measurement noise in banner analytics |

## Hypothesis & Validation Landscape

### Key Hypotheses
- **H1 (Content intent routing):** Content pages route a non-trivial share of private-product intent into the hostel booking funnel, measurably reducing private-product conversion from content surfaces. *Signal: none. Verdict: untested — no analytics data on private-intent share from guide/assistance readers.*
- **H2 (Overlapping surfaces create friction):** Multiple booking surfaces acting as co-equal compare pages (homepage, the localized hostel compare route, dorms browse, room detail) create decision paralysis that measurably reduces hostel conversion relative to a single canonical compare page. *Signal: none. Verdict: untested — no A/B data or per-page conversion baseline exists.*
- **H3 (Locale continuity matters to conversion):** Users who encounter a locale switch at the Octorate boundary convert at a lower rate than users in their browser language throughout. *Signal: none. Verdict: testable post-implementation with Octorate analytics if available.*

### Existing Signal Coverage
None. No funnel drop-off rates, CTR data by entry path, or conversion comparisons between booking surfaces are available at fact-find time. All three hypotheses rest on structural observation, not measured user behavior.

### Falsifiability Assessment
- H1 is falsifiable post-instrumentation: measure guide-page CTA clicks -> private-product path completions before and after CTA intent routing change.
- H2 is falsifiable post-instrumentation: compare localized hostel compare-route entry -> Octorate completion rate before and after page-role consolidation.
- H3 is partially falsifiable if Octorate provides session language data; otherwise external test infrastructure required.

### Recommended Validation Approach
Analytics events must encode orthogonal dimensions rather than flat labels. Required event dimensions:

| Dimension | Values |
|---|---|
| source_surface | homepage, content_page, dorms_browse, room_detail, private_summary, sitewide_shell, deals_page |
| source_cta | booking_widget, notification_banner, header_primary_cta (desktop), mobile_nav_cta (mobile), offers_modal_reserve, sticky_cta, room_card, sticky_book_now, deals_page_reserve |
| resolved_intent | hostel, private, undetermined |
| product_type | hostel_bed, apartment, double_private_room (only set when intent is fully resolved; `null` for undetermined) |
| decision_mode | direct_resolution, chooser, hybrid_merchandising (set when `resolved_intent = undetermined` or a chooser UI is shown) |
| destination_funnel | hostel_central, hostel_assist, private |
| handoff_mode | secure_booking_shell, direct_octorate |
| locale | en, it, fr, es (etc.) |
| fallback_triggered | true / false |

Note under `source_surface`: `content_page` covers all guide, assistance, experience, breakfast-menu, bar-menu, about, and how-to surfaces. `sitewide_shell` covers `NotificationBanner`, header CTAs, and `OffersModal` — surfaces visible across multiple pages. `deals_page` is a distinct surface because it is the only Brikette page that injects a deal attribution code at source; it must not be merged with `sitewide_shell` or `content_page`. `private_summary` covers both `PrivateRoomsSummaryContent` and `PrivateStayContent` as the two private-intent content surfaces in the private-rooms family. If routing matrix performance needs per-family attribution, a `content_family` sub-dimension (for example `guide`, `assistance`, `experiences`) can be added in the plan; this is not required for the baseline event taxonomy.

Without these dimensions, H1 (content intent routing) and H2 (overlapping surfaces) cannot be compared across periods without double-counting traffic.

## Planning Constraints & Notes
- Must-follow patterns:
  - Keep localized route helpers authoritative for all Brikette-owned handoff stages.
  - Keep hostel and private-product booking as separate commercial funnels with shared design language, not merged logic.
  - Keep content-entry CTAs but stop treating all content intent as hostel-dorm intent.
  - "Hybrid" is an open design decision, not yet a normative constraint. It means one of: (a) a chooser UI presented when page intent is ambiguous, (b) a routing fallback that presents both hostel and private CTAs, or (c) a mode for merchandise pages that serve both audiences. Until one of these is chosen, hybrid must appear only in open design decisions, not in normative routing rules.
  - Apply one funnel-entry policy across sticky CTAs, global banners, header CTAs, and room-assist recovery paths.
- Rollout/rollback expectations:
  - Central funnel changes should be phased by route family, starting with hostel canonical path only after env verification and iframe viability proof are captured.
  - Private-product and content-entry targeting can follow once central route roles are locked, but private-product checkout segmentation must be explicit before summary/content pages route there.
- Observability expectations:
  - analytics should distinguish source surface, source CTA, resolved intent, product type, decision mode, destination funnel, handoff mode, locale, and fallback state.
  - analytics should cover entry, handoff, fallback, and recovery points consistently across those dimensions.

## Rehearsal Trace
### Journey 1 — Hostel Central Path
| Step | Planned post-implementation behavior | Current code basis | Env gate OFF | Env gate ON | Issues / hazards | Acceptance testability |
|---|---|---|---|---|---|---|
| 1. Homepage load | User lands on homepage and sees localized hostel CTA surfaces | `HomeContent.tsx`, `BookingWidget.tsx`, `NotificationBanner.tsx` | Homepage still renders | Homepage still renders | [Major] `NotificationBanner` remains a hostel-only global CTA and is not in the same funnel/analytics policy as the planned cohesive system | Existing unit coverage does not prove banner compliance with funnel policy |
| 2. Booking widget submit | Dates/pax persist and user is routed to the localized hostel compare page | `BookingWidget.tsx`, `localizedRoutes.ts` | Works; pushes localized `/[lang]/<book-slug>` | Works; pushes localized `/[lang]/<book-slug>` | [Major] navigation only carries `checkin` / `checkout` / `pax`; `source_surface`, `source_cta`, `resolved_intent`, `product_type`, `decision_mode`, and raw inbound `utm_*` params are dropped immediately after the homepage click. [Moderate] GA4 only emits generic `cta_click`; no destination-funnel classification yet | Existing code is unit-testable; route continuity still lacks route-level coverage |
| 3. Hostel compare page | The localized hostel compare route hydrates dates, fires search telemetry, and shows room comparison | `BookPageContent.tsx`, `RoomsSection.tsx` | Works | Works | [Moderate] success metrics assume a destination-funnel taxonomy that does not yet exist; current `search_availability` / `view_item_list` events are not enough to compare central-path progression | Existing unit coverage exists for utilities, not for full route progression |
| 4. Room/rate selection | User selects room/rate and moves into the localized secure-booking child route | `RoomsSection.tsx`, `octorateCustomPage.ts` | Sends user directly to Octorate `result.xhtml`; secure-booking shell is skipped | Sends user to localized secure-booking child route | [Critical] the planned same-domain shell journey is false unless the env gate is verified on the target deployment. [Major] entry-context continuity is already broken here: `begin_checkout` only knows the compare-page CTA and current route, not the original homepage widget/banner source. [Moderate] event contract fires `begin_checkout`, but not a canonical handoff event for this branch | Existing tests prove route builder switching, not deployed mode |
| 5. Secure-booking shell | Brikette shell mounts with room/rate summary and Octorate iframe loads | `secure-booking/page.tsx`, `SecureBookingPageClient.tsx`, `OctorateCustomPageShell.tsx` | Step does not exist | Shell renders and passes `result.xhtml` to cross-origin iframe | [Critical] iframe embeddability is assumed, not proven, and sits outside repo control. [Major] current code path is iframe-first, not a verified widget-bootstrap integration despite the env vars. [Major] internal secure-booking routing preserves `room` / `plan` / dates / pax / `deal`, but not original source attribution or raw inbound `utm_*`; the analytics carrier for `resolved_intent`, `product_type`, and `decision_mode` is also absent. [Moderate] no shell-view / iframe-ready / fallback event exists | Unit tests cover wrapper behavior only; staging proof is required |
| 6. Booking completes | User completes booking inside shell and reaches Octorate confirmation | `OctorateCustomPageShell.tsx`, vendor boundary | Direct Octorate booking may still work, but not in-shell | Completion depends on iframe viability or fallback link | [Moderate] booking completion inside the shell is not observable/testable with current infrastructure. [Moderate] fallback opens direct Octorate but changes the journey contract from in-shell to outbound | Manual staging rehearsal required; no local automated proof |

### Journey 2 — Room-Assist Path
| Step | Planned post-implementation behavior | Current code basis | Env gate OFF | Env gate ON | Issues / hazards | Acceptance testability |
|---|---|---|---|---|---|---|
| 1. User browses `/dorms` | Browse page supports discovery and room-detail entry | `RoomsPageContent.tsx` | Works | Works | [Major] `/dorms` still mixes browse and booking responsibilities, so the assist-path role is not yet cleanly separated from the central compare path | Existing coverage is route/component level, not role-validation |
| 2. User opens room detail | Room detail preserves lang and booking state | `RoomDetailContent.tsx` | Works | Works | No blocker on navigation itself | No route-level locale continuity test yet |
| 3. User clicks room CTA | Room/rate CTA reaches secure-booking with room/rate prefilled | `RoomDetailContent.tsx`, `RoomCard.tsx`, `octorateCustomPage.ts` | Direct Octorate only; no secure-booking shell | Secure-booking can receive `room`, `plan`, `checkin`, `checkout`, `pax` query | [Critical] the described room-assist shell path is impossible when the env gate is off. [Moderate] room detail has two CTA systems with inconsistent tracking: `RoomCard` fires `select_item` only, while `StickyBookNow` fires `begin_checkout`. [Major] room/rate prefill only works when valid dates/pax have already been chosen; absent state falls back to the localized hostel compare route and loses assist intent | Existing unit tests do not cover the two-CTA divergence or absent-state contract |
| 4. Secure-booking shows prefilled room/rate | Summary reflects selected room and plan | `parseSecureBookingSearchParams()`, `SecureBookingPageClient.tsx` | Step does not exist | Works if query is valid | [Major] invalid query or missing rate code sends the user back to the generic book page, not back to the originating room-assist context | Query parser is unit-testable; recovery path lacks route-level coverage |
| 5. Fallback / recovery | User can recover without losing selected room/rate intent | `SecureBookingPageClient.tsx` | N/A | Fallback href preserves dates/pax/deal only | [Major] secure-booking fallback strips `room`, `plan`, source-route context, original CTA attribution, and raw inbound `utm_*`, so the planned room-assist promise is not preserved on failure | No existing tests assert room/rate preservation across fallback |

### Journey 3 — Private Product Path
| Step | Planned post-implementation behavior | Current code basis | Env gate OFF | Env gate ON | Issues / hazards | Acceptance testability |
|---|---|---|---|---|---|---|
| 1. Private summary hub | User lands on private summary and chooses the right private product | `PrivateRoomsSummaryContent.tsx` | Unchanged | Unchanged | [Critical] summary page presents apartment and double private room together, but current "check availability" CTAs can send generic private intent toward one apartment-specific booking route. [Major] these summary CTAs emit no analytics event, so the step cannot produce the required analytics classification | Existing tests do not prove product-specific routing |
| 2. Apartment detail page | User opens apartment detail and proceeds to apartment booking | `ApartmentPageContent.tsx`, `privateRoomPaths.ts`, `localizedRoutes.ts` | Unchanged | Unchanged | Apartment-specific path is valid, but [Major] the wider fact-find cannot treat this page as a generic private-product detail contract because booking logic remains apartment-specific | Route continuity is testable; current coverage is limited |
| 3. Private-product booking page | User selects dates, pax, and rate on localized Brikette page | `ApartmentBookContent.tsx` | Unchanged | Unchanged | [Moderate] the env gate is hostel-only; private-product booking cannot share shell assumptions or acceptance criteria tied to `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED`. [Moderate] analytics use mixed raw events (`click_check_availability`, raw `begin_checkout`) plus `handoff_to_engine`, so taxonomy is inconsistent with hostel/content flows | Component logic is unit-testable; taxonomy consistency is not yet enforced |
| 4. Octorate handoff | User is sent to `calendar.xhtml` with correct apartment params | `ApartmentBookContent.tsx` | Unchanged | Unchanged | [Major] `handoff_to_engine` only knows the localized private booking route and the final apartment CTA; original source surface / source CTA do not survive from summary, detail, or content-entry origins. [Moderate] locale is not propagated into Octorate. [Moderate] no route-level proof exists for product-specific correctness beyond apartment-focused unit cases | Existing unit coverage is stronger here, but still does not prove cross-route or locale continuity |

### Journey 4 — Content-Entry Path (Hostel Intent)
| Step | Planned post-implementation behavior | Current code basis | Env gate OFF | Env gate ON | Issues / hazards | Acceptance testability |
|---|---|---|---|---|---|---|
| 1. User reads guide/content page | Content page renders localized CTA surface | `ContentStickyCta.tsx`, content-page mounts | Unchanged | Unchanged | No blocker on rendering itself | Existing unit tests cover render/dismiss behavior |
| 2. Intent is resolved as hostel | System deliberately resolves this content family to hostel-central | `ContentStickyCta.tsx`, `localizedRoutes.ts`, `NotificationBanner.tsx` | Not implemented | Not implemented | [Major] current code reaches hostel compare only by hard-coded default, not by an explicit resolver. [Major] `NotificationBanner` remains a parallel hostel-only CTA on content pages and is outside the current CTA policy | Current tests prove the wrong behavior for the planned system |
| 3. User clicks CTA | User reaches localized hostel compare page and continues as Journey 1 | `ContentStickyCta.tsx` | Always hostel | Always hostel | [Major] route change drops entry attribution after the click: later compare/handoff steps cannot recover `source_surface=content_page` or `source_cta=sticky_cta` without explicit propagation | Requires new contract tests before implementation |
| 4. Analytics classify hostel content entry | Entry is recorded as hostel content-origin traffic all the way to handoff | `ga4-events.ts`, `ContentStickyCta.tsx`, `NotificationBanner.tsx` | No destination-funnel analytics | No destination-funnel analytics | [Major] current analytics can record the initial sticky-CTA click only; later hostel handoff events cannot emit the full analytics contract for this journey | Existing analytics tests only cover current low-cardinality CTA enums |

### Journey 5 — Content-Entry Path (Private Intent)
| Step | Planned post-implementation behavior | Current code basis | Env gate OFF | Env gate ON | Issues / hazards | Acceptance testability |
|---|---|---|---|---|---|---|
| 1. User reads guide/content page | Content page renders localized CTA surface | `ContentStickyCta.tsx`, content-page mounts | Unchanged | Unchanged | No blocker on rendering itself | Existing unit tests cover render/dismiss behavior |
| 2. Intent is resolved as private | System deliberately resolves this content family to the private destination funnel | `ContentStickyCta.tsx`, `privateRoomPaths.ts`, `localizedRoutes.ts` | Not implemented | Not implemented | [Major] no private-intent resolver exists in content CTA props or banner policy; current code cannot resolve `resolved_intent=private` or set `product_type` / `decision_mode` consistently | Current tests prove the wrong behavior for the planned system |
| 3. Private destination route is chosen | Generic private intent routes to a safe private entry (localized private summary or a product-specific detail page) | `privateRoomPaths.ts`, `PrivateRoomsSummaryContent.tsx`, `privateRoomChildSlugs.ts` | Safe routes exist, but current CTA cannot reach them | Safe routes exist, but current CTA cannot reach them | [Critical] there is no safe generic private-booking route from content today: sending users to the localized private booking route would hit apartment-only checkout. [Major] the fact-find needs an explicit routing rule for whether generic private content goes to localized private summary or a product-specific detail/chooser | Requires new contract tests for route selection before implementation |
| 4. Journey continues through private funnel | User proceeds via private summary or chosen private detail, then on to private booking | `PrivateRoomsSummaryContent.tsx`, `ApartmentPageContent.tsx`, `ApartmentBookContent.tsx` | Cannot happen from current sticky CTA | Cannot happen from current sticky CTA | [Major] even if private routing is added, later handoff events currently cannot recover the original content source / CTA without explicit propagation | Requires route-level and analytics-contract coverage |

### Cross-Cutting Scenario — Locale Continuity
Locale continuity is a cross-cutting constraint across all destination funnels, not a separate funnel. This scenario validates that constraint through the hostel-central path as a representative case.
| Step | Planned post-implementation behavior | Current code basis | Env gate OFF | Env gate ON | Issues / hazards | Acceptance testability |
|---|---|---|---|---|---|---|
| 1. User lands on `/it/...` homepage | Italian locale is preserved on Brikette-owned surfaces | `localizedRoutes.ts`, `BookingWidget.tsx`, `HomeContent.tsx` | Works | Works | No blocker at entry | Route helper behavior is deterministic |
| 2. User enters hostel compare path | Widget routes to the localized hostel compare route with dates/pax intact | `BookingWidget.tsx`, `slug-map.ts` | Works | Works | No blocker on localized root routing | Route-level coverage is still missing |
| 3. User selects room/rate | Selection keeps user in Italian Brikette-controlled flow up to the Octorate boundary | `RoomsSection.tsx`, `octorateCustomPage.ts` | Direct Octorate handoff; no Italian secure-booking stage exists | Italian secure-booking route can be reached | [Critical] the promised locale-continuity path through every Brikette-controlled stage only exists when the env gate is on. [Moderate] analytics cannot currently distinguish this locale-preserved shell path from direct handoff mode | Existing tests prove helper behavior, not deployed continuity |
| 4. Secure-booking route | User stays on `/it/.../secure-booking` before Octorate boundary | `getSecureBookingInternalPath()`, `secure-booking/page.tsx` | Step does not exist | Works | [Moderate] language is preserved, but the trailing `secure-booking` segment is hard-coded rather than localized. [Moderate] no route-level tests prove localized continuity through this child route | Needs route-level contract coverage |
| 5. Octorate boundary | Locale continuity ends only at the Octorate boundary | `buildOctorateUrl.ts`, `ApartmentBookContent.tsx` | Boundary is reached earlier | Boundary is reached at secure-booking iframe/direct URL | [Major] Octorate URL builders omit locale params, so continuity cannot be claimed inside Octorate. This must stay an explicit boundary in acceptance criteria | Current evidence is code inspection only |

## Scope Signal
Signal: right-sized

Rationale: the investigation covers the full commercial surface the user asked for without drifting into implementation or vendor-side redesign. It includes the central hostel path, the private-product route family, supporting browse paths, and content-entry surfaces while staying bounded to Brikette-controlled behavior.

## Suggested Task Seeds (Non-binding)
These seeds are planning inputs only. They are not pre-committed tasks and may be split, reordered, merged, or discarded during `/lp-do-plan`.

- Define canonical page roles for `homepage`, `hostel booking`, `dorm browse`, `room detail`, `private summary`, `private-product booking`, and `secure booking`.
- Rewrite CTA targeting rules so content-entry pages route by intent, not always to hostel booking.
- Preserve locale continuity explicitly through all Brikette-controlled funnel stages.
- Separate hostel central-funnel copy from private-product copy while keeping a shared direct-booking narrative.
- Add analytics taxonomy for source surface, resolved intent, product type, decision mode, destination funnel, handoff mode, locale, and fallback state.

## Execution Routing Packet
- Primary execution skill:
  - `lp-do-build`
- Supporting skills:
  - `lp-design-spec` — for canonical page-role UI changes (CTA layout, page hierarchy, booking widget positioning)
  - `lp-seo` — for auditing canonical intent signals on content pages; ensuring that repurposed content-entry CTAs do not fragment keyword targeting or introduce duplicate-content risk across hostel vs private-product routes
- Deliverable acceptance package:
  - updated page-role architecture
  - funnel-intent routing matrix covering sticky CTAs, global banners, and other booking entry surfaces
  - funnel CTA targeting rules
  - room-assist recovery contract
  - private-product checkout segmentation rules
  - locale continuity acceptance criteria
  - analytics event updates for destination-funnel attribution and orthogonal routing dimensions
- Post-delivery measurement plan:
  - compare entry-path -> final handoff progression rates for homepage, room detail, private-product booking, and content-entry surfaces, split by `destination_funnel` plus `source_surface`, `resolved_intent`, `product_type`, and `decision_mode`

## Evidence Gap Review
### Gaps Addressed
- Added explicit private-product coverage rather than treating hostel booking as the whole funnel.
- Added explicit content-entry coverage rather than treating guides and assistance pages as outside the commercial system.
- Added locale-continuity boundary analysis rather than treating localization as purely top-of-funnel.

### Confidence Adjustments
- Lowered implementation and delivery-readiness confidence because the forward rehearsal exposed unevidenced env, iframe, routing, and recovery contracts.
- Kept testability below 80 because content-entry, room-assist recovery, private-product routing, and locale continuity all need broader route-level coverage than the current point solutions.

### Remaining Assumptions
- Octorate will remain a locale discontinuity boundary unless proven otherwise later.
- Content-entry funnel targeting can be made more intent-aware without harming SEO utility or content usability.
- The target deployment will either enable `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED` or the plan will keep the hostel funnel dual-mode compatible until enablement is verified.
- Octorate iframe embeddability will be proven on staging before the plan treats the shell as the canonical hostel finish stage.
- Private checkout will either be split by product or explicitly constrained so apartment-only logic is not mislabeled as generic private-product booking.

## Planning Readiness
- Status: Ready-for-planning
- Blocking items:
  - None for plan creation.
- Plan-stage prerequisites:
  - Verify whether the target deployment enables `NEXT_PUBLIC_OCTORATE_CUSTOM_PAGE_ENABLED=1`; until verified, treat the hostel secure-booking shell as env-gated rather than guaranteed live.
  - Capture staging proof that the secure-booking iframe path is viable and document the fallback contract if iframe embedding fails.
  - Define the funnel-intent routing matrix for hostel, private, and hybrid entry across `ContentStickyCta`, `NotificationBanner`, header/hero CTAs, and room-assist recovery before the first IMPLEMENT task changes CTA targeting.
  - Define the safe destination rule for generic private content intent (`/private-rooms` summary vs chooser vs product-specific detail) before any content or banner CTA is allowed to resolve to private.
  - Resolve private-product checkout segmentation before summary/content pages are allowed to route generic private intent into apartment-only booking.
  - Define how `source_surface`, `source_cta`, `resolved_intent`, `product_type`, `decision_mode`, and the deal param persist across internal route transitions and fallback paths before any success metric depends on the analytics contract.
  - Raw inbound `utm_*` preservation is out of scope for this planning cycle as a mandatory continuity requirement. It is an observability enhancement and should be treated as decision-gated: the plan may include it as an optional task if analytics instrumentation capacity allows, but it must not be a blocking acceptance criterion for any IMPLEMENT task. The `deal` param is in scope and must be preserved where the current code already propagates it.
  - Sequence content/global CTA targeting tests, room-assist recovery tests, and localized handoff continuity tests before the first IMPLEMENT task that changes routing, recovery, or locale continuity behavior.
  - Sequence GA4 baseline instrumentation for the orthogonal routing dimensions before any success metric that compares entry-path -> final handoff progression.
- Recommended next step:
  - `/lp-do-plan brikette-cohesive-sales-funnel --auto`

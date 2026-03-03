---
schema_version: worldclass-scan.v1
business: BRIK
goal_version: 1
scan_date: 2026-02-27
status: active
---

# World-Class Gap Scan — BRIK (2026-02-27)

## Data Sources Probed

| Data Source | Status | Notes |
|---|---|---|
| Repo | configured | — |
| Stripe | not-configured | Octorate handles all bookings for BRIK — no Stripe product catalog |
| GA4 | configured | G-2ZSYXG8R7T live in production; confirmed in `docs/business-os/strategy/BRIK/2026-02-12-ga4-search-console-setup-note.user.md` |
| Firebase | configured | Project `prime-f3652`; `.firebaserc` found at repo root |
| Octorate | configured | Booking URLs built via `apps/brikette/src/utils/buildOctorateUrl.ts` → `book.octorate.com`; reception integration in `apps/reception/` |

## Gap Comparison Table

| Domain | domain_id | Gap | Current State | Threshold | Gap Classification | Evidence Source | Notes |
|---|---|---|---|---|---|---|---|
| Website Imagery & Video | website-imagery-video | No atmospheric or property video clip | No `<video>` elements found anywhere in `apps/brikette/src/`. `VideoPlayer` atom and `VideoBlock` CMS block exist in `packages/ui` but are not imported by any brikette hostel page. Hero is a single static `.webp` with gradient overlays only. | Professionally shot, consistent photography across homepage and every room type, plus one short, silent, loop-capable clip that does not compromise mobile performance or usability | major-gap | apps/brikette/src/app/[lang]/HomeContent.tsx | `VideoPlayer` (packages/ui/src/components/atoms/VideoPlayer.tsx) is built and available — the gap is that it has never been wired into any brikette page. No hero video, no ambient loop, no room walkthrough. |
| Website Imagery & Video | website-imagery-video | Sense-of-place lifestyle imagery section built but not connected to homepage | `DestinationSlideshow` organism (3 curated outdoor/atmosphere images: terrace lush view, bamboo canopy, coastal horizon) exists in `packages/ui/src/organisms/DestinationSlideshow.tsx` with i18n titles but is not imported or rendered in `HomeContent.tsx`. Homepage hero is a single still; `WhyStaySection` is text+icon tiles only. | Multiple angles per key space; authentic lifestyle coverage; explicit sense-of-place assets (exterior context, nearby location cues) across the site | minor-gap | apps/brikette/src/app/[lang]/HomeContent.tsx, packages/ui/src/organisms/DestinationSlideshow.tsx | Component and assets are built — the gap is integration, not asset creation. Wiring `DestinationSlideshow` into `HomeContent` would partially close this gap without needing new photography. Room images in `roomsData.ts` do cover multiple angles per room (bed, bathroom, view, terrace). |
| Room-Level Booking Funnel | room-level-booking-funnel | Inline booking CTAs send guests to an external Octorate domain | `buildOctorateUrl.ts` builds all booking URLs to `https://book.octorate.com/octobook/site/reservation/result.xhtml`. On `RoomDetailContent.tsx`, clicking either NR or Flex plan CTA redirects via `window.location.assign` to `book.octorate.com`. Room detail page has a native HTML date/pax picker that correctly prefills the Octorate URL with room rate codes. | A room-level page structure that pushes into an embedded, mobile-friendly Octorate flow without sending users to a visibly different site experience | minor-gap | apps/brikette/src/utils/buildOctorateUrl.ts, apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx | The funnel foundation is substantially in place: native date/pax picker, room-specific rate codes, GA4 `select_item` tracking on CTA click. The gap is the external domain handoff at the point of commitment. Octorate's "custom page" option may allow on-domain or inline-modal resolution. |
| Room-Level Booking Funnel | room-level-booking-funnel | StickyBookNow floating CTA on room detail page does not preselect the room | `StickyBookNow.tsx` (packages/ui) builds its deep-link to `calendar.xhtml` (date picker start) with no room code — the room context from the page is lost. Inline `RoomCard` CTAs correctly route to `result.xhtml` with room and rate codes preselected. The most persistent, visible CTA on the room detail page drops the guest back to a generic booking entry point. | A room-level page structure that pushes into an embedded, mobile-friendly Octorate flow without sending users to a visibly different site experience | minor-gap | packages/ui/src/organisms/StickyBookNow.tsx, apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx | `StickyBookNow` accepts `checkIn`, `checkOut`, `adults` props but no room/rate-code prop. Fixing requires passing the room's `octorateRateCode` into `StickyBookNow` from `RoomDetailContent` and routing to `result.xhtml` instead of `calendar.xhtml`. |
| Direct Booking Conversion | direct-booking-conversion | No on-site price comparison or rate-match defence against OTA undercutting | No Triptease, Hotels Network, or equivalent price-comparison widget in codebase. The "best price guaranteed" badge in `StickyBookNow` and `RoomCard` links to WhatsApp (`wa.me/393287073695`) — a human-mediated guarantee, not a self-serve policy or live rate comparison. `DirectPerksBlock` on `/book` page lists perks above the room grid; no mechanism proves or enforces price parity in-session. | Best price guarantee and/or price match is operationally supported; price comparison that does not force users to leave is treated as a conversion feature | minor-gap | apps/brikette/src/app/[lang]/deals/DealsPageContent.tsx, packages/ui/src/organisms/StickyBookNow.tsx | The WhatsApp link for the guarantee is a human process. Guests who suspect a lower OTA price must leave the site to verify. `/deals` page and `DirectBookingPerks` both articulate the value proposition but cannot prove it in real-time. |
| Direct Booking Conversion | direct-booking-conversion | Direct-booking incentives not visible near primary booking CTA on room detail pages | In `RoomDetailContent.tsx`, `DirectBookingPerks` is rendered after `RoomCard` and the bed description paragraph — below the primary booking action. Render order: h1 → HeroSection → SocialProofSection → BookingDatePicker → RoomCard → bed description → DirectBookingPerks. On the `/book` page, `DirectPerksBlock` correctly appears above the room grid. | Direct-book incentives are continuously visible across the key journey (hero/headers, room pages, booking entry points), not confined to below-fold sections | minor-gap | apps/brikette/src/app/[lang]/rooms/[id]/RoomDetailContent.tsx | The component and copy exist. The gap is render-order only on the room detail page. `/book` page has it right (perks above rooms). Fix is moving `DirectBookingPerks` above `RoomCard` in `RoomDetailContent`. |

## Scan Summary

- World-class domains: 0
- Major gaps: 1
- Minor gaps: 5
- No-data gaps: 0
- Total gap rows emitted: 6

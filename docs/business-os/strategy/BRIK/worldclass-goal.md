---
schema_version: worldclass-goal.v1
business: BRIK

goal_version: 1

singular-goal: "BRIK should have a world-class boutique hostel website for Positano with professional imagery and some level of video material, room-level pages with an embedded Octorate funnel, and a direct-booking CTA hierarchy that outcompetes OTA links."

domains:
  - id: website-imagery-video
    name: Website Imagery & Video
    context: >
      Photography and video across the site — hero shots, room galleries, outdoor/terrace
      imagery, lifestyle content, and at minimum one short video clip (property walkthrough,
      location reel, or atmosphere loop). For a coastal Positano property the visual material
      must convey the location as the primary selling point while keeping a boutique,
      affordable-luxury feel. Excludes booking funnel UX and direct-booking incentive
      messaging (see Room-Level Booking Funnel and Direct Booking Conversion).
    examples:
      - "Passalacqua hotel website (Lake Como) — imagery quality and light direction only; ignore positioning and budget level"
      - La Minervetta Sorrento — authentic sense-of-place photography with short atmospheric video loop
      - "Airbnb Plus listings in Amalfi Coast — high dynamic range, natural light"
      - Generator Hostels video content — short property walkthrough reels embedded on homepage and room pages

  - id: room-level-booking-funnel
    name: Room-Level Booking Funnel
    context: >
      The journey from room/bed listing page through to booking completion. Covers
      information hierarchy, pricing display, availability calendar UX, and how the
      Octorate widget is integrated so it does not feel like a third-party interruption.
      Excludes broader direct-booking incentives and price-match messaging (see
      Direct Booking Conversion).
    examples:
      - Generator Hostels — clean bed-type selector with real-time pricing
      - "Selina properties — room cards with photo, feature list, and inline CTA"
      - Hostelworld top-performer listings — social proof placement within funnel

  - id: direct-booking-conversion
    name: Direct Booking Conversion
    context: >
      Everything that nudges a visitor who found the hostel via OTA or search to book
      direct instead. Covers price-match messaging, loyalty incentives, trust signals,
      and how the direct-booking CTA competes with OTA links appearing elsewhere on the
      page. Excludes room-page information architecture and booking widget UX (see
      Room-Level Booking Funnel).
    examples:
      - Uku Hostel (Porto) — prominent "Book Direct — Best Price" strip
      - "The Student Hotel — member-rate framing on homepage hero"
      - "Beds&Dreams hostels — cancellation policy clarity as conversion lever"

constraints:
  - Coastal Italy (Positano, Amalfi Coast) — imagery, video, and copy must reflect the Mediterranean setting and summer-peak seasonality
  - Boutique / affordable-luxury positioning — benchmark references must not be luxury-only properties with budgets out of reach for a small hostel operator
  - Booking engine is Octorate — funnel recommendations must work within or around the Octorate widget, not require a full engine replacement
  - Primary booking audience is international independent travellers (IIT) aged 25-45, English as lingua franca for the site
  - Video requirement is "some level" — a short atmospheric clip or location reel is sufficient; full-production brand film is out of scope

created: 2026-02-27
last-updated: 2026-02-27
benchmark-status: benchmark-ready
---

# World-Class Goal — BRIK

BRIK is a boutique hostel in Positano on the Amalfi Coast. The goal is a world-class direct-booking website that leverages the location's visual appeal, integrates Octorate seamlessly at room level, and converts visitors away from OTAs.

**When to bump `goal_version`:** increment and reset `benchmark-status: none` when you change singular-goal, any domain (add/remove/edit), or any constraint. Reordering domains or constraints is non-semantic — no bump needed.

**Domain identity warning:** set an explicit `id` on each domain and bump `goal_version` before renaming any domain `name`.

**`last-updated` tracks goal contract changes only** — not benchmark-status.

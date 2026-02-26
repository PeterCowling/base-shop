---
schema_version: worldclass-goal.v1

# WHEN TO UPDATE goal_version:
# Bump goal_version (e.g. 1 → 2) and reset benchmark-status to 'none' whenever
# you change singular-goal OR add/remove any domain. This tells the skill to
# regenerate the research prompt and will block scanning until you paste in a
# fresh benchmark that aligns with the new goal.

# business: Short business identifier. Must match the code used in the BOS.
# Examples: BRIK, PWRB, HBAG, HEAD, PET
business: BRIK

# goal_version: Integer. Start at 1. Increment whenever singular-goal or domains
# change. Changing this value triggers research-prompt regeneration and blocks
# any scan run until a fresh benchmark is pasted in.
goal_version: 1

# singular-goal: One sentence. What does world-class look like for THIS business
# RIGHT NOW? Keep it concrete and time-bound — it will change as the business
# matures. Wrap in double quotes if it contains colons or special characters.
singular-goal: "World-class boutique hostel website for Positano — direct booking optimised, professional imagery, room-level conversion funnel"

# domains: List of focus areas where benchmarking will be done.
# Each entry has:
#   name     — short label used in research prompts and reports
#   context  — 1-3 sentences explaining what this domain covers for THIS business
#   examples — 1-3 world-class reference points the operator can name (people,
#              brands, specific URLs, or descriptive phrases)
domains:
  - name: Website Imagery
    context: >
      Photography and visual presentation across the site — hero shots, room
      galleries, outdoor/terrace imagery, and lifestyle content. For a coastal
      Positano property the imagery must convey the location as the primary
      selling point while keeping the boutique, affordable-luxury feel.
    examples:
      - Passalacqua hotel website (Lake Como) — editorial-quality room imagery
      - La Minervetta Sorrento — authentic sense-of-place photography
      - "Airbnb Plus listings in Amalfi Coast — high dynamic range, natural light"

  - name: Room-Level Booking Funnel
    context: >
      The journey from room/bed listing page through to booking completion.
      Covers information hierarchy, pricing display, availability calendar UX,
      and how the Octorate widget is integrated so it does not feel like a
      third-party interruption.
    examples:
      - Generator Hostels — clean bed-type selector with real-time pricing
      - "Selina properties — room cards with photo, feature list, and inline CTA"
      - Hostelworld top-performer listings — social proof placement within funnel

  - name: Direct Booking Conversion
    context: >
      Everything that nudges a visitor who found the hostel via OTA or search to
      book direct instead. Covers price-match messaging, loyalty incentives,
      trust signals, and how the direct-booking CTA competes with OTA links
      appearing elsewhere on the page.
    examples:
      - Uku Hostel (Porto) — prominent "Book Direct — Best Price" strip
      - "The Student Hotel — member-rate framing on homepage hero"
      - "Beds&Dreams hostels — cancellation policy clarity as conversion lever"

# constraints: List of hard constraints the benchmark and recommendations must
# respect. Use plain sentences. Examples: budget level, target audience, season,
# platform/tool lock-in, language, legal requirements.
constraints:
  - Coastal Italy (Positano, Amalfi Coast) — imagery and copy must reflect the
    Mediterranean setting and summer-peak seasonality
  - Boutique / affordable-luxury positioning — benchmark references must not be
    luxury-only properties with budgets out of reach for a small hostel operator
  - Booking engine is Octorate — funnel recommendations must work within or
    around the Octorate widget, not require a full engine replacement
  - Primary booking audience is international independent travellers (IIT) aged
    25-45, English as lingua franca for the site

# created: Date this file was first committed (YYYY-MM-DD)
created: 2026-02-26

# last-updated: Update this whenever any field above changes (YYYY-MM-DD)
last-updated: 2026-02-26

# benchmark-status: Current state of the benchmark for this goal_version.
#   none                  — no benchmark exists yet for the current goal_version
#   research-prompt-ready — research prompt has been generated; operator has not
#                           yet run it and pasted the benchmark back in
#   benchmark-ready       — benchmark is pasted in and aligned with the current
#                           goal_version; scans may proceed
benchmark-status: none
---

<!--
=============================================================================
WORKED EXAMPLE — BRIK (above frontmatter)
The frontmatter block above is a complete worked example for the BRIK business.
When creating a file for a different business, copy the BLANK TEMPLATE section
below and fill it in. Do not edit this example file directly.
=============================================================================
-->

# World-Class Goal — BRIK

This file defines the world-class benchmark target for BRIK. It is the input
to the `lp-do-worldclass` skill. The skill uses `singular-goal` and `domains`
to generate a structured research prompt; once the operator pastes the benchmark
results back in, scans compare current state against that benchmark.

**When you change the goal:** bump `goal_version`, reset `benchmark-status` to
`none`, and re-run the skill to get a fresh research prompt. Do not run a scan
until the new benchmark is in place.

---

<!--
=============================================================================
BLANK TEMPLATE — copy this section to create a per-business goal artifact
File path convention: docs/business-os/strategy/<BIZ>/worldclass-goal.md
=============================================================================

---
schema_version: worldclass-goal.v1

# WHEN TO UPDATE goal_version:
# Bump goal_version and reset benchmark-status to 'none' whenever you change
# singular-goal OR add/remove any domain.

business: <BUSINESS_CODE>

goal_version: 1

singular-goal: "<One sentence — what does world-class look like for this business right now?>"

domains:
  - name: <Domain Name>
    context: >
      <1-3 sentences: what does this domain cover for this specific business?>
    examples:
      - <World-class reference point 1>
      - <World-class reference point 2>

  - name: <Domain Name>
    context: >
      <1-3 sentences>
    examples:
      - <Reference point 1>

constraints:
  - <Hard constraint 1 — e.g. budget level, geography, platform lock-in>
  - <Hard constraint 2>

created: <YYYY-MM-DD>
last-updated: <YYYY-MM-DD>

benchmark-status: none
---

# World-Class Goal — <BUSINESS_CODE>

Brief description of the business and why this goal was set.

**When you change the goal:** bump `goal_version`, reset `benchmark-status` to
`none`, and re-run the skill to get a fresh research prompt.

=============================================================================
-->

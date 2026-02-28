---
schema_version: worldclass-goal.v1

# WHEN TO UPDATE goal_version:
# Bump goal_version (e.g. 1 → 2) and reset benchmark-status to 'none' whenever
# you change ANY of the following:
#   • singular-goal
#   • any domain's id, name, context, or examples
#   • add or remove domains (reordering is non-semantic — goal_contract_hash uses sorted order)
#   • any constraint that would change what "world-class" means for this business
#
# goal_version is the research contract version — it controls benchmark currency.
# Changing it forces research-prompt regeneration and blocks scanning until a
# fresh benchmark aligned with the new goal is pasted in.
#
# NOTE: The skill updates benchmark-status automatically. That write does NOT
# require a goal_version bump or a last-updated change.

business: BRIK

goal_version: 1

# singular-goal: One sentence. What does world-class look like for THIS business
# RIGHT NOW? Keep it concrete, time-bound, and include 1-2 observable markers.
singular-goal: "BRIK should have a world-class boutique hostel website for Positano with professional imagery, room-level pages with an embedded Octorate funnel, and a direct-booking CTA hierarchy that outcompetes OTA links."

domains:
  # id is optional but recommended for stability. If provided, it is used verbatim
  # as domain_id in dispatch keys and benchmark headings. If absent, domain_id is
  # derived from name (lowercased, spaces → hyphens).
  # IMPORTANT: domain name is identity-bearing if no explicit id is set. Renaming
  # a domain without bumping goal_version corrupts dispatch clustering keys and
  # causes benchmark domain mismatches. Always bump goal_version when renaming.
  - id: website-imagery
    name: Website Imagery
    context: >
      Photography and visual presentation across the site — hero shots, room
      galleries, outdoor/terrace imagery, and lifestyle content. For a coastal
      Positano property the imagery must convey the location as the primary
      selling point while keeping the boutique, affordable-luxury feel.
      Excludes booking funnel UX and direct-booking incentive messaging
      (see Room-Level Booking Funnel and Direct Booking Conversion).
    examples:
      - "Passalacqua hotel website (Lake Como) — imagery quality and light direction only; ignore positioning and budget level"
      - La Minervetta Sorrento — authentic sense-of-place photography
      - "Airbnb Plus listings in Amalfi Coast — high dynamic range, natural light"

  - id: room-level-booking-funnel
    name: Room-Level Booking Funnel
    context: >
      The journey from room/bed listing page through to booking completion.
      Covers information hierarchy, pricing display, availability calendar UX,
      and how the Octorate widget is integrated so it does not feel like a
      third-party interruption. Excludes broader direct-booking incentives
      and price-match messaging (see Direct Booking Conversion).
    examples:
      - Generator Hostels — clean bed-type selector with real-time pricing
      - "Selina properties — room cards with photo, feature list, and inline CTA"
      - Hostelworld top-performer listings — social proof placement within funnel

  - id: direct-booking-conversion
    name: Direct Booking Conversion
    context: >
      Everything that nudges a visitor who found the hostel via OTA or search to
      book direct instead. Covers price-match messaging, loyalty incentives,
      trust signals, and how the direct-booking CTA competes with OTA links
      appearing elsewhere on the page. Excludes room-page information architecture
      and booking widget UX (see Room-Level Booking Funnel).
    examples:
      - Uku Hostel (Porto) — prominent "Book Direct — Best Price" strip
      - "The Student Hotel — member-rate framing on homepage hero"
      - "Beds&Dreams hostels — cancellation policy clarity as conversion lever"

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

# last-updated: Update ONLY when singular-goal, domains, or constraints change.
# Do NOT update when benchmark-status changes — that is an automated write.
last-updated: 2026-02-26

# benchmark-status: Managed by the skill. Reset to 'none' manually only when
# bumping goal_version. Do not change to other values by hand.
#   none                  — no benchmark for the current goal_version
#   research-prompt-ready — prompt generated; operator has not yet pasted benchmark
#   benchmark-ready       — benchmark aligned with goal_version; scans may proceed
benchmark-status: none
---

<!--
=============================================================================
WORKED EXAMPLE — BRIK (frontmatter above)
The frontmatter block above is a complete worked example for the BRIK business.
When creating a per-business file, use the BLANK TEMPLATE reference below.

IMPORTANT: Per-business goal artifacts must contain only ONE frontmatter block
at the top of the file. Do not paste additional --- blocks or the blank template
structure into a per-business file — that creates parsing ambiguity.
=============================================================================
-->

# World-Class Goal — BRIK

This file defines the world-class benchmark target for BRIK. It is the input
to the `lp-do-worldclass` skill. The skill uses `singular-goal` and `domains`
to generate a structured research prompt; once the operator pastes the benchmark
results back in, scans compare current state against that benchmark.

**When to bump `goal_version`:** increment and reset `benchmark-status: none` when you change any of:
- `singular-goal`
- any domain's `id`, `name`, `context`, or `examples`
- add or remove domains
- any constraint that changes what world-class means for this business

**Reordering is non-semantic:** reordering domains or constraints in the YAML does not require a `goal_version` bump. The `goal_contract_hash` sorts domain ids and constraints before hashing, so the hash is identical regardless of list order.

**Domain identity warning:** `id` (or `name` if no `id` is set) is used in dispatch clustering keys and benchmark headings. Renaming a domain `name` without setting a stable `id` first will silently change domain_id — corrupting deduplication and clustering for any existing dispatches. Always set an explicit `id` on each domain and bump `goal_version` before renaming `name`.

**`last-updated` tracks goal contract changes only** — singular-goal, domains, constraints. It does not update when `benchmark-status` changes. Automated benchmark-status writes by the skill must not touch `last-updated`.

**YAML comments are ephemeral:** Automated writes to `benchmark-status` will typically preserve comments when done by an agent Edit tool, but a YAML parse-and-reserialize would strip them. The authoritative operator guidance lives in this Markdown body, not in the frontmatter comments.

---

<!--
=============================================================================
BLANK TEMPLATE — reference only
File path for biz-level goals:  docs/business-os/strategy/<BIZ>/worldclass-goal.md
File path for app-level goals:  docs/business-os/strategy/<BIZ>/apps/<APP>/worldclass-goal.md

Copy ONLY the YAML fields below into a new per-business or per-app file. Do not copy
this comment block. Per-business/app files must have exactly one --- frontmatter
block at the top and a short Markdown body below.

YAML FIELDS:

schema_version: worldclass-goal.v1
business: <BUSINESS_CODE>
# app: <app-name>   # Required when goal was created via --app <APP>.
#                   # Must match the app identifier in businesses.json.
#                   # Omit this field entirely for biz-level goals (--biz mode).
goal_version: 1
singular-goal: "<Aspirational framing — e.g. '<BIZ> should have world-class [X] with [observable markers that confirm it]'>"

domains:
  - id: <lowercase-hyphenated-id>    # recommended; derived from name if absent
    name: <Domain Name>
    context: >
      <1-3 sentences: what this domain covers for this business.
      Add one exclusion line if adjacent domains overlap.>
    examples:
      - <World-class reference point 1>
      - <World-class reference point 2>

constraints:
  - <Hard geographic/positioning/platform constraint>
  - <Hard audience/language constraint>
  # Optional: implementation constraints if they are real hard bounds:
  #   - No full site rebuild this cycle; improvements must fit existing stack
  #   - Photography budget cap: €X
  #   - Site must remain English-first; Italian optional
  #   - Must comply with EU consumer rules and GDPR; avoid dark patterns

created: <YYYY-MM-DD>
last-updated: <YYYY-MM-DD>
benchmark-status: none

MARKDOWN BODY (copy and adapt):

# World-Class Goal — <BUSINESS_CODE>

Brief description of the business and why this goal was set.

**When to bump `goal_version`:** increment and reset `benchmark-status: none`
when you change singular-goal, any domain (add/remove/edit), or any constraint.
Reordering domains or constraints is non-semantic — no bump needed.

**Domain identity warning:** set an explicit `id` on each domain and bump
`goal_version` before renaming any domain `name`.

**`last-updated` tracks goal contract changes only** — not benchmark-status.
=============================================================================
-->

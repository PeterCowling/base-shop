---
schema_version: worldclass-goal.v1

# WHEN TO UPDATE goal_version:
# Bump goal_version (e.g. 1 → 2) and reset benchmark-status to 'none' whenever
# you change ANY of the following:
#   • singular-goal
#   • any domain's id, name, context, or examples
#   • add or remove domains
#   • any constraint that would change what "world-class" means for this business

business: HBAG

goal_version: 2

singular-goal: "Caryina's direct website should generate its first €1,000 in revenue: the site is fully launch-ready with a working purchase flow, a cold visitor arriving from TikTok or Instagram trusts the shop enough to buy at €80–€150, and the launch is tracked well enough to know which products and channels drove the first sales — building the foundation to expand to Etsy with momentum."

domains:
  - id: launch-readiness
    name: Launch Readiness
    context: >
      Whether the site is actually ready to accept and fulfil a real order today.
      Covers the end-to-end purchase flow (product page → checkout → payment → order
      confirmation), payment provider integration, order notification and fulfilment
      handoff, error states, and any blockers that would prevent a stranger from
      successfully completing a purchase. Excludes visual design quality and
      marketing content (see First Visitor Conversion).
    examples:
      - Shopify launch checklist — systematic pre-launch verification of payment, shipping, taxes, and test orders
      - Gorgias launch readiness — confirms support channels, order routing, and post-purchase flows before going live
      - Stripe Atlas DTC launch — payment methods live, webhooks tested, refund flow confirmed
      - By Far DTC launch — direct website fully operable before any paid or social traffic sent

  - id: first-visitor-conversion
    name: First Visitor Conversion
    context: >
      Whether a cold visitor arriving from TikTok or Instagram — with no prior
      awareness of Caryina — trusts the shop and completes a purchase at €80–€150.
      Covers trust signals for an unknown brand, product presentation credibility,
      mobile UX from landing to checkout, and friction reduction at the buy decision.
      The primary visitor has 3–7 day consideration cycle and is on mobile.
      Excludes post-purchase flows and measurement (see Launch Measurement).
    examples:
      - Mejuri DTC launch — unknown brand to €50M via trust-forward product pages and frictionless mobile checkout
      - Astrid & Miyu — cold social traffic converted via dense trust stack (reviews, warranty, returns) near CTA
      - Daisy London — risk reversal and gifting clarity that converts a first-time visitor at ~£100
      - Monica Vinader — proof-of-quality language (material specs, warranty) that justifies price for an unknown brand

  - id: launch-measurement
    name: Launch Measurement
    context: >
      Whether the operator can tell, after the first sales arrive, which products
      sold, which channels drove buyers, and what the conversion funnel looked like.
      Covers GA4 or equivalent event tracking, order attribution, and the minimum
      viable measurement setup needed to make an informed decision about what to
      double down on — including what to bring to Etsy. Excludes the purchase
      flow itself (see Launch Readiness) and trust/UX (see First Visitor Conversion).
    examples:
      - GA4 e-commerce tracking — purchase events, product impressions, and funnel drop-off visible from day one
      - Shopify Analytics — source/medium attribution on first orders to identify which social channel converted
      - Triple Whale (DTC attribution) — social-first brands use this to see TikTok vs Instagram contribution
      - Linjer DTC launch — measurement set up before launch so first-week data informs restock and channel decisions

constraints:
  - Price point €80–€150 — benchmark references must be independent premium DTC brands, not LVMH-tier luxury houses
  - Mobile-first — TikTok and Instagram are the primary discovery channels; desktop experience is secondary
  - Founder-led small operation — world-class benchmarks must be achievable without a large team or agency budget
  - Italian design provenance (Positano) — a genuine brand differentiator that should be legible in trust and conversion signals
  - No physical retail — the website carries full conversion responsibility; there is no store to fall back on
  - Direct website is the launch channel — Etsy is a planned next step once direct-site momentum is established; do not scope recommendations for Etsy

created: 2026-02-28
last-updated: 2026-02-28
benchmark-status: benchmark-ready
---

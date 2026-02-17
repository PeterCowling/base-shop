---
Prompt-ID: BRAND-DR-01
Stage: BD-2 (Competitive Positioning)
Business: {{BIZ}}
As-of: {{DATE}}
Evidence-pack-target: docs/business-os/evidence/{{BIZ}}/{{YYYY-MM}}/
---

Objective:
Identify USP whitespace, differentiation gaps, and competitor messaging patterns for {{BIZ}}
in {{MARKET}} to populate competitive-positioning.user.md.

Sources to consult (in order):
1. S2 market intel: docs/business-os/market-research/{{BIZ}}/latest.user.md — competitors listed
2. Competitor product/booking pages (top 3-5 from market intel): pricing, features, guarantees
3. Review platforms: TripAdvisor, Google Maps, Booking.com for {{BIZ}} and top 3 competitors
4. Meta Ad Library: search {{COMPETITOR_NAMES}} for active ads in {{TARGET_COUNTRY}}
5. Instagram/TikTok: search {{RELEVANT_HASHTAGS}} for visual aesthetic and demographic data

Compliance: Extract ≤3 sentences per review quote. Save quotes + ad screenshots to
evidence-pack-target. Do not bulk-scrape. Attribute every quote with platform, URL, and date accessed.
Store only the minimum evidence needed to support cited claims. No PII.

Output format:
1. USP Whitespace — 3-5 bullet points on what no competitor clearly owns
2. Differentiation Matrix — table: Feature/Claim vs ≥3 competitors (Y/N/Partial)
3. Competitor Voice & Tone Audit — for each competitor: tone label + 2-3 example phrases
4. Visual Aesthetic Benchmarks — palette mood, typography style, imagery type per competitor
5. Customer Language Harvest — ≥20 verbatim quotes (pain/delight/surprise) with platform attribution
6. Claims Available for Proof — table: claim, source in evidence pack, confidence (High/Med/Low)
7. Evidence Register — URL + access date for every external citation

Stop conditions (sufficient when):
- ≥3 competitors in Differentiation Matrix
- ≥20 quotes in Customer Language Harvest
- ≥1 ad creative sample per competitor (or confirmed "no ads running")
- Visual benchmark documented for all 3 competitors
- All claims in Evidence Register have a URL

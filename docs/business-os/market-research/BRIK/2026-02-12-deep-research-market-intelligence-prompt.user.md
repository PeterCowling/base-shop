---
Type: Deep-Research-Prompt
Status: Active
Business: BRIK
Date: 2026-02-12
Owner: Pete
Target-Output: docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md
---

# BRIK Deep Research Prompt (Market Intelligence)

Use the prompt below directly in Deep Research.

```text
You are a market intelligence analyst for a venture studio launching B2C consumer-product businesses.

Task:
Produce a decision-grade Market Intelligence Pack for:
- Business code: BRIK
- Business name: Brikette
- Region: Europe (primary country: Italy)
- Launch-surface mode: website-live (`website-live` or `pre-website`)

Input packet:
- Business idea: Multilingual ecommerce platform for hostel bookings and travel experiences.
- Products and specs: Hostel booking journeys, travel experience pages, and related conversion/support surfaces across multiple locales.
- Initial target customer: Travelers evaluating and booking hostel stays and related experiences.
- Planned channels: Direct website traffic, search/content acquisition, referral traffic, and measured paid demand (after baseline instrumentation is validated).
- Budget guardrails: Do not scale paid acquisition until conversion and measurement baselines are reliable.
- Stock timeline: Not applicable (service/booking business, no physical inventory gate).
- Historical performance baseline (mandatory): docs/business-os/strategy/BRIK/2026-02-12-historical-performance-baseline.user.md
- Known constraints/non-negotiables:
  - Analytics and visibility baseline is currently incomplete in canonical planning docs.
  - GA4 is missing/partial; Cloudflare and historical bookings/cancellations data must be used as primary internal evidence.
  - Startup-loop decisions must be measurement-led.
  - Operational reliability for reception/booking-support flows must be maintained.

Research requirements:
1) Build a current competitor map (direct, adjacent, substitutes) for this region and channels.
2) Extract pricing, offer structure, positioning, and channel tactics from competitors.
3) Estimate demand signals (search/social/marketplace/proxy signals) and seasonality.
4) Propose practical customer segment sequencing (who to target first, second, third).
5) Produce unit-economics priors: AOV, CAC/CPC, return rates, margin ranges.
6) Derive website design implications (information architecture, PDP requirements, checkout/payment expectations, trust signals, support patterns).
7) Derive product design implications (must-have features, compatibility/fit needs, failure modes, quality requirements, packaging implications).
8) Identify legal/claims constraints relevant to this category and region.
9) Propose 90-day outcomes and leading indicators that maximize speed-to-first-sales.
10) Define first-14-day validation tests that can quickly falsify bad assumptions.

Output format (strict):
A) Executive summary (max 12 bullets)
B) Business context and explicit assumptions
C) Market size and demand signals table (with confidence labels)
D) Competitor map table (direct/adjacent/substitute)
E) Pricing and offer benchmark table
F) Segment and JTBD section (primary + secondary sequence)
G) Unit economics priors table (AOV/CAC/CVR/returns/margin ranges)
H) Channel strategy implications (first 90 days)
I) Website design implications (clear, implementation-ready checklist)
J) Product design implications (clear, implementation-ready checklist)
K) Regulatory/claims constraints and red lines
L) Proposed 90-day outcome contract (outcome, baseline, target, by, owner, leading indicators, decision links)
M) First-14-day validation plan (tests + thresholds + re-forecast triggers)
N) Assumptions register (assumption, evidence, confidence, impact)
O) Risk register (risk, why it matters, mitigation)
P) Source list with URL + access date

Rules:
- Do not invent data.
- Every numeric claim must include a citation or be explicitly labeled as an assumption.
- Explicitly tag each key claim as observed or inferred.
- Prefer recent, region-relevant sources.
- Optimize recommendations for startup speed-to-first-sales.
- If evidence is weak or conflicting, say so clearly and propose a fast validation test.
- Existing-business rule: incorporate historical bookings/cancellations/cloudflare baseline into all strategic recommendations.
- If mandatory baseline input is absent or empty, return `Status: BLOCKED` with exact missing data fields before giving recommendations.
```

After Deep Research returns:
1. Save result to `docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md` (or newer dated equivalent).
2. Set status to `Active` when decision-grade.
3. Render HTML companion:
   `pnpm docs:render-user-html -- docs/business-os/market-research/BRIK/2026-02-12-market-intelligence.user.md`

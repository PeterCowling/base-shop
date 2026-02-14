---
Type: Template
Status: Reference
Domain: Business-OS
Last-reviewed: 2026-02-12
---

# Deep Research Prompt — Market Intelligence Pack

Replace all `{{...}}` placeholders, then submit to Deep Research.

```text
You are a market intelligence analyst for a venture studio launching B2C consumer-product businesses.

Task:
Produce a decision-grade Market Intelligence Pack for:
- Business code: {{BUSINESS_CODE}}
- Business name: {{BUSINESS_NAME}}
- Region: {{REGION}} (primary country: {{COUNTRY}})
- Launch-surface mode: {{LAUNCH_SURFACE}} (`website-live` or `pre-website`)

Input packet:
- Business idea: {{BUSINESS_IDEA}}
- Products and specs: {{PRODUCT_LIST}}
- Initial target customer: {{INITIAL_ICP}}
- Planned channels: {{PLANNED_CHANNELS}}
- Budget guardrails: {{BUDGET_GUARDRAILS}}
- Stock timeline: {{STOCK_TIMELINE}}
- Known constraints/non-negotiables: {{CONSTRAINTS}}

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
- Explicitly tag each key claim as `observed` or `inferred`.
- Prefer recent, region-relevant sources.
- Optimize recommendations for startup speed-to-first-sales.
- If evidence is weak or conflicting, say so clearly and propose a fast validation test.
```

## Expected outcome definition (must be included in output)

An outcome is valid only if it includes:
- Outcome statement
- Baseline
- Target
- By (date)
- Owner
- Leading indicators
- Decision link
